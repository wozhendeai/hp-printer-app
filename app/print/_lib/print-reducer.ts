// State types for the print flow state machine
export type PrintState =
  | { type: "empty" }
  | { type: "ready"; file: File }
  | { type: "sending"; file: File; jobId: number }
  | {
      type: "printing";
      file: File;
      jobId: number;
      progress: number;
      currentPage: number;
      totalPages: number;
    }
  | { type: "complete"; file: File; totalPages: number }
  | { type: "error"; file: File; errorMessage: string };

// Action types - explicit transitions only
export type PrintAction =
  | { type: "SELECT_FILE"; file: File }
  | { type: "REMOVE_FILE" }
  | { type: "START_SEND"; jobId: number }
  | { type: "START_PRINTING"; totalPages: number }
  | { type: "PRINT_PROGRESS"; currentPage: number; progress: number }
  | { type: "COMPLETE" }
  | { type: "ERROR"; message: string }
  | { type: "CANCEL" }
  | { type: "RESET" };

export const initialState: PrintState = { type: "empty" };

/**
 * Reducer with guarded transitions - only valid state transitions are allowed.
 * Invalid actions for a given state are ignored (state returned unchanged).
 */
export function printReducer(
  state: PrintState,
  action: PrintAction,
): PrintState {
  switch (action.type) {
    case "SELECT_FILE":
      // Can select file from empty or ready state
      if (state.type === "empty" || state.type === "ready") {
        return { type: "ready", file: action.file };
      }
      return state;

    case "REMOVE_FILE":
      if (state.type === "ready") {
        return { type: "empty" };
      }
      return state;

    case "START_SEND":
      if (state.type === "ready") {
        return { type: "sending", file: state.file, jobId: action.jobId };
      }
      return state;

    case "START_PRINTING":
      if (state.type === "sending") {
        return {
          type: "printing",
          file: state.file,
          jobId: state.jobId,
          progress: 0,
          currentPage: 1,
          totalPages: action.totalPages,
        };
      }
      return state;

    case "PRINT_PROGRESS":
      if (state.type === "printing") {
        return {
          ...state,
          currentPage: action.currentPage,
          progress: action.progress,
        };
      }
      return state;

    case "COMPLETE":
      if (state.type === "printing") {
        return {
          type: "complete",
          file: state.file,
          totalPages: state.totalPages,
        };
      }
      return state;

    case "ERROR":
      // Can error from sending or printing states
      if (state.type === "sending" || state.type === "printing") {
        return {
          type: "error",
          file: state.file,
          errorMessage: action.message,
        };
      }
      return state;

    case "CANCEL":
      // Can cancel from sending, printing, or error states
      if (
        state.type === "sending" ||
        state.type === "printing" ||
        state.type === "error"
      ) {
        return { type: "ready", file: state.file };
      }
      return state;

    case "RESET":
      // Can reset from complete or error states
      if (state.type === "complete" || state.type === "error") {
        return { type: "empty" };
      }
      return state;

    default:
      return state;
  }
}
