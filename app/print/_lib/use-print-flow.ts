"use client";

import { useReducer, useRef, useEffect, useCallback } from "react";
import { printReducer, initialState, type PrintState } from "./print-reducer";
import { submitPrintJob, getJobStatus, cancelJob } from "./print-api";
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

const POLL_INTERVAL_MS = 1000;

export function usePrintFlow(
  settings: PrintSettings,
  options: UsePrintFlowOptions = {},
): UsePrintFlowResult {
  const { onJobComplete, onJobError } = options;

  const [state, dispatch] = useReducer(printReducer, initialState);

  // Refs for cleanup
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

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

  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      stopPolling();
    };
  }, [stopPolling]);

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

  // Store state in ref for async callbacks
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const cancel = useCallback(async () => {
    stopPolling();

    // Cancel job on printer if we have a job ID
    const currentState = stateRef.current;
    if (currentState.type === "sending" || currentState.type === "printing") {
      try {
        await cancelJob(currentState.jobId);
      } catch {
        // Ignore cancel errors - job may already be done
      }
    }

    dispatch({ type: "CANCEL" });
  }, [stopPolling]);

  const startPrint = useCallback(async () => {
    if (state.type !== "ready") return;

    const file = state.file;

    try {
      // Submit job to printer
      const { jobId } = await submitPrintJob(file, settingsRef.current);

      if (!isMountedRef.current) return;
      dispatch({ type: "START_SEND", jobId });

      // Start polling for job status
      pollIntervalRef.current = setInterval(async () => {
        if (!isMountedRef.current) {
          stopPolling();
          return;
        }

        try {
          const status = await getJobStatus(jobId);
          if (!isMountedRef.current) return;

          if (status.state === "processing") {
            // Transition to printing state if we have page info
            const currentState = stateRef.current;
            if (currentState.type === "sending" && status.totalPages) {
              dispatch({
                type: "START_PRINTING",
                totalPages: status.totalPages,
              });
            }

            // Update progress
            if (currentState.type === "printing" || status.totalPages) {
              const currentPage = status.currentPage ?? 1;
              const totalPages = status.totalPages ?? 1;
              const progress = Math.round((currentPage / totalPages) * 100);
              dispatch({ type: "PRINT_PROGRESS", currentPage, progress });
            }
          } else if (status.state === "completed") {
            stopPolling();
            dispatch({ type: "COMPLETE" });
            onJobCompleteRef.current?.(
              file,
              status.totalPages ?? 1,
              settingsRef.current.colorMode,
            );
          } else if (
            status.state === "aborted" ||
            status.state === "canceled"
          ) {
            stopPolling();
            const message = status.errorMessage ?? "Print job failed";
            dispatch({ type: "ERROR", message });
            onJobErrorRef.current?.(file, message);
          }
          // "pending" state - keep polling
        } catch (error) {
          if (!isMountedRef.current) return;
          stopPolling();
          const message =
            error instanceof Error ? error.message : "Failed to get job status";
          dispatch({ type: "ERROR", message });
          onJobErrorRef.current?.(file, message);
        }
      }, POLL_INTERVAL_MS);
    } catch (error) {
      if (!isMountedRef.current) return;
      const message =
        error instanceof Error ? error.message : "Failed to submit print job";
      dispatch({ type: "ERROR", message });
      onJobErrorRef.current?.(file, message);
    }
  }, [state, stopPolling]);

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
