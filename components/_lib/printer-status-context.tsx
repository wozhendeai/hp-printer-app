"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useMemo,
  type ReactNode,
} from "react";
import { usePrinterStatus } from "@/lib/queries/printer";
import { POLL_FAST, POLL_SLOW } from "@/lib/queries/polling";
import { useCurrentJob, useCancelEwsJob } from "@/lib/queries/jobs";
import { getAlertDisplay, type DisplayAlert } from "@/lib/utils/alerts";
import type {
  PrinterStatus as PrinterStatusAPI,
  InkLevel,
  PaperTray,
  ScannerStatus,
  Job,
} from "@/lib/types";

// Derived status type for UI display
export type PrinterDisplayStatus =
  | "ready"
  | "printing"
  | "scanning"
  | "copying"
  | "warning"
  | "error"
  | "offline";

// Re-export for consumers that need the type
export type { DisplayAlert };

// Current job with progress info
export interface CurrentJob {
  id: string;
  name: string;
  type: "Print" | "Scan" | "Copy" | "Fax";
  progress: number;
  currentPage?: number;
  totalPages?: number;
}

interface PrinterStatusContextValue {
  // Derived display status
  status: PrinterDisplayStatus;
  // Current active job (if any)
  currentJob: CurrentJob | null;
  // Alerts from printer
  alerts: DisplayAlert[];
  // Supply levels
  inkLevels: InkLevel[];
  paperTray: PaperTray | null;
  // Meta state
  isLoading: boolean;
  isOffline: boolean;
  lastUpdated: Date | null;
  // Drawer state
  isDrawerExpanded: boolean;
  setDrawerExpanded: (expanded: boolean) => void;
  // Actions
  refresh: () => Promise<void>;
  cancelCurrentJob: () => Promise<void>;
}

const PrinterStatusContext = createContext<PrinterStatusContextValue | null>(
  null,
);

// Capitalize first letter for display
function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// Compute display status based on alerts, jobs, and scanner state
function computeStatus(
  alerts: PrinterStatusAPI["alerts"],
  currentJob: Job | null,
  scannerStatus: ScannerStatus | null,
  isOffline: boolean,
): PrinterDisplayStatus {
  // Priority 1: Error alerts
  if (alerts.some((a) => a.severity === "error")) {
    return "error";
  }

  // Priority 2: Offline
  if (isOffline) {
    return "offline";
  }

  // Priority 3-5: Active jobs by type
  if (currentJob?.state === "processing") {
    if (currentJob.category === "copy") return "copying";
    if (currentJob.category === "scan") return "scanning";
    if (currentJob.category === "print") return "printing";
  }

  // Also check scanner status for scans that might not have job entries
  if (scannerStatus?.state === "processing") {
    return "scanning";
  }

  // Priority 6: Warning alerts
  if (alerts.some((a) => a.severity === "warning")) {
    return "warning";
  }

  // Priority 7: Ready
  return "ready";
}

interface PrinterStatusProviderProps {
  children: ReactNode;
}

export function PrinterStatusProvider({
  children,
}: PrinterStatusProviderProps) {
  // UI state
  const [isDrawerExpanded, setDrawerExpanded] = useState(false);

  // Track previous error state for auto-expand logic
  const prevHasErrorRef = useRef(false);

  // Fetch current job data
  const currentJobQuery = useCurrentJob();
  const currentJobData = currentJobQuery.data ?? null;
  const hasActiveJob = currentJobData?.state === "processing";

  // Fetch all printer data with dynamic polling based on job state
  const printerStatus = usePrinterStatus({
    pollInterval: hasActiveJob ? POLL_FAST : POLL_SLOW,
  });

  // Cancel job mutation
  const cancelJobMutation = useCancelEwsJob();

  // Memoize alerts to prevent useEffect dependency instability
  const alerts = useMemo(
    () => printerStatus.data?.status.alerts ?? [],
    [printerStatus.data?.status.alerts],
  );

  // Compute derived values
  const displayAlerts = alerts.map(getAlertDisplay);
  const status = computeStatus(
    alerts,
    currentJobData,
    printerStatus.data?.scanner ?? null,
    printerStatus.isOffline,
  );

  // Convert job to display format (capitalize category for display)
  const currentJob: CurrentJob | null = currentJobData
    ? {
        id: String(currentJobData.id),
        name:
          currentJobData.source || `${capitalize(currentJobData.category)} Job`,
        type: capitalize(currentJobData.category) as
          | "Print"
          | "Scan"
          | "Copy"
          | "Fax",
        progress: 0,
        currentPage: undefined,
        totalPages: undefined,
      }
    : null;

  // Auto-expand drawer on error transition (when error first appears)
  // The setState is intentional - we want to synchronize UI state with external printer state
  useEffect(() => {
    const hasError = alerts.some((a) => a.severity === "error");
    if (hasError && !prevHasErrorRef.current) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Intentional: auto-expand drawer when printer transitions to error state
      setDrawerExpanded(true);
    }
    prevHasErrorRef.current = hasError;
  }, [alerts]);

  // Full refresh
  const refresh = async () => {
    await printerStatus.refresh();
  };

  // Cancel current job
  const cancelCurrentJob = async () => {
    if (!currentJobData) return;
    await cancelJobMutation.mutateAsync(currentJobData.id);
  };

  const value: PrinterStatusContextValue = {
    status,
    currentJob,
    alerts: displayAlerts,
    inkLevels: printerStatus.data?.ink ?? [],
    paperTray: printerStatus.data?.paper ?? null,
    isLoading: printerStatus.loading,
    isOffline: printerStatus.isOffline,
    lastUpdated: printerStatus.lastUpdated,
    isDrawerExpanded,
    setDrawerExpanded,
    refresh,
    cancelCurrentJob,
  };

  return (
    <PrinterStatusContext.Provider value={value}>
      {children}
    </PrinterStatusContext.Provider>
  );
}

export function usePrinterStatusContext(): PrinterStatusContextValue {
  const context = useContext(PrinterStatusContext);
  if (!context) {
    throw new Error(
      "usePrinterStatusContext must be used within PrinterStatusProvider",
    );
  }
  return context;
}
