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
import { usePrinterQueries } from "@/app/_lib/queries/printer-queries";
import { useCurrentJob, useCancelJob } from "@/app/_lib/queries/job-queries";
import type {
  PrinterStatus as PrinterStatusAPI,
  InkLevel,
  PaperTray,
  ScannerStatus,
} from "@/app/_lib/printer-api";
import type { PrinterJob } from "@/app/_lib/job-api";

// Derived status type for UI display
export type PrinterDisplayStatus =
  | "ready"
  | "printing"
  | "scanning"
  | "copying"
  | "warning"
  | "error"
  | "offline";

// Alert with derived title and description for display
export interface DisplayAlert {
  id: string;
  severity: "Info" | "Warning" | "Error";
  title: string;
  description: string;
  color?: string;
}

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

// Map alert IDs to user-friendly messages
function getAlertDisplay(alert: PrinterStatusAPI["alerts"][0]): DisplayAlert {
  const alertMessages: Record<string, { title: string; description: string }> =
    {
      cartridgeLow: {
        title: `${alert.color || "Ink"} low`,
        description: "Order replacement cartridge",
      },
      cartridgeEmpty: {
        title: `${alert.color || "Ink"} empty`,
        description: "Replace cartridge to continue",
      },
      cartridgeMissing: {
        title: `${alert.color || "Ink"} cartridge missing`,
        description: "Install cartridge",
      },
      mediaEmpty: {
        title: "Paper tray empty",
        description: "Load paper to continue",
      },
      mediaJam: {
        title: "Paper jam",
        description: "Clear jam and press OK on printer",
      },
      doorOpen: {
        title: "Cover open",
        description: "Close the cover",
      },
      spoolAreaFull: {
        title: "Print queue full",
        description: "Wait for jobs to complete or cancel",
      },
      scannerError: {
        title: "Scanner error",
        description: "Check scanner glass and try again",
      },
      inkSystemFailure: {
        title: "Ink system problem",
        description: "Restart printer or contact support",
      },
      servicePending: {
        title: "Service required",
        description: "Contact HP support",
      },
    };

  const message = alertMessages[alert.id] || {
    title: alert.id,
    description: "Check printer for details",
  };

  return {
    id: alert.id,
    severity: alert.severity,
    title: message.title,
    description: message.description,
    color: alert.color,
  };
}

// Compute display status based on alerts, jobs, and scanner state
function computeStatus(
  alerts: PrinterStatusAPI["alerts"],
  currentJob: PrinterJob | null,
  scannerStatus: ScannerStatus | null,
  isOffline: boolean,
): PrinterDisplayStatus {
  // Priority 1: Error alerts
  if (alerts.some((a) => a.severity === "Error")) {
    return "error";
  }

  // Priority 2: Offline
  if (isOffline) {
    return "offline";
  }

  // Priority 3-5: Active jobs by type
  if (currentJob?.state === "Processing") {
    if (currentJob.category === "Copy") return "copying";
    if (currentJob.category === "Scan") return "scanning";
    if (currentJob.category === "Print") return "printing";
  }

  // Also check scanner status for scans that might not have job entries
  if (scannerStatus?.state === "Processing") {
    return "scanning";
  }

  // Priority 6: Warning alerts
  if (alerts.some((a) => a.severity === "Warning")) {
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
  const hasActiveJob = currentJobData?.state === "Processing";

  // Fetch all printer data with dynamic polling based on drawer/job state
  const printerQueries = usePrinterQueries({
    isExpanded: isDrawerExpanded,
    hasActiveJob,
  });

  // Cancel job mutation
  const cancelJobMutation = useCancelJob();

  // Memoize alerts to prevent useEffect dependency instability
  const alerts = useMemo(
    () => printerQueries.printerStatus?.alerts ?? [],
    [printerQueries.printerStatus?.alerts],
  );

  // Compute derived values
  const displayAlerts = alerts.map(getAlertDisplay);
  const status = computeStatus(
    alerts,
    currentJobData,
    printerQueries.scannerStatus,
    printerQueries.isOffline,
  );

  // Convert job to display format
  const currentJob: CurrentJob | null = currentJobData
    ? {
        id: currentJobData.id,
        name: currentJobData.source || `${currentJobData.category} Job`,
        type: currentJobData.category,
        progress: 0,
        currentPage: undefined,
        totalPages: undefined,
      }
    : null;

  // Auto-expand drawer on error transition (when error first appears)
  // The setState is intentional - we want to synchronize UI state with external printer state
  useEffect(() => {
    const hasError = alerts.some((a) => a.severity === "Error");
    if (hasError && !prevHasErrorRef.current) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Intentional: auto-expand drawer when printer transitions to error state
      setDrawerExpanded(true);
    }
    prevHasErrorRef.current = hasError;
  }, [alerts]);

  // Full refresh
  const refresh = async () => {
    await printerQueries.refetch();
  };

  // Cancel current job
  const cancelCurrentJob = async () => {
    if (!currentJobData) return;
    await cancelJobMutation.mutateAsync(currentJobData.id);
  };

  // Convert timestamp to Date
  const lastUpdated = printerQueries.dataUpdatedAt
    ? new Date(printerQueries.dataUpdatedAt)
    : null;

  const value: PrinterStatusContextValue = {
    status,
    currentJob,
    alerts: displayAlerts,
    inkLevels: printerQueries.inkLevels,
    paperTray: printerQueries.paperTray,
    isLoading: printerQueries.isLoading,
    isOffline: printerQueries.isOffline,
    lastUpdated,
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
