// Hook for managing copy operations (scan + print).
"use client";

import { useState, useCallback, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { performScan } from "@/lib/api/printer";
import { submitPrintJob } from "@/lib/api/jobs";
import { jobKeys } from "@/lib/queries/keys";
import type {
  ScanSettings,
  ScanColorMode,
  ScanResolution,
  PrintSettings,
  CopySettings,
} from "@/lib/types";
import { SCAN_SIZES } from "@/lib/constants";
import type { CopyPhase, CopyErrorPhase } from "./types";

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

export interface UseCopyResult {
  phase: CopyPhase;
  isScanning: boolean;
  isPrinting: boolean;
  isComplete: boolean;
  error: Error | null;
  errorPhase: CopyErrorPhase | null;
  completedCopies: number | null;
  scanProgress: string | null;
  printProgress: { current: number; total: number } | null;
  startCopy: (copies: number, settings: CopySettings) => Promise<void>;
  cancel: () => void;
  reset: () => void;
}

export function useCopy(): UseCopyResult {
  const [phase, setPhase] = useState<CopyPhase>("idle");
  const [errorPhase, setErrorPhase] = useState<CopyErrorPhase | null>(null);
  const [completedCopies, setCompletedCopies] = useState<number | null>(null);
  const [scanProgress, setScanProgress] = useState<string | null>(null);
  const [printProgress, setPrintProgress] = useState<{
    current: number;
    total: number;
  } | null>(null);

  const isCancelledRef = useRef(false);
  const queryClient = useQueryClient();

  // Scan mutation
  const scanMutation = useMutation({
    mutationFn: async (settings: ScanSettings) => {
      return performScan(settings, (state) => {
        if (!isCancelledRef.current) {
          setScanProgress(state);
        }
      });
    },
  });

  // Print mutation
  const printMutation = useMutation({
    mutationFn: async ({
      blob,
      settings,
    }: {
      blob: Blob;
      settings: PrintSettings;
    }) => {
      const file = new File([blob], "copy.jpg", { type: "image/jpeg" });
      return submitPrintJob(file, settings);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: jobKeys.all });
    },
  });

  const startCopy = useCallback(
    async (copies: number, copySettings: CopySettings) => {
      isCancelledRef.current = false;
      setErrorPhase(null);
      setCompletedCopies(null);
      setScanProgress("Starting scan...");
      setPrintProgress(null);

      setPhase("scanning");

      try {
        const scanSettings = mapCopyToScanSettings(copySettings);
        const blob = await scanMutation.mutateAsync(scanSettings);

        if (isCancelledRef.current) {
          setPhase("idle");
          return;
        }

        setPhase("printing");
        setPrintProgress({ current: 1, total: copies });
        setScanProgress(null);

        const printSettings = mapCopyToPrintSettings(copySettings, copies);
        await printMutation.mutateAsync({ blob, settings: printSettings });

        if (isCancelledRef.current) {
          setPhase("idle");
          return;
        }

        setCompletedCopies(copies);
        setPhase("idle");
      } catch (error) {
        if (isCancelledRef.current) {
          setPhase("idle");
          return;
        }

        // Determine which phase failed
        setErrorPhase(scanMutation.isError ? "scan" : "print");
        setPhase("idle");
        throw error;
      }
    },
    [scanMutation, printMutation],
  );

  const cancel = useCallback(() => {
    isCancelledRef.current = true;
    scanMutation.reset();
    printMutation.reset();
    setPhase("idle");
    setScanProgress(null);
    setPrintProgress(null);
    setErrorPhase(null);
  }, [scanMutation, printMutation]);

  const reset = useCallback(() => {
    isCancelledRef.current = false;
    scanMutation.reset();
    printMutation.reset();
    setPhase("idle");
    setErrorPhase(null);
    setCompletedCopies(null);
    setScanProgress(null);
    setPrintProgress(null);
  }, [scanMutation, printMutation]);

  // Derived state
  const isScanning = phase === "scanning" && scanMutation.isPending;
  const isPrinting = phase === "printing" && printMutation.isPending;
  const isComplete = phase === "idle" && completedCopies !== null;
  const error = scanMutation.error ?? printMutation.error ?? null;

  return {
    phase,
    isScanning,
    isPrinting,
    isComplete,
    error,
    errorPhase,
    completedCopies,
    scanProgress,
    printProgress,
    startCopy,
    cancel,
    reset,
  };
}
