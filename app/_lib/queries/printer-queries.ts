"use client";

import {
  queryOptions,
  useQueries,
  useQueryClient,
  useQuery,
} from "@tanstack/react-query";
import { useCallback } from "react";
import {
  fetchPrinterStatus,
  fetchInkLevels,
  fetchPaperTray,
  fetchScannerStatus,
  fetchAllPrinterData,
  type PrinterStatus,
  type InkLevel,
  type PaperTray,
  type ScannerStatus,
  type PrinterData,
} from "../printer-api";
import { printerKeys } from "./keys";

// Polling intervals in ms (matching original context behavior)
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
};

// Query options for printer status
export function printerStatusOptions(
  hasActiveJob: boolean,
  isExpanded: boolean,
) {
  return queryOptions({
    queryKey: printerKeys.status(),
    queryFn: fetchPrinterStatus,
    staleTime: 2000,
    refetchInterval: hasActiveJob
      ? POLL_INTERVALS.status.active
      : isExpanded
        ? POLL_INTERVALS.status.idle
        : POLL_INTERVALS.status.collapsed,
  });
}

// Query options for ink levels
export function inkLevelsOptions(isExpanded: boolean) {
  return queryOptions({
    queryKey: printerKeys.ink(),
    queryFn: fetchInkLevels,
    staleTime: 30000,
    refetchInterval: isExpanded
      ? POLL_INTERVALS.ink.idle
      : POLL_INTERVALS.ink.collapsed,
  });
}

// Query options for paper tray
export function paperTrayOptions(isExpanded: boolean) {
  return queryOptions({
    queryKey: printerKeys.paper(),
    queryFn: fetchPaperTray,
    staleTime: 10000,
    refetchInterval: isExpanded
      ? POLL_INTERVALS.paper.idle
      : POLL_INTERVALS.paper.collapsed,
  });
}

// Query options for scanner status
export function scannerStatusOptions() {
  return queryOptions({
    queryKey: printerKeys.scanner(),
    queryFn: fetchScannerStatus,
    staleTime: 2000,
    refetchInterval: 5000,
  });
}

// Combined data shape returned by usePrinterQueries
export interface PrinterQueriesData {
  printerStatus: PrinterStatus | undefined;
  inkLevels: InkLevel[];
  paperTray: PaperTray | null;
  scannerStatus: ScannerStatus | null;
  isLoading: boolean;
  isOffline: boolean;
  dataUpdatedAt: number | null;
}

interface UsePrinterQueriesOptions {
  isExpanded: boolean;
  hasActiveJob: boolean;
}

// Combined hook for all printer queries with dynamic intervals
export function usePrinterQueries({
  isExpanded,
  hasActiveJob,
}: UsePrinterQueriesOptions): PrinterQueriesData & {
  refetch: () => Promise<void>;
} {
  const queryClient = useQueryClient();

  const results = useQueries({
    queries: [
      printerStatusOptions(hasActiveJob, isExpanded),
      inkLevelsOptions(isExpanded),
      paperTrayOptions(isExpanded),
      scannerStatusOptions(),
    ],
  });

  const [statusResult, inkResult, paperResult, scannerResult] = results;

  // Any query in error state and all failed = offline
  const allFailed = results.every((r) => r.isError);
  const isOffline = allFailed && results.some((r) => r.failureCount > 0);

  // Loading only on initial load, not refetches
  const isLoading = results.some((r) => r.isLoading);

  // Most recent data update timestamp
  const dataUpdatedAt =
    Math.max(...results.map((r) => r.dataUpdatedAt ?? 0)) || null;

  const refetch = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: printerKeys.status() }),
      queryClient.invalidateQueries({ queryKey: printerKeys.ink() }),
      queryClient.invalidateQueries({ queryKey: printerKeys.paper() }),
      queryClient.invalidateQueries({ queryKey: printerKeys.scanner() }),
    ]);
  }, [queryClient]);

  return {
    printerStatus: statusResult.data,
    inkLevels: inkResult.data ?? [],
    paperTray: paperResult.data ?? null,
    scannerStatus: scannerResult.data ?? null,
    isLoading,
    isOffline,
    dataUpdatedAt,
    refetch,
  };
}

// Query options for fetching all printer data at once (for dashboard)
export function allPrinterDataOptions(pollInterval = 10000) {
  return queryOptions({
    queryKey: printerKeys.all,
    queryFn: fetchAllPrinterData,
    staleTime: 5000,
    refetchInterval: pollInterval,
  });
}

// Simplified hook for dashboard - fetches all printer data

export interface UsePrinterStatusResult {
  data: PrinterData | null;
  loading: boolean;
  error: string | null;
  isOffline: boolean;
  refresh: () => Promise<void>;
  lastUpdated: Date | null;
}

interface UsePrinterStatusOptions {
  pollInterval?: number | false;
  enabled?: boolean;
}

export function usePrinterStatus(
  options: UsePrinterStatusOptions = {},
): UsePrinterStatusResult {
  const { pollInterval = 10000, enabled = true } = options;
  const queryClient = useQueryClient();

  const query = useQuery({
    ...allPrinterDataOptions(),
    refetchInterval: pollInterval === false ? false : pollInterval,
    enabled,
  });

  const refresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: printerKeys.all });
  }, [queryClient]);

  return {
    data: query.data ?? null,
    loading: query.isLoading,
    error: query.error instanceof Error ? query.error.message : null,
    isOffline: query.isError && query.failureCount > 0,
    refresh,
    lastUpdated: query.dataUpdatedAt ? new Date(query.dataUpdatedAt) : null,
  };
}

// Scanner status hook for scan/copy pages
interface UseScannerStatusOptions {
  pollInterval?: number;
}

export interface UseScannerStatusResult {
  data: ScannerStatus | null;
  isLoading: boolean;
  error: string | null;
}

export function useScannerStatus(
  options: UseScannerStatusOptions = {},
): UseScannerStatusResult {
  const { pollInterval = 3000 } = options;

  const query = useQuery({
    ...scannerStatusOptions(),
    refetchInterval: pollInterval,
  });

  return {
    data: query.data ?? null,
    isLoading: query.isLoading,
    error:
      query.isError && query.error instanceof Error
        ? query.error.message
        : null,
  };
}
