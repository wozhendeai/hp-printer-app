"use client";

import { useState, useCallback, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  performScan,
  SCAN_SIZES,
  type ScanSettings,
  type ScanColorMode,
  type ScanResolution,
} from "@/app/_lib/printer-api";
import { submitPrintJob } from "@/app/print/_lib/print-api";
import { jobKeys } from "@/app/_lib/queries/keys";
import type { PrintSettings } from "@/app/print/_components/print-settings";
import type { CopySettings, CopyState } from "./copy-types";

// Map copy quality to scan resolution
const QUALITY_TO_RESOLUTION: Record<CopySettings["quality"], ScanResolution> = {
  draft: 150,
  normal: 300,
  best: 600,
};

// Map copy color mode to scan color mode
const COLOR_TO_SCAN: Record<CopySettings["colorMode"], ScanColorMode> = {
  color: "RGB24",
  bw: "Grayscale8",
};

function mapCopyToScanSettings(settings: CopySettings): ScanSettings {
  return {
    intent: "Document",
    source: settings.source,
    colorMode: COLOR_TO_SCAN[settings.colorMode],
    resolution: QUALITY_TO_RESOLUTION[settings.quality],
    format: "image/jpeg",
    width: SCAN_SIZES.letter.width,
    height: SCAN_SIZES.letter.height,
  };
}

function mapCopyToPrintSettings(
  settings: CopySettings,
  copies: number,
): PrintSettings {
  return {
    copies,
    colorMode: settings.colorMode,
    duplex: settings.duplex,
    quality: settings.quality,
    paperSize: "letter",
    paperType: "plain",
  };
}

interface CopyParams {
  copies: number;
  settings: CopySettings;
}

export interface UseCopyResult {
  state: CopyState;
  startCopy: (copies: number, settings: CopySettings) => Promise<void>;
  cancel: () => void;
  reset: () => void;
}

export function useCopy(): UseCopyResult {
  const [state, setState] = useState<CopyState>({ status: "idle" });
  // Track soft cancellation - performScan doesn't support AbortSignal
  const isCancelledRef = useRef(false);
  const queryClient = useQueryClient();

  const copyMutation = useMutation({
    mutationFn: async ({ copies, settings }: CopyParams) => {
      isCancelledRef.current = false;

      // Phase 1: Scanning
      setState({ status: "scanning", progress: "Starting scan..." });

      const scanSettings = mapCopyToScanSettings(settings);

      const blob = await performScan(scanSettings, (scanState) => {
        if (!isCancelledRef.current) {
          setState({ status: "scanning", progress: scanState });
        }
      });

      if (isCancelledRef.current) {
        throw new Error("Cancelled");
      }

      // Phase 2: Printing
      setState({ status: "printing", currentCopy: 1, totalCopies: copies });

      const printSettings = mapCopyToPrintSettings(settings, copies);
      const file = new File([blob], "copy.jpg", { type: "image/jpeg" });

      await submitPrintJob(file, printSettings);

      if (isCancelledRef.current) {
        throw new Error("Cancelled");
      }

      return copies;
    },
    onSuccess: (copies) => {
      setState({ status: "complete", copies });
      queryClient.invalidateQueries({ queryKey: jobKeys.all });
    },
    onError: (error) => {
      if (isCancelledRef.current) {
        setState({ status: "idle" });
        return;
      }

      const message = error instanceof Error ? error.message : "Copy failed";
      const phase = state.status === "scanning" ? "scan" : "print";

      setState({ status: "error", message, phase });
    },
  });

  const startCopy = useCallback(
    async (copies: number, settings: CopySettings) => {
      await copyMutation.mutateAsync({ copies, settings });
    },
    [copyMutation],
  );

  const cancel = useCallback(() => {
    isCancelledRef.current = true;
    copyMutation.reset();
    setState({ status: "idle" });
  }, [copyMutation]);

  const reset = useCallback(() => {
    isCancelledRef.current = false;
    copyMutation.reset();
    setState({ status: "idle" });
  }, [copyMutation]);

  return { state, startCopy, cancel, reset };
}
