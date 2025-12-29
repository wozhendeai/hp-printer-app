"use client";

import { useReducer, useCallback, useEffect, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { printReducer, initialState, type PrintState } from "./print-reducer";
import { submitPrintJob } from "./print-api";
import {
  usePrintJobStatus,
  useCancelPrintJob,
} from "@/app/_lib/queries/job-queries";
import { printJobKeys } from "@/app/_lib/queries/keys";
import type { PrintSettings } from "../_components/print-settings";
import type { PrinterStatus } from "../_components/printer-status-badge";

export interface UsePrintFlowOptions {
  /** Called when a print job completes successfully */
  onJobComplete?: (
    file: File,
    pages: number,
    colorMode: "color" | "bw",
  ) => void;
  /** Called when a print job fails */
  onJobError?: (file: File, error: string) => void;
}

export interface UsePrintFlowResult {
  state: PrintState;
  printerStatus: PrinterStatus;
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

  const [state, dispatch] = useReducer(printReducer, initialState);
  const queryClient = useQueryClient();

  // Store current settings in ref to avoid stale closures in callbacks
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

  // Get job ID from state if we're in a printing state
  const jobId =
    state.type === "sending" || state.type === "printing" ? state.jobId : null;

  // Poll job status when we have an active job
  const shouldPoll = state.type === "sending" || state.type === "printing";
  const jobStatusQuery = usePrintJobStatus(jobId, shouldPoll);

  // Process job status updates
  useEffect(() => {
    if (!jobStatusQuery.data || !shouldPoll) return;

    const status = jobStatusQuery.data;
    const file =
      state.type === "sending" || state.type === "printing" ? state.file : null;

    if (status.state === "processing") {
      // Transition to printing state if we have page info
      if (state.type === "sending" && status.totalPages) {
        dispatch({
          type: "START_PRINTING",
          totalPages: status.totalPages,
        });
      }

      // Update progress
      if (state.type === "printing" || status.totalPages) {
        const currentPage = status.currentPage ?? 1;
        const totalPages = status.totalPages ?? 1;
        const progress = Math.round((currentPage / totalPages) * 100);
        dispatch({ type: "PRINT_PROGRESS", currentPage, progress });
      }
    } else if (status.state === "completed") {
      dispatch({ type: "COMPLETE" });
      if (file) {
        onJobCompleteRef.current?.(
          file,
          status.totalPages ?? 1,
          settingsRef.current.colorMode,
        );
      }
    } else if (status.state === "aborted" || status.state === "canceled") {
      const message = status.errorMessage ?? "Print job failed";
      dispatch({ type: "ERROR", message });
      if (file) {
        onJobErrorRef.current?.(file, message);
      }
    }
    // "pending" state - keep polling (handled by refetchInterval)
  }, [jobStatusQuery.data, shouldPoll, state.type, state]);

  // Handle query errors
  useEffect(() => {
    if (!jobStatusQuery.error || !shouldPoll) return;

    const file =
      state.type === "sending" || state.type === "printing" ? state.file : null;
    const message =
      jobStatusQuery.error instanceof Error
        ? jobStatusQuery.error.message
        : "Failed to get job status";
    dispatch({ type: "ERROR", message });
    if (file) {
      onJobErrorRef.current?.(file, message);
    }
  }, [jobStatusQuery.error, shouldPoll, state]);

  // Cancel print job mutation
  const cancelPrintJobMutation = useCancelPrintJob();

  // Submit print job mutation
  const submitJobMutation = useMutation({
    mutationFn: async (file: File) => {
      return submitPrintJob(file, settingsRef.current);
    },
    onSuccess: (data) => {
      dispatch({ type: "START_SEND", jobId: data.jobId });
    },
    onError: (error) => {
      const message =
        error instanceof Error ? error.message : "Failed to submit print job";
      dispatch({ type: "ERROR", message });
      if (state.type === "ready") {
        onJobErrorRef.current?.(state.file, message);
      }
    },
  });

  // Derive printer status from state
  const printerStatus: PrinterStatus =
    state.type === "printing" || state.type === "sending"
      ? "printing"
      : state.type === "error"
        ? "error"
        : "ready";

  const selectFile = useCallback((file: File) => {
    dispatch({ type: "SELECT_FILE", file });
  }, []);

  const removeFile = useCallback(() => {
    dispatch({ type: "REMOVE_FILE" });
  }, []);

  const reset = useCallback(() => {
    dispatch({ type: "RESET" });
  }, []);

  const cancel = useCallback(async () => {
    // Cancel job on printer if we have a job ID
    if (state.type === "sending" || state.type === "printing") {
      try {
        await cancelPrintJobMutation.mutateAsync(state.jobId);
      } catch {
        // Ignore cancel errors - job may already be done
      }
      // Clear the job status query
      queryClient.removeQueries({
        queryKey: printJobKeys.detail(String(state.jobId)),
      });
    }

    dispatch({ type: "CANCEL" });
  }, [state, cancelPrintJobMutation, queryClient]);

  const startPrint = useCallback(() => {
    if (state.type !== "ready") return;
    submitJobMutation.mutate(state.file);
  }, [state, submitJobMutation]);

  return {
    state,
    printerStatus,
    selectFile,
    removeFile,
    startPrint,
    cancel,
    reset,
  };
}
