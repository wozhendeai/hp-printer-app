// UI badge showing print flow status.
"use client";

import { cn } from "@/lib/utils";
import type { PrintFlowStatus } from "../_lib/types";

export type { PrintFlowStatus };

interface PrinterStatusBadgeProps {
  status: PrintFlowStatus;
}

const STATUS_CONFIG: Record<
  PrintFlowStatus,
  { label: string; className: string }
> = {
  empty: {
    label: "Ready",
    className: "text-chart-3",
  },
  ready: {
    label: "Ready",
    className: "text-chart-3",
  },
  sending: {
    label: "Sending",
    className: "text-chart-4",
  },
  printing: {
    label: "Printing",
    className: "text-chart-4",
  },
  complete: {
    label: "Complete",
    className: "text-chart-3",
  },
  error: {
    label: "Error",
    className: "text-destructive",
  },
};

export function PrinterStatusBadge({ status }: PrinterStatusBadgeProps) {
  const config = STATUS_CONFIG[status];

  return (
    <div
      className={cn(
        "flex items-center gap-1.5 text-sm font-medium",
        config.className,
      )}
    >
      <StatusDot status={status} />
      {config.label}
    </div>
  );
}

function StatusDot({ status }: { status: PrintFlowStatus }) {
  return (
    <span
      className={cn(
        "size-2 rounded-full",
        (status === "empty" || status === "ready" || status === "complete") &&
          "bg-chart-3",
        (status === "sending" || status === "printing") &&
          "bg-chart-4 animate-pulse",
        status === "error" && "bg-destructive",
      )}
    />
  );
}
