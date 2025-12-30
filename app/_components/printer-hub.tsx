"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Printer,
  Settings,
  ScanLine,
  Copy,
  ChevronRight,
  AlignJustify,
  Droplets,
  ClipboardList,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { StatusPills } from "./status-widgets";
import { AlertBanner } from "./alert-banner";
import { QuickAction } from "./quick-action";
import { ToolButton } from "./tool-button";
import { DashboardSkeleton } from "./dashboard-skeleton";
import type { PrinterData } from "@/lib/types";

type PrinterStatus = "ready" | "printing" | "error" | "offline";

interface PrinterHubProps {
  status?: PrinterStatus;
  printerData?: PrinterData | null;
  isLoading?: boolean;
}

const statusConfig = {
  ready: {
    label: "Ready",
    color: "text-status-ready",
    dot: "bg-status-ready",
  },
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
  const ipAddress = "192.168.1.62";

  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(
    new Set(),
  );

  const isPaperEmpty = printerData?.paper.state === "missing";
  const hasLowInk = printerData?.ink.some((i) => i.percentRemaining < 20);

  const showPaperAlert = isPaperEmpty && !dismissedAlerts.has("paper");
  const showInkAlert =
    !isPaperEmpty && hasLowInk && !dismissedAlerts.has("ink");

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
        <Button variant="ghost" size="icon" className="rounded-lg">
          <Settings className="size-5 text-muted-foreground" />
        </Button>
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
