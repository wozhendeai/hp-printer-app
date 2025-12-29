"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Printer,
  Settings,
  ScanLine,
  Copy,
  ChevronRight,
  AlertCircle,
  AlignJustify,
  Droplets,
  ClipboardList,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { StatusPills } from "./status-widgets";
import type { PrinterData } from "@/app/_lib/printer-api";

type PrinterStatus = "ready" | "printing" | "error" | "offline";

interface PrinterHubProps {
  status?: PrinterStatus;
  printerData?: PrinterData | null;
  isLoading?: boolean;
}

const statusConfig = {
  ready: { label: "Ready", color: "text-status-ready", dot: "bg-status-ready" },
  printing: {
    label: "Printing",
    color: "text-status-busy",
    dot: "bg-status-busy",
  },
  error: { label: "Error", color: "text-status-error", dot: "bg-status-error" },
  offline: {
    label: "Offline",
    color: "text-muted-foreground",
    dot: "bg-muted-foreground",
  },
};

// Alert banner for important warnings
function AlertBanner({
  message,
  action,
  href,
  onDismiss,
}: {
  message: string;
  action: string;
  href?: string;
  onDismiss?: () => void;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-status-busy/10 border border-status-busy/20">
      <AlertCircle className="size-5 text-status-busy shrink-0" />
      <span className="text-sm font-medium flex-1">{message}</span>
      {href ? (
        <Link
          href={href}
          className="text-sm font-semibold text-status-busy hover:underline shrink-0"
        >
          {action}
        </Link>
      ) : (
        <span className="text-sm font-semibold text-status-busy shrink-0">
          {action}
        </span>
      )}
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="size-6 rounded-md hover:bg-status-busy/15 flex items-center justify-center transition-colors shrink-0"
        >
          <X className="size-4 text-status-busy" />
        </button>
      )}
    </div>
  );
}

// Quick action card
function QuickAction({
  icon: Icon,
  title,
  description,
  href,
  variant = "default",
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  href: string;
  variant?: "default" | "primary";
}) {
  const isPrimary = variant === "primary";

  return (
    <Link
      href={href}
      className={cn(
        "flex flex-col p-5 rounded-2xl transition-all duration-200",
        isPrimary
          ? "bg-foreground text-background hover:bg-foreground/90"
          : "bg-card border border-border hover:border-border/80 hover:shadow-sm",
      )}
    >
      <div
        className={cn(
          "size-12 rounded-xl flex items-center justify-center mb-4",
          isPrimary ? "bg-background/15" : "bg-muted",
        )}
      >
        <Icon
          className={cn(
            "size-6",
            isPrimary ? "text-background" : "text-foreground",
          )}
        />
      </div>
      <span
        className={cn(
          "font-semibold",
          isPrimary ? "text-background" : "text-foreground",
        )}
      >
        {title}
      </span>
      <span
        className={cn(
          "text-sm mt-0.5",
          isPrimary ? "text-background/70" : "text-muted-foreground",
        )}
      >
        {description}
      </span>
    </Link>
  );
}

// Print action row (full width)
function PrintActionRow() {
  return (
    <Link
      href="/print"
      className="flex items-center gap-4 p-4 rounded-2xl bg-card border border-border hover:border-border/80 hover:shadow-sm transition-all duration-200"
    >
      <div className="size-12 rounded-xl bg-muted flex items-center justify-center">
        <Printer className="size-6 text-foreground" />
      </div>
      <div className="flex-1">
        <span className="font-semibold">Print</span>
        <p className="text-sm text-muted-foreground">
          Print a test page or document
        </p>
      </div>
      <ChevronRight className="size-5 text-muted-foreground" />
    </Link>
  );
}

// Recent job item
function JobItem({
  icon: Icon,
  name,
  type,
  detail,
  time,
  status,
}: {
  icon: React.ComponentType<{ className?: string }>;
  name: string;
  type: string;
  detail: string;
  time: string;
  status: "done" | "pending" | "error";
}) {
  return (
    <div className="flex items-center gap-4 p-4">
      <div className="size-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
        <Icon className="size-5 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{name}</p>
        <p className="text-sm text-muted-foreground">
          {type} · {detail} · {time}
        </p>
      </div>
      <span
        className={cn(
          "text-xs font-medium px-2 py-1 rounded-md shrink-0",
          status === "done" && "bg-status-ready/15 text-status-ready",
          status === "pending" && "bg-status-busy/15 text-status-busy",
          status === "error" && "bg-status-error/15 text-status-error",
        )}
      >
        {status === "done"
          ? "Done"
          : status === "pending"
            ? "Pending"
            : "Error"}
      </span>
    </div>
  );
}

// Tool button
function ToolButton({
  icon: Icon,
  label,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <button className="flex flex-col items-center gap-2 p-4 rounded-xl bg-muted/30 border border-border/50 hover:bg-muted/50 transition-colors">
      <Icon className="size-6 text-muted-foreground" />
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
    </button>
  );
}

// Loading skeleton
function DashboardSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="size-12 rounded-xl bg-muted" />
        <div className="space-y-2">
          <div className="h-5 w-40 bg-muted rounded" />
          <div className="h-3 w-32 bg-muted rounded" />
        </div>
      </div>
      <div className="grid grid-cols-5 gap-3">
        <div className="col-span-3 h-36 bg-muted rounded-2xl" />
        <div className="col-span-2 h-36 bg-muted rounded-2xl" />
      </div>
      <div className="h-20 bg-muted rounded-2xl" />
      <div className="grid grid-cols-2 gap-3">
        <div className="h-12 bg-muted rounded-full" />
        <div className="h-12 bg-muted rounded-full" />
      </div>
    </div>
  );
}

export function PrinterHub({
  status = "ready",
  printerData,
  isLoading = false,
}: PrinterHubProps) {
  const derivedStatus = printerData
    ? printerData.status.state === "inPowerSave"
      ? "ready"
      : printerData.status.state === "processing"
        ? "printing"
        : printerData.status.state === "error"
          ? "error"
          : "ready"
    : status;

  const activeConfig = statusConfig[derivedStatus];
  const ipAddress = "192.168.1.62"; // From CLAUDE.md

  // Dismissed alerts state
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(
    new Set(),
  );

  // Check for alerts
  const isPaperEmpty = printerData?.paper.state === "missing";
  const hasLowInk = printerData?.ink.some((i) => i.percentRemaining < 20);

  const showPaperAlert = isPaperEmpty && !dismissedAlerts.has("paper");
  const showInkAlert =
    !isPaperEmpty && hasLowInk && !dismissedAlerts.has("ink");

  // Mock recent jobs (would come from API in real implementation)
  const recentJobs = [
    {
      icon: Printer,
      name: "Q4_Report_Final.pdf",
      type: "Print",
      detail: "12 pages",
      time: "Today 2:34 PM",
      status: "done" as const,
    },
    {
      icon: ScanLine,
      name: "Scan_20251228_141205.jpg",
      type: "Scan",
      detail: "300 DPI",
      time: "Today 2:12 PM",
      status: "done" as const,
    },
    {
      icon: Copy,
      name: "Copy Job",
      type: "Copy",
      detail: "3 copies",
      time: "Yesterday 4:50 PM",
      status: "done" as const,
    },
  ];

  if (isLoading) {
    return (
      <div className="w-full max-w-lg mx-auto px-4 py-6">
        <DashboardSkeleton />
      </div>
    );
  }

  return (
    <div className="w-full max-w-lg mx-auto px-4 py-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="size-12 rounded-xl bg-muted flex items-center justify-center">
            <Printer className="size-6" />
          </div>
          <div>
            <h1 className="font-semibold text-lg">OfficeJet Pro 8020</h1>
            <div className="flex items-center gap-2 text-sm">
              <span
                className={cn("flex items-center gap-1.5", activeConfig.color)}
              >
                <span className={cn("size-2 rounded-full", activeConfig.dot)} />
                {activeConfig.label}
              </span>
              <span className="text-muted-foreground font-mono text-xs">
                {ipAddress}
              </span>
            </div>
          </div>
        </div>
        <button className="size-10 rounded-lg hover:bg-muted flex items-center justify-center transition-colors">
          <Settings className="size-5 text-muted-foreground" />
        </button>
      </div>

      {/* Alert Banner */}
      {showPaperAlert && (
        <AlertBanner
          message="Paper tray empty"
          action="Load Paper"
          onDismiss={() =>
            setDismissedAlerts((prev) => new Set(prev).add("paper"))
          }
        />
      )}
      {showInkAlert && (
        <AlertBanner
          message="Ink running low"
          action="View Details"
          onDismiss={() =>
            setDismissedAlerts((prev) => new Set(prev).add("ink"))
          }
        />
      )}

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-5 gap-3">
        <div className="col-span-3">
          <QuickAction
            icon={ScanLine}
            title="Scan"
            description="Document or photo"
            href="/scan"
            variant="primary"
          />
        </div>
        <div className="col-span-2">
          <QuickAction
            icon={Copy}
            title="Copy"
            description="1-99 copies"
            href="/copy"
          />
        </div>
      </div>

      {/* Print Row */}
      <PrintActionRow />

      {/* Status Pills */}
      {printerData && (
        <StatusPills ink={printerData.ink} paper={printerData.paper} />
      )}

      {/* Recent Jobs */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-muted-foreground">
            Recent Jobs
          </h2>
          <Link
            href="/jobs"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            View All
          </Link>
        </div>
        <div className="bg-card rounded-2xl border border-border divide-y divide-border">
          {recentJobs.map((job, i) => (
            <JobItem key={i} {...job} />
          ))}
        </div>
      </div>

      {/* Tools */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground mb-2">
          Tools
        </h2>
        <div className="grid grid-cols-3 gap-3">
          <ToolButton icon={AlignJustify} label="Align Heads" />
          <ToolButton icon={Droplets} label="Clean Heads" />
          <ToolButton icon={ClipboardList} label="Print Report" />
        </div>
      </div>
    </div>
  );
}
