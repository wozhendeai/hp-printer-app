"use client";

import { useState, useCallback, useRef } from "react";
import {
  performScan,
  SCAN_SIZES,
  type ScanSettings,
  type ScanColorMode,
  type ScanResolution,
} from "@/app/_lib/printer-api";
import { submitPrintJob } from "@/app/print/_lib/print-api";
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
    format: "image/jpeg", // JPEG for simpler printing
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

export interface UseCopyResult {
  state: CopyState;
  startCopy: (copies: number, settings: CopySettings) => Promise<void>;
  cancel: () => void;
  reset: () => void;
}

export function useCopy(): UseCopyResult {
  const [state, setState] = useState<CopyState>({ status: "idle" });
  const cancelledRef = useRef(false);

  const startCopy = useCallback(
    async (copies: number, settings: CopySettings) => {
      cancelledRef.current = false;

      // Phase 1: Scanning
      setState({ status: "scanning", progress: "Starting scan..." });

      try {
        const scanSettings = mapCopyToScanSettings(settings);

        const blob = await performScan(scanSettings, (scanState) => {
          if (!cancelledRef.current) {
            setState({ status: "scanning", progress: scanState });
          }
        });

        if (cancelledRef.current) return;

        // Phase 2: Printing
        setState({ status: "printing", currentCopy: 1, totalCopies: copies });

        const printSettings = mapCopyToPrintSettings(settings, copies);

        // Convert blob to File for the print API
        const file = new File([blob], "copy.jpg", { type: "image/jpeg" });

        await submitPrintJob(file, printSettings);

        if (cancelledRef.current) return;

        setState({ status: "complete", copies });
      } catch (error) {
        if (cancelledRef.current) return;

        const message = error instanceof Error ? error.message : "Copy failed";
        const phase = state.status === "scanning" ? "scan" : "print";

        setState({ status: "error", message, phase });
      }
    },
    [state.status],
  );

  const cancel = useCallback(() => {
    cancelledRef.current = true;
    setState({ status: "idle" });
  }, []);

  const reset = useCallback(() => {
    cancelledRef.current = false;
    setState({ status: "idle" });
  }, []);

  return { state, startCopy, cancel, reset };
}
