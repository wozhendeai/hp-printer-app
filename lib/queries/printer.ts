"use client";

// TanStack Query hooks for printer status data.
//
// Architecture:
// - usePrinterStatus: Primary hook for all printer data. Uses fetchAllPrinterData
//   which batches 7 EWS calls into one network request. Used by dashboard and
//   PrinterStatusContext for global status.
// - useScannerStatus: Scanner-only hook with fast polling for scan/copy pages
//   that need real-time scanner state during active operations.
//
// Why one hook instead of parallel queries?
// fetchAllPrinterData makes 7 parallel requests server-side, so batching into
// one client request reduces HTTP overhead vs 4 separate useQuery calls.

import { queryOptions, useQueryClient, useQuery } from "@tanstack/react-query";
import { useCallback } from "react";
import { fetchScannerStatus, fetchAllPrinterData } from "../api/printer";
import { printerKeys } from "./keys";
import { POLL_FAST, POLL_SLOW } from "./polling";
import type { ScannerStatus, PrinterData } from "../types";

// ============================================================================
// Scanner Status Query Options (used by scan page for fast polling)
// ============================================================================

function scannerStatusOptions(isActive: boolean) {
  return queryOptions({
    queryKey: printerKeys.scanner(),
    queryFn: fetchScannerStatus,
    staleTime: POLL_FAST,
    refetchInterval: isActive ? POLL_FAST : POLL_SLOW,
  });
}

// ============================================================================
// All Data Query (Dashboard + Status Context)
// ============================================================================

export function allPrinterDataOptions() {
  return queryOptions({
    queryKey: printerKeys.all,
    queryFn: fetchAllPrinterData,
    staleTime: POLL_SLOW / 2,
    refetchInterval: POLL_SLOW,
  });
}

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
  const { pollInterval = POLL_SLOW, enabled = true } = options;
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

// ============================================================================
// Scanner Status Hook
// ============================================================================

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
  const { pollInterval = POLL_FAST } = options;

  const query = useQuery({
    ...scannerStatusOptions(true),
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
