"use client";

import { cn } from "@/lib/utils";

export type PrinterStatus = "ready" | "printing" | "error" | "offline";

interface PrinterStatusBadgeProps {
  status: PrinterStatus;
}

const STATUS_CONFIG: Record<
  PrinterStatus,
  { label: string; className: string }
> = {
  ready: {
    label: "Ready",
    className: "text-chart-3",
  },
  printing: {
    label: "Printing",
    className: "text-chart-4",
  },
  error: {
    label: "Error",
    className: "text-destructive",
  },
  offline: {
    label: "Offline",
    className: "text-muted-foreground",
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

function StatusDot({ status }: { status: PrinterStatus }) {
  return (
    <span
      className={cn(
        "size-2 rounded-full",
        status === "ready" && "bg-chart-3",
        status === "printing" && "bg-chart-4 animate-pulse",
        status === "error" && "bg-destructive",
        status === "offline" && "bg-muted-foreground",
      )}
    />
  );
}
