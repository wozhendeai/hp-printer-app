"use client";

import {
  queryOptions,
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import {
  fetchCurrentJob,
  fetchJobList,
  cancelJob,
  type PrinterJob,
} from "../job-api";
import { jobKeys, printerKeys, printJobKeys } from "./keys";
import {
  getJobStatus,
  cancelJob as cancelPrintJob,
  type JobStatus,
} from "@/app/print/_lib/print-api";

// Query options for the current processing job
export function currentJobOptions(enabled = true) {
  return queryOptions({
    queryKey: jobKeys.current(),
    queryFn: fetchCurrentJob,
    staleTime: 1000,
    refetchInterval: 1000,
    enabled,
  });
}

// Query options for the full job list
export function jobListOptions() {
  return queryOptions({
    queryKey: jobKeys.list(),
    queryFn: fetchJobList,
    staleTime: 2000,
    refetchInterval: 5000,
  });
}

// Hook for current job with conditional polling
export function useCurrentJob(enabled = true) {
  return useQuery(currentJobOptions(enabled));
}

// Hook for job list
export function useJobList() {
  return useQuery(jobListOptions());
}

// Cancel job mutation
export function useCancelJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: cancelJob,
    onMutate: async (jobId: string) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: jobKeys.current() });
      await queryClient.cancelQueries({ queryKey: jobKeys.detail(jobId) });
    },
    onSettled: () => {
      // Invalidate all job-related queries and printer status
      queryClient.invalidateQueries({ queryKey: jobKeys.all });
      queryClient.invalidateQueries({ queryKey: printerKeys.status() });
    },
    onError: (error) => {
      // Job may have already completed - not a real error
      if (error instanceof Error && error.message.includes("404")) {
        return;
      }
      console.error("Failed to cancel job:", error);
    },
  });
}

// Type for useCurrentJob return value
export type CurrentJobResult = ReturnType<typeof useCurrentJob>;
export type CancelJobMutation = ReturnType<typeof useCancelJob>;
export { type PrinterJob };

// Print job status query options (for IPP print jobs)
export function printJobStatusOptions(jobId: number | null, enabled: boolean) {
  return queryOptions({
    queryKey: printJobKeys.detail(String(jobId)),
    queryFn: () => getJobStatus(jobId!),
    enabled: enabled && jobId !== null,
    staleTime: 500,
    refetchInterval: enabled ? 1000 : false,
  });
}

// Hook for print job status polling
export function usePrintJobStatus(jobId: number | null, enabled: boolean) {
  return useQuery(printJobStatusOptions(jobId, enabled));
}

// Cancel print job mutation
export function useCancelPrintJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: cancelPrintJob,
    onSettled: (_data, _error, jobId) => {
      // Invalidate this specific job query
      queryClient.invalidateQueries({
        queryKey: printJobKeys.detail(String(jobId)),
      });
      // Also invalidate printer job list
      queryClient.invalidateQueries({ queryKey: jobKeys.all });
    },
    onError: (error) => {
      // Job may have already completed
      if (error instanceof Error && error.message.includes("404")) {
        return;
      }
      console.error("Failed to cancel print job:", error);
    },
  });
}

export { type JobStatus };
