"use client";

import { useState, useCallback } from "react";
import { Loader2, FileStack, AlertCircle } from "lucide-react";
import type { ScannerStatus, CopySettings } from "@/lib/types";
import { DEFAULT_COPY_SETTINGS } from "@/lib/constants";
import { useScannerStatus } from "@/lib/queries/printer";
import { useCopy } from "../_lib/use-copy";
import { useRecentCopies } from "../_lib/use-recent-copies";
import { CopyCounter } from "./copy-counter";
import { CopySettingsForm } from "./copy-settings";
import { CopyStatus } from "./copy-status";
import { CopyGuide } from "./copy-guide";
import { RecentCopies } from "./recent-copies";
import { cn } from "@/lib/utils";

export function Copier() {
  const [copies, setCopies] = useState(1);
  const [settings, setSettings] = useState<CopySettings>(DEFAULT_COPY_SETTINGS);

  const {
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
  } = useCopy();
  const { recentCopies, addCopy } = useRecentCopies();

  // Poll scanner status via TanStack Query
  const { data: scannerStatus, error: connectionError } = useScannerStatus({
    pollInterval: 3000,
  });

  // Track completed copies
  const handleStartCopy = useCallback(async () => {
    try {
      await startCopy(copies, settings);
      addCopy({ copies, settings, status: "completed" });
    } catch {
      addCopy({ copies, settings, status: "failed" });
    }
  }, [copies, settings, startCopy, addCopy]);

  const isIdle = phase === "idle" && !isComplete && !error;
  const scannerStopped = scannerStatus?.state === "stopped";
  const canCopy = isIdle && !scannerStopped && !connectionError;

  // Show status component when active or completed/errored
  const showStatus = isScanning || isPrinting || isComplete || error;

  return (
    <div className="w-full max-w-lg mx-auto px-4 py-6 space-y-4">
      {/* Scanner Status Badge */}
      <div className="flex items-center justify-between">
        <ScannerStatusBadge status={scannerStatus} error={connectionError} />
      </div>

      {/* Copy Counter or Status */}
      {isIdle && !showStatus ? (
        <CopyCounter
          value={copies}
          onChange={setCopies}
          onStartCopy={handleStartCopy}
          disabled={!canCopy}
        />
      ) : (
        <CopyStatus
          isScanning={isScanning}
          isPrinting={isPrinting}
          isComplete={isComplete}
          error={error}
          errorPhase={errorPhase}
          scanProgress={scanProgress}
          printProgress={printProgress}
          completedCopies={completedCopies}
          onCancel={cancel}
          onReset={reset}
        />
      )}

      {/* Settings (only when idle) */}
      {isIdle && !showStatus && (
        <CopySettingsForm
          settings={settings}
          onChange={setSettings}
          disabled={!canCopy}
        />
      )}

      {/* Copy Guide (only when idle) */}
      {isIdle && !showStatus && <CopyGuide />}

      {/* Recent Copies (idle or complete) */}
      {(isIdle || isComplete) && <RecentCopies copies={recentCopies} />}
    </div>
  );
}

function ScannerStatusBadge({
  status,
  error,
}: {
  status: ScannerStatus | null;
  error: string | null;
}) {
  if (error) {
    return (
      <div className="flex items-center gap-2 text-sm text-status-error">
        <AlertCircle className="size-4" />
        <span>{error}</span>
      </div>
    );
  }

  if (!status) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        <span>Connecting...</span>
      </div>
    );
  }

  const stateConfig = {
    idle: { color: "bg-status-ready", label: "Ready" },
    processing: { color: "bg-status-warning", label: "Busy" },
    stopped: { color: "bg-status-error", label: "Stopped" },
  };

  const adfConfig = {
    empty: { label: null, icon: null },
    loaded: { label: "Documents in ADF", icon: FileStack },
    jam: { label: "ADF Jam", icon: AlertCircle },
  };

  const stateInfo = stateConfig[status.state];
  const adfInfo = adfConfig[status.adfState];

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2">
        <div className={cn("size-2 rounded-full", stateInfo.color)} />
        <span className="text-sm font-medium">{stateInfo.label}</span>
      </div>
      {adfInfo.label && (
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          {adfInfo.icon && <adfInfo.icon className="size-4" />}
          <span>{adfInfo.label}</span>
        </div>
      )}
    </div>
  );
}
