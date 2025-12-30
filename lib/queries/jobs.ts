"use client";

// TanStack Query hooks for job management.
// Uses EWS for job list, IPP for print job progress.

import {
  queryOptions,
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import {
  fetchJobList,
  fetchCurrentJob,
  cancelJobEws,
  getJobProgress,
  cancelPrintJobIpp,
} from "../api/jobs";
import { jobKeys, printerKeys } from "./keys";
import { POLL_FAST, POLL_SLOW } from "./polling";

// ============================================================================
// EWS Job List Queries
// ============================================================================

/** Query options for the full job list */
export function jobListOptions() {
  return queryOptions({
    queryKey: jobKeys.list(),
    queryFn: fetchJobList,
    staleTime: POLL_FAST,
    refetchInterval: POLL_SLOW,
  });
}

/** Query options for current processing job */
export function currentJobOptions(enabled = true) {
  return queryOptions({
    queryKey: jobKeys.current(),
    queryFn: fetchCurrentJob,
    staleTime: POLL_FAST,
    refetchInterval: POLL_FAST,
    enabled,
  });
}

/** Hook for job list */
export function useJobList() {
  return useQuery(jobListOptions());
}

/** Hook for current job with conditional polling */
export function useCurrentJob(enabled = true) {
  return useQuery(currentJobOptions(enabled));
}

/** Cancel job mutation (EWS) - for navbar/dashboard */
export function useCancelEwsJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: cancelJobEws,
    onMutate: async (jobId: number) => {
      await queryClient.cancelQueries({ queryKey: jobKeys.current() });
      await queryClient.cancelQueries({ queryKey: jobKeys.progress(jobId) });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: jobKeys.all });
      queryClient.invalidateQueries({ queryKey: printerKeys.status() });
    },
    onError: (error) => {
      if (error instanceof Error && error.message.includes("404")) return;
      console.error("Failed to cancel job:", error);
    },
  });
}

// ============================================================================
// IPP Print Job Progress Queries
// ============================================================================

/** Query options for print job progress (IPP) */
export function printJobProgressOptions(
  jobId: number | null,
  enabled: boolean,
) {
  return queryOptions({
    queryKey: jobKeys.progress(jobId ?? 0),
    queryFn: () => getJobProgress(jobId!),
    enabled: enabled && jobId !== null,
    staleTime: 500,
    refetchInterval: enabled ? 1000 : false,
  });
}

/** Hook for print job progress polling */
export function usePrintJobProgress(jobId: number | null, enabled: boolean) {
  return useQuery(printJobProgressOptions(jobId, enabled));
}

/** Cancel print job mutation (IPP) - for print page */
export function useCancelPrintJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: cancelPrintJobIpp,
    onSettled: (_data, _error, jobId) => {
      queryClient.invalidateQueries({ queryKey: jobKeys.progress(jobId) });
      queryClient.invalidateQueries({ queryKey: jobKeys.all });
    },
    onError: (error) => {
      if (error instanceof Error && error.message.includes("404")) return;
      console.error("Failed to cancel print job:", error);
    },
  });
}
