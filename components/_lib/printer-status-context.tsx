"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import {
  fetchPrinterStatus,
  fetchInkLevels,
  fetchPaperTray,
  fetchScannerStatus,
  type PrinterStatus as PrinterStatusAPI,
  type InkLevel,
  type PaperTray,
  type ScannerStatus,
} from "@/app/_lib/printer-api";
import {
  fetchCurrentJob,
  cancelJob as cancelJobApi,
  type PrinterJob,
} from "@/app/_lib/job-api";

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

// Polling intervals in ms
const POLL_INTERVALS = {
  status: {
    idle: 5000,
    active: 2000,
    collapsed: 10000,
  },
  ink: {
    idle: 30000,
    collapsed: 60000,
  },
  paper: {
    idle: 10000,
    collapsed: 20000,
  },
  job: {
    active: 1000,
  },
};

interface PrinterStatusProviderProps {
  children: ReactNode;
}

export function PrinterStatusProvider({
  children,
}: PrinterStatusProviderProps) {
  // Raw data from API
  const [printerStatus, setPrinterStatus] = useState<PrinterStatusAPI | null>(
    null,
  );
  const [inkLevels, setInkLevels] = useState<InkLevel[]>([]);
  const [paperTray, setPaperTray] = useState<PaperTray | null>(null);
  const [scannerStatus, setScannerStatus] = useState<ScannerStatus | null>(
    null,
  );
  const [currentJobData, setCurrentJobData] = useState<PrinterJob | null>(null);

  // Meta state
  const [isLoading, setIsLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Drawer state
  const [isDrawerExpanded, setDrawerExpanded] = useState(false);

  // Refs for cleanup
  const isMountedRef = useRef(true);
  const statusIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const inkIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const paperIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const jobIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Compute derived values
  const alerts = printerStatus?.alerts || [];
  const displayAlerts = alerts.map(getAlertDisplay);
  const status = computeStatus(
    alerts,
    currentJobData,
    scannerStatus,
    isOffline,
  );

  // Convert job to display format
  const currentJob: CurrentJob | null = currentJobData
    ? {
        id: currentJobData.id,
        name: currentJobData.source || `${currentJobData.category} Job`,
        type: currentJobData.category,
        progress: 0, // Would need IPP query for actual progress
        currentPage: undefined,
        totalPages: undefined,
      }
    : null;

  // Track previous error state for auto-expand logic
  const hadErrorRef = useRef(false);

  // Fetch status data (printer status, scanner status, job list)
  const fetchStatusData = useCallback(async () => {
    if (!isMountedRef.current) return;

    try {
      const [statusResult, scannerResult, jobResult] = await Promise.all([
        fetchPrinterStatus(),
        fetchScannerStatus(),
        fetchCurrentJob(),
      ]);

      if (isMountedRef.current) {
        // Check if transitioning to error state - auto-expand drawer
        const hasError = statusResult.alerts.some(
          (a) => a.severity === "Error",
        );
        if (hasError && !hadErrorRef.current) {
          setDrawerExpanded(true);
        }
        hadErrorRef.current = hasError;

        setPrinterStatus(statusResult);
        setScannerStatus(scannerResult);
        setCurrentJobData(jobResult);
        setIsOffline(false);
        setLastUpdated(new Date());
      }
    } catch {
      if (isMountedRef.current) {
        setIsOffline(true);
      }
    }
  }, []);

  // Fetch ink levels
  const fetchInkData = useCallback(async () => {
    if (!isMountedRef.current) return;

    try {
      const result = await fetchInkLevels();
      if (isMountedRef.current) {
        setInkLevels(result);
      }
    } catch {
      // Ink fetch failure doesn't mean offline
    }
  }, []);

  // Fetch paper status
  const fetchPaperData = useCallback(async () => {
    if (!isMountedRef.current) return;

    try {
      const result = await fetchPaperTray();
      if (isMountedRef.current) {
        setPaperTray(result);
      }
    } catch {
      // Paper fetch failure doesn't mean offline
    }
  }, []);

  // Full refresh
  const refresh = useCallback(async () => {
    await Promise.all([fetchStatusData(), fetchInkData(), fetchPaperData()]);
  }, [fetchStatusData, fetchInkData, fetchPaperData]);

  // Cancel current job
  const cancelCurrentJob = useCallback(async () => {
    if (!currentJobData) return;

    try {
      await cancelJobApi(currentJobData.id);
      // Refresh to get updated status
      await fetchStatusData();
    } catch (error) {
      console.error("Failed to cancel job:", error);
    }
  }, [currentJobData, fetchStatusData]);

  // Initial fetch - isLoading starts as true, so we just need to set it to false when done
  // The async fetch functions set state after awaiting, which is the intended pattern for data fetching
  useEffect(() => {
    isMountedRef.current = true;

    // eslint-disable-next-line react-hooks/set-state-in-effect -- Initial data fetch is async, setState happens after await
    Promise.all([fetchStatusData(), fetchInkData(), fetchPaperData()]).finally(
      () => {
        if (isMountedRef.current) {
          setIsLoading(false);
        }
      },
    );

    return () => {
      isMountedRef.current = false;
    };
  }, [fetchStatusData, fetchInkData, fetchPaperData]);

  // Dynamic polling for status
  useEffect(() => {
    const hasActiveJob = currentJobData?.state === "Processing";
    const interval = hasActiveJob
      ? POLL_INTERVALS.status.active
      : isDrawerExpanded
        ? POLL_INTERVALS.status.idle
        : POLL_INTERVALS.status.collapsed;

    statusIntervalRef.current = setInterval(fetchStatusData, interval);

    return () => {
      if (statusIntervalRef.current) {
        clearInterval(statusIntervalRef.current);
      }
    };
  }, [fetchStatusData, currentJobData?.state, isDrawerExpanded]);

  // Dynamic polling for ink levels
  useEffect(() => {
    const interval = isDrawerExpanded
      ? POLL_INTERVALS.ink.idle
      : POLL_INTERVALS.ink.collapsed;

    inkIntervalRef.current = setInterval(fetchInkData, interval);

    return () => {
      if (inkIntervalRef.current) {
        clearInterval(inkIntervalRef.current);
      }
    };
  }, [fetchInkData, isDrawerExpanded]);

  // Dynamic polling for paper status
  useEffect(() => {
    const interval = isDrawerExpanded
      ? POLL_INTERVALS.paper.idle
      : POLL_INTERVALS.paper.collapsed;

    paperIntervalRef.current = setInterval(fetchPaperData, interval);

    return () => {
      if (paperIntervalRef.current) {
        clearInterval(paperIntervalRef.current);
      }
    };
  }, [fetchPaperData, isDrawerExpanded]);

  // Fast polling for active job progress
  useEffect(() => {
    const hasActiveJob = currentJobData?.state === "Processing";

    if (hasActiveJob) {
      jobIntervalRef.current = setInterval(
        fetchStatusData,
        POLL_INTERVALS.job.active,
      );
    }

    return () => {
      if (jobIntervalRef.current) {
        clearInterval(jobIntervalRef.current);
      }
    };
  }, [fetchStatusData, currentJobData?.state]);

  const value: PrinterStatusContextValue = {
    status,
    currentJob,
    alerts: displayAlerts,
    inkLevels,
    paperTray,
    isLoading,
    isOffline,
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
