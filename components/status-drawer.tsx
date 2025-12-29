"use client";

import {
  Printer,
  ScanLine,
  Copy,
  FileText,
  XCircle,
  AlertTriangle,
  Info,
  ChevronRight,
  X,
  WifiOff,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import {
  usePrinterStatusContext,
  type CurrentJob,
  type DisplayAlert,
} from "./_lib/printer-status-context";
import {
  formatMediaSize,
  type InkLevel,
  type PaperTray,
} from "@/app/_lib/printer-api";

// Section header component
function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.15em] mb-2">
      {children}
    </h3>
  );
}

// Job type icon mapping
const jobIcons = {
  Print: Printer,
  Scan: ScanLine,
  Copy: Copy,
  Fax: FileText,
};

// Current Job Section
function CurrentJobSection({
  job,
  onCancel,
}: {
  job: CurrentJob;
  onCancel: () => void;
}) {
  const JobIcon = jobIcons[job.type];

  return (
    <div className="space-y-2">
      <SectionHeader>Current Job</SectionHeader>
      <div className="bg-muted/30 rounded-lg p-3 space-y-3">
        {/* Job header */}
        <div className="flex items-start gap-3">
          <div className="size-8 rounded-md bg-chart-2/10 flex items-center justify-center shrink-0">
            <JobIcon className="size-4 text-chart-2" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{job.name}</p>
            <p className="text-xs text-muted-foreground">
              {job.type}
              {job.currentPage && job.totalPages && (
                <>
                  {" "}
                  · Page {job.currentPage} of {job.totalPages}
                </>
              )}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="size-7 text-muted-foreground hover:text-destructive shrink-0"
            onClick={onCancel}
          >
            <X className="size-4" />
          </Button>
        </div>

        {/* Progress bar */}
        <div className="space-y-1">
          <Progress value={job.progress} className="h-1.5" />
          <p className="text-[10px] text-muted-foreground">
            {job.progress > 0 ? `${job.progress}% complete` : "Processing..."}
          </p>
        </div>
      </div>
    </div>
  );
}

// Alert severity icons
const alertIcons = {
  Error: XCircle,
  Warning: AlertTriangle,
  Info: Info,
};

const alertColors = {
  Error: "text-destructive",
  Warning: "text-status-busy",
  Info: "text-chart-2",
};

// Single alert item
function AlertItem({ alert }: { alert: DisplayAlert }) {
  const Icon = alertIcons[alert.severity];

  return (
    <div className="flex items-start gap-3 py-2 first:pt-0 last:pb-0">
      <Icon
        className={cn("size-4 shrink-0 mt-0.5", alertColors[alert.severity])}
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{alert.title}</p>
        <p className="text-xs text-muted-foreground">{alert.description}</p>
      </div>
      <ChevronRight className="size-4 text-muted-foreground shrink-0 mt-0.5" />
    </div>
  );
}

// Alerts Section
function AlertsSection({ alerts }: { alerts: DisplayAlert[] }) {
  return (
    <div className="space-y-2">
      <SectionHeader>Alerts</SectionHeader>
      <div className="bg-muted/30 rounded-lg p-3 divide-y divide-border">
        {alerts.map((alert) => (
          <AlertItem key={alert.id} alert={alert} />
        ))}
      </div>
    </div>
  );
}

// Ink colors for bars
const inkColors: Record<string, string> = {
  K: "bg-ink-black",
  C: "bg-ink-cyan",
  M: "bg-ink-magenta",
  Y: "bg-ink-yellow",
};

// Single ink bar
function InkBar({ ink }: { ink: InkLevel }) {
  const isLow = ink.percentRemaining < 20;

  return (
    <div className="flex items-center gap-2">
      <span className="w-4 text-xs font-medium text-muted-foreground">
        {ink.color}
      </span>
      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={cn("h-full transition-all", inkColors[ink.color])}
          style={{ width: `${ink.percentRemaining}%` }}
        />
      </div>
      <span className="w-8 text-xs tabular-nums text-muted-foreground text-right">
        {ink.percentRemaining}%
      </span>
      {isLow && (
        <Badge variant="destructive" className="text-[9px] px-1.5 py-0 h-4">
          Low
        </Badge>
      )}
    </div>
  );
}

// Paper tray status
function PaperStatus({ tray }: { tray: PaperTray }) {
  const stateColors = {
    ready: "text-status-ready",
    missing: "text-destructive",
    jam: "text-destructive",
  };

  const stateLabels = {
    ready: "Ready",
    missing: "Empty",
    jam: "Jam",
  };

  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium">Paper Tray</p>
        <p className="text-xs text-muted-foreground">
          {formatMediaSize(tray.mediaSize)}
          {tray.mediaType !== "plain" && ` · ${tray.mediaType}`}
        </p>
      </div>
      <Badge
        variant="outline"
        className={cn("text-xs", stateColors[tray.state])}
      >
        {stateLabels[tray.state]}
      </Badge>
    </div>
  );
}

// Supplies Section
function SuppliesSection({
  inkLevels,
  paperTray,
}: {
  inkLevels: InkLevel[];
  paperTray: PaperTray | null;
}) {
  return (
    <div className="space-y-2">
      <SectionHeader>Supplies</SectionHeader>
      <div className="bg-muted/30 rounded-lg p-3 space-y-4">
        {/* Ink levels */}
        {inkLevels.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Ink</p>
            <div className="space-y-1.5">
              {inkLevels.map((ink) => (
                <InkBar key={ink.color} ink={ink} />
              ))}
            </div>
          </div>
        )}

        {/* Paper status */}
        {paperTray && (
          <>
            <div className="border-t border-border" />
            <PaperStatus tray={paperTray} />
          </>
        )}
      </div>
    </div>
  );
}

// Offline state
function OfflineSection({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-6 text-center">
      <div className="size-12 rounded-full bg-muted flex items-center justify-center mb-3">
        <WifiOff className="size-6 text-muted-foreground" />
      </div>
      <p className="text-sm font-medium">Printer not reachable</p>
      <p className="text-xs text-muted-foreground mb-4">
        Check network connection
      </p>
      <Button variant="outline" size="sm" onClick={onRetry}>
        <RefreshCw className="size-3.5 mr-1.5" />
        Retry Connection
      </Button>
    </div>
  );
}

export function StatusDrawer() {
  const {
    status,
    currentJob,
    alerts,
    inkLevels,
    paperTray,
    isDrawerExpanded,
    setDrawerExpanded,
    refresh,
    cancelCurrentJob,
  } = usePrinterStatusContext();

  const hasAlerts = alerts.length > 0;
  const hasActiveJob = currentJob !== null;
  const isOffline = status === "offline";

  return (
    <Sheet open={isDrawerExpanded} onOpenChange={setDrawerExpanded}>
      <SheetContent
        side="top"
        showCloseButton={false}
        className="max-h-[80vh] overflow-y-auto"
      >
        <div className="px-4 md:px-6 py-4 space-y-4 max-w-2xl mx-auto">
          {isOffline ? (
            <OfflineSection onRetry={refresh} />
          ) : (
            <>
              {/* Current Job - only when active */}
              {hasActiveJob && (
                <CurrentJobSection
                  job={currentJob}
                  onCancel={cancelCurrentJob}
                />
              )}

              {/* Alerts - only when present */}
              {hasAlerts && <AlertsSection alerts={alerts} />}

              {/* Supplies - always visible */}
              <SuppliesSection inkLevels={inkLevels} paperTray={paperTray} />
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
