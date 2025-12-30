import { AlertCircle, FileStack, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ScannerStatus } from "@/lib/types";

interface ScannerStatusBadgeProps {
  status: ScannerStatus | null;
  error: string | null;
}

export function ScannerStatusBadge({ status, error }: ScannerStatusBadgeProps) {
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
    processing: { color: "bg-status-warning", label: "Scanning" },
    stopped: { color: "bg-status-error", label: "Stopped" },
  } as const;

  const adfConfig = {
    empty: { label: "ADF Empty", icon: null },
    loaded: { label: "Documents in ADF", icon: FileStack },
    jam: { label: "ADF Jam", icon: AlertCircle },
  } as const;

  const state = stateConfig[status.state];
  const adf = adfConfig[status.adfState];

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2">
        <div className={cn("size-2 rounded-full", state.color)} />
        <span className="text-sm font-medium">{state.label}</span>
      </div>
      {status.adfState !== "empty" && (
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          {adf.icon && <adf.icon className="size-4" />}
          <span>{adf.label}</span>
        </div>
      )}
    </div>
  );
}
