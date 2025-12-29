"use client";

import { Printer, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  usePrinterStatusContext,
  type PrinterDisplayStatus,
} from "./_lib/printer-status-context";

// Status configuration for display
const statusConfig: Record<
  PrinterDisplayStatus,
  {
    label: string;
    dotClass: string;
    pillClass: string;
    animate: boolean;
  }
> = {
  ready: {
    label: "Ready",
    dotClass: "bg-status-ready",
    pillClass: "bg-status-ready/10 text-status-ready",
    animate: false,
  },
  printing: {
    label: "Printing",
    dotClass: "bg-chart-2",
    pillClass: "bg-chart-2/10 text-chart-2",
    animate: true,
  },
  scanning: {
    label: "Scanning",
    dotClass: "bg-chart-2",
    pillClass: "bg-chart-2/10 text-chart-2",
    animate: true,
  },
  copying: {
    label: "Copying",
    dotClass: "bg-chart-2",
    pillClass: "bg-chart-2/10 text-chart-2",
    animate: true,
  },
  warning: {
    label: "Warning",
    dotClass: "bg-status-busy",
    pillClass: "bg-status-busy/10 text-status-busy",
    animate: false,
  },
  error: {
    label: "Error",
    dotClass: "bg-destructive",
    pillClass: "bg-destructive/10 text-destructive",
    animate: false,
  },
  offline: {
    label: "Offline",
    dotClass: "bg-muted-foreground",
    pillClass: "bg-muted text-muted-foreground",
    animate: false,
  },
};

interface StatusBarProps {
  className?: string;
}

export function StatusBar({ className }: StatusBarProps) {
  const { status, currentJob, isDrawerExpanded, setDrawerExpanded } =
    usePrinterStatusContext();

  const config = statusConfig[status];
  const ChevronIcon = isDrawerExpanded ? ChevronUp : ChevronDown;

  // Show progress in pill for active jobs
  const showProgress =
    currentJob &&
    (status === "printing" || status === "scanning" || status === "copying");
  const progressText =
    showProgress && currentJob.currentPage && currentJob.totalPages
      ? `${currentJob.currentPage}/${currentJob.totalPages}`
      : null;

  return (
    <button
      onClick={() => setDrawerExpanded(!isDrawerExpanded)}
      className={cn(
        "flex items-center gap-3 hover:opacity-80 transition-opacity cursor-pointer text-left",
        className,
      )}
    >
      {/* Printer icon */}
      <div className="size-8 rounded-lg bg-foreground flex items-center justify-center shrink-0">
        <Printer className="size-4 text-background" />
      </div>

      {/* Printer name and IP */}
      <div className="leading-tight min-w-0">
        <p className="text-sm font-medium truncate">HP OfficeJet Pro 8020</p>
        <p className="text-xs text-muted-foreground font-mono">192.168.1.62</p>
      </div>

      {/* Status pill */}
      <div
        className={cn(
          "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ml-auto shrink-0",
          config.pillClass,
        )}
      >
        <span
          className={cn(
            "size-1.5 rounded-full",
            config.dotClass,
            config.animate && "animate-status-pulse",
          )}
        />
        <span>{config.label}</span>
        {progressText && (
          <span className="text-[10px] opacity-75">{progressText}</span>
        )}
      </div>

      {/* Chevron */}
      <ChevronIcon className="size-4 text-muted-foreground shrink-0" />
    </button>
  );
}
