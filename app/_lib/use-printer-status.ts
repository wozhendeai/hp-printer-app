"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { fetchAllPrinterData, type PrinterData } from "./printer-api";

interface UsePrinterStatusOptions {
  pollInterval?: number;
  enabled?: boolean;
}

interface UsePrinterStatusResult {
  data: PrinterData | null;
  loading: boolean;
  error: string | null;
  isOffline: boolean;
  refresh: () => Promise<void>;
  lastUpdated: Date | null;
}

export function usePrinterStatus(
  options: UsePrinterStatusOptions = {},
): UsePrinterStatusResult {
  const { pollInterval = 10000, enabled = true } = options;

  const [data, setData] = useState<PrinterData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const isMountedRef = useRef(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchData = useCallback(
    async (isInitial = false) => {
      if (!enabled) return;

      if (isInitial) {
        setLoading(true);
      }

      try {
        const printerData = await fetchAllPrinterData();

        if (isMountedRef.current) {
          setData(printerData);
          setError(null);
          setIsOffline(false);
          setLastUpdated(new Date());
        }
      } catch (err) {
        if (isMountedRef.current) {
          const message =
            err instanceof Error ? err.message : "Failed to fetch";
          setError(message);
          setIsOffline(true);
        }
      } finally {
        if (isMountedRef.current && isInitial) {
          setLoading(false);
        }
      }
    },
    [enabled],
  );

  const refresh = useCallback(async () => {
    await fetchData(false);
  }, [fetchData]);

  // Initial fetch
  useEffect(() => {
    isMountedRef.current = true;
    fetchData(true);

    return () => {
      isMountedRef.current = false;
    };
  }, [fetchData]);

  // Polling
  useEffect(() => {
    if (!enabled || pollInterval <= 0) return;

    intervalRef.current = setInterval(() => {
      fetchData(false);
    }, pollInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [enabled, pollInterval, fetchData]);

  return {
    data,
    loading,
    error,
    isOffline,
    refresh,
    lastUpdated,
  };
}
