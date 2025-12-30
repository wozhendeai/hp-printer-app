import { AlertCircle, Loader2, ScanLine } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ScanSettings } from "@/lib/types";
import {
  COLOR_MODE_LABELS,
  FORMAT_LABELS,
  SOURCE_LABELS,
} from "@/lib/constants";

interface ScanAreaProps {
  settings: ScanSettings;
  disabled: boolean;
  onScan: () => void;
  isPending: boolean;
  isSuccess: boolean;
  isError: boolean;
  errorMessage?: string;
}

export function ScanArea({
  settings,
  disabled,
  onScan,
  isPending,
  isSuccess,
  isError,
  errorMessage,
}: ScanAreaProps) {
  const sourceLabel = SOURCE_LABELS[settings.source];

  return (
    <button
      onClick={onScan}
      disabled={disabled}
      className={cn(
        "w-full aspect-[4/3] rounded-2xl border-2 border-dashed transition-all duration-200",
        "flex flex-col items-center justify-center gap-3",
        isPending
          ? "border-muted-foreground/30 bg-muted/30"
          : isError
            ? "border-status-error/30 bg-status-error/5"
            : "border-border hover:border-foreground/30 hover:bg-muted/20 active:scale-[0.99]",
      )}
    >
      {isPending ? (
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
      ) : isSuccess ? (
        <>
          <ScanLine className="size-12 text-status-ready" />
          <span className="text-lg font-semibold">Scan Complete</span>
          <span className="text-sm text-muted-foreground">
            Tap to scan again
          </span>
        </>
      ) : isError ? (
        <>
          <AlertCircle className="size-12 text-status-error" />
          <span className="text-lg font-semibold">Scan Failed</span>
          <span className="text-sm text-muted-foreground">{errorMessage}</span>
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
