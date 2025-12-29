import { AlertCircle, Loader2, ScanLine } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ScanSettings } from "@/app/_lib/printer-api";
import {
  COLOR_MODE_LABELS,
  FORMAT_LABELS,
  SOURCE_LABELS,
  type ScanState,
} from "../_lib/types";

interface ScanAreaProps {
  scanState: ScanState;
  settings: ScanSettings;
  disabled: boolean;
  onScan: () => void;
}

export function ScanArea({
  scanState,
  settings,
  disabled,
  onScan,
}: ScanAreaProps) {
  const sourceLabel = SOURCE_LABELS[settings.source];

  return (
    <button
      onClick={onScan}
      disabled={disabled}
      className={cn(
        "w-full aspect-[4/3] rounded-2xl border-2 border-dashed transition-all duration-200",
        "flex flex-col items-center justify-center gap-3",
        scanState.status === "scanning"
          ? "border-muted-foreground/30 bg-muted/30"
          : scanState.status === "error"
            ? "border-status-error/30 bg-status-error/5"
            : "border-border hover:border-foreground/30 hover:bg-muted/20 active:scale-[0.99]",
      )}
    >
      {scanState.status === "scanning" ? (
        <>
          <div className="relative size-16">
            <ScanLine className="size-16 text-muted-foreground animate-pulse" />
            <Loader2 className="absolute inset-0 m-auto size-8 animate-spin text-foreground" />
          </div>
          <span className="text-lg font-semibold">Scanning...</span>
          <span className="text-sm text-muted-foreground">
            Please wait while the document is scanned
          </span>
        </>
      ) : scanState.status === "complete" ? (
        <>
          <ScanLine className="size-12 text-status-ready" />
          <span className="text-lg font-semibold">Scan Complete</span>
          <span className="text-sm text-muted-foreground">
            Tap to scan again
          </span>
        </>
      ) : scanState.status === "error" ? (
        <>
          <AlertCircle className="size-12 text-status-error" />
          <span className="text-lg font-semibold">Scan Failed</span>
          <span className="text-sm text-muted-foreground">
            {scanState.message}
          </span>
          <span className="text-xs text-muted-foreground mt-1">
            Tap to try again
          </span>
        </>
      ) : (
        <>
          <ScanLine className="size-12 text-muted-foreground" />
          <span className="text-lg font-semibold">Tap to Scan</span>
          <span className="text-sm text-muted-foreground">
            Place document on {sourceLabel}
          </span>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
              {settings.resolution} DPI
            </span>
            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
              {COLOR_MODE_LABELS[settings.colorMode]}
            </span>
            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
              {FORMAT_LABELS[settings.format]}
            </span>
          </div>
        </>
      )}
    </button>
  );
}
