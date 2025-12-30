// Hook for managing the print flow.
"use client";

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { submitPrintJob } from "@/lib/api/jobs";
import { usePrintJobProgress, useCancelPrintJob } from "@/lib/queries/jobs";
import { jobKeys } from "@/lib/queries/keys";
import type { PrintSettings } from "@/lib/types";
import type { PrintFlowState, PrintFlowStatus } from "./types";

export interface UsePrintFlowOptions {
  onJobComplete?: (
    file: File,
    pages: number,
    colorMode: "color" | "bw",
  ) => void;
  onJobError?: (file: File, error: string) => void;
}

export interface UsePrintFlowResult {
  state: PrintFlowState;
  status: PrintFlowStatus;
  selectFile: (file: File) => void;
  removeFile: () => void;
  startPrint: () => void;
  cancel: () => void;
  reset: () => void;
}

export function usePrintFlow(
  settings: PrintSettings,
  options: UsePrintFlowOptions = {},
): UsePrintFlowResult {
  const { onJobComplete, onJobError } = options;

  // Core state: file selection and job tracking
  const [file, setFile] = useState<File | null>(null);
  const [jobId, setJobId] = useState<number | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);

  const queryClient = useQueryClient();

  // Store current settings in ref to avoid stale closures
  const settingsRef = useRef(settings);
  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  // Store callbacks in refs to avoid stale closures
  const onJobCompleteRef = useRef(onJobComplete);
  const onJobErrorRef = useRef(onJobError);
  useEffect(() => {
    onJobCompleteRef.current = onJobComplete;
    onJobErrorRef.current = onJobError;
  }, [onJobComplete, onJobError]);

  // Poll job status when we have an active job
  const shouldPoll = jobId !== null && !isComplete && !localError;
  const jobStatusQuery = usePrintJobProgress(jobId, shouldPoll);

  // Derive progress from query data
  const { progress, currentPage, totalPages } = useMemo(() => {
    if (!jobStatusQuery.data) {
      return { progress: 0, currentPage: 0, totalPages: 0 };
    }
    const data = jobStatusQuery.data;
    const currPage = data.currentPage ?? 1;
    const totPages = data.totalPages ?? 1;
    const prog = Math.round((currPage / totPages) * 100);
    return { progress: prog, currentPage: currPage, totalPages: totPages };
  }, [jobStatusQuery.data]);

  // Derive error from query
  const queryError =
    jobStatusQuery.error instanceof Error
      ? jobStatusQuery.error.message
      : jobStatusQuery.error
        ? "Failed to get job status"
        : null;

  // Check for job completion or failure from query data
  const jobState = jobStatusQuery.data?.state;
  const jobCompleted = jobState === "completed";
  const jobFailed = jobState === "aborted" || jobState === "canceled";
  const jobErrorMessage =
    jobStatusQuery.data?.errorMessage ?? "Print job failed";

  // Track completion callback firing
  const completionHandledRef = useRef(false);

  // Handle completion callback - syncs query state to local state
  useEffect(() => {
    if (jobCompleted && file && !completionHandledRef.current) {
      completionHandledRef.current = true;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsComplete(true);
      onJobCompleteRef.current?.(
        file,
        jobStatusQuery.data?.totalPages ?? 1,
        settingsRef.current.colorMode,
      );
    }
  }, [jobCompleted, file, jobStatusQuery.data?.totalPages]);

  // Handle failure callback - syncs query state to local state
  useEffect(() => {
    if (jobFailed && file && !localError) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLocalError(jobErrorMessage);
      onJobErrorRef.current?.(file, jobErrorMessage);
    }
  }, [jobFailed, file, jobErrorMessage, localError]);

  // Handle query error callback - syncs query error to local state
  useEffect(() => {
    if (queryError && file && !localError && shouldPoll) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLocalError(queryError);
      onJobErrorRef.current?.(file, queryError);
    }
  }, [queryError, file, localError, shouldPoll]);

  // Combine error sources
  const error =
    localError ?? (jobFailed ? jobErrorMessage : null) ?? queryError;

  // Build state object for consumers
  const state: PrintFlowState = useMemo(
    () => ({
      file,
      jobId,
      progress: isComplete ? 100 : progress,
      currentPage,
      totalPages,
      error,
    }),
    [file, jobId, progress, currentPage, totalPages, error, isComplete],
  );

  // Derive status from state
  const status: PrintFlowStatus = !file
    ? "empty"
    : error
      ? "error"
      : isComplete
        ? "complete"
        : jobId !== null && totalPages > 0
          ? "printing"
          : jobId !== null
            ? "sending"
            : "ready";

  // Cancel print job mutation
  const cancelPrintJobMutation = useCancelPrintJob();

  // Submit print job mutation
  const submitJobMutation = useMutation({
    mutationFn: async (fileToSubmit: File) => {
      return submitPrintJob(fileToSubmit, settingsRef.current);
    },
    onSuccess: (data) => {
      setJobId(data.jobId);
      completionHandledRef.current = false;
    },
    onError: (err) => {
      const message =
        err instanceof Error ? err.message : "Failed to submit print job";
      setLocalError(message);
      if (file) {
        onJobErrorRef.current?.(file, message);
      }
    },
  });

  const selectFile = useCallback((newFile: File) => {
    setFile(newFile);
    setJobId(null);
    setLocalError(null);
    setIsComplete(false);
    completionHandledRef.current = false;
  }, []);

  const removeFile = useCallback(() => {
    setFile(null);
    setJobId(null);
    setLocalError(null);
    setIsComplete(false);
    completionHandledRef.current = false;
  }, []);

  const reset = useCallback(() => {
    setFile(null);
    setJobId(null);
    setLocalError(null);
    setIsComplete(false);
    completionHandledRef.current = false;
  }, []);

  const cancel = useCallback(async () => {
    // Cancel job on printer if we have a job ID
    if (jobId !== null) {
      try {
        await cancelPrintJobMutation.mutateAsync(jobId);
      } catch {
        // Ignore cancel errors - job may already be done
      }
      // Clear the job status query
      queryClient.removeQueries({
        queryKey: jobKeys.progress(jobId),
      });
    }

    // Keep file but clear job state
    setJobId(null);
    setLocalError(null);
    setIsComplete(false);
    completionHandledRef.current = false;
  }, [jobId, cancelPrintJobMutation, queryClient]);

  const startPrint = useCallback(() => {
    if (!file || status !== "ready") return;
    setLocalError(null);
    setIsComplete(false);
    completionHandledRef.current = false;
    submitJobMutation.mutate(file);
  }, [file, status, submitJobMutation]);

  return {
    state,
    status,
    selectFile,
    removeFile,
    startPrint,
    cancel,
    reset,
  };
}
