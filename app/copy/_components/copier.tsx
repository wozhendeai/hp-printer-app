"use client";

import { useState, useEffect, useCallback } from "react";
import { Loader2, FileStack, AlertCircle } from "lucide-react";
import { fetchScannerStatus, type ScannerStatus } from "@/app/_lib/printer-api";
import { useCopy } from "../_lib/use-copy";
import { useRecentCopies } from "../_lib/use-recent-copies";
import { defaultCopySettings, type CopySettings } from "../_lib/copy-types";
import { CopyCounter } from "./copy-counter";
import { CopySettingsForm } from "./copy-settings";
import { CopyStatus } from "./copy-status";
import { CopyGuide } from "./copy-guide";
import { RecentCopies } from "./recent-copies";
import { cn } from "@/lib/utils";

export function Copier() {
  const [copies, setCopies] = useState(1);
  const [settings, setSettings] = useState<CopySettings>(defaultCopySettings);
  const [scannerStatus, setScannerStatus] = useState<ScannerStatus | null>(
    null,
  );
  const [connectionError, setConnectionError] = useState<string | null>(null);

  const { state, startCopy, cancel, reset } = useCopy();
  const { recentCopies, addCopy } = useRecentCopies();

  // Poll scanner status
  useEffect(() => {
    let mounted = true;

    const pollStatus = async () => {
      try {
        const status = await fetchScannerStatus();
        if (mounted) {
          setScannerStatus(status);
          setConnectionError(null);
        }
      } catch {
        if (mounted) {
          setConnectionError("Unable to connect to scanner");
        }
      }
    };

    pollStatus();
    const interval = setInterval(pollStatus, 3000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  // Track completed copies
  const handleStartCopy = useCallback(async () => {
    try {
      await startCopy(copies, settings);
      addCopy({ copies, settings, status: "completed" });
    } catch {
      addCopy({ copies, settings, status: "failed" });
    }
  }, [copies, settings, startCopy, addCopy]);

  const isIdle = state.status === "idle";
  const isComplete = state.status === "complete";
  const scannerStopped = scannerStatus?.state === "Stopped";
  const canCopy = isIdle && !scannerStopped && !connectionError;

  return (
    <div className="w-full max-w-lg mx-auto px-4 py-6 space-y-4">
      {/* Scanner Status Badge */}
      <div className="flex items-center justify-between">
        <ScannerStatusBadge status={scannerStatus} error={connectionError} />
      </div>

      {/* Copy Counter or Status */}
      {isIdle ? (
        <CopyCounter
          value={copies}
          onChange={setCopies}
          onStartCopy={handleStartCopy}
          disabled={!canCopy}
        />
      ) : (
        <CopyStatus state={state} onCancel={cancel} onReset={reset} />
      )}

      {/* Settings (only when idle) */}
      {isIdle && (
        <CopySettingsForm
          settings={settings}
          onChange={setSettings}
          disabled={!canCopy}
        />
      )}

      {/* Copy Guide (only when idle) */}
      {isIdle && <CopyGuide />}

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
    Idle: { color: "bg-status-ready", label: "Ready" },
    Processing: { color: "bg-status-warning", label: "Busy" },
    Stopped: { color: "bg-status-error", label: "Stopped" },
  };

  const adfConfig = {
    ScannerAdfEmpty: { label: null, icon: null },
    ScannerAdfLoaded: { label: "Documents in ADF", icon: FileStack },
    ScannerAdfJam: { label: "ADF Jam", icon: AlertCircle },
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
