// Print feature types.
// State machine types removed - now using simple interface + useMutation.

// =============================================================================
// Print Flow State
// =============================================================================

export interface PrintFlowState {
  file: File | null;
  jobId: number | null;
  progress: number;
  currentPage: number;
  totalPages: number;
  error: string | null;
}

// =============================================================================
// Print Flow UI Status
// Distinct from PrinterStatus (hardware state) - this is UI workflow state.
// =============================================================================

export type PrintFlowStatus =
  | "empty"
  | "ready"
  | "sending"
  | "printing"
  | "complete"
  | "error";

// =============================================================================
// Print History
// =============================================================================

export interface RecentPrintJob {
  id: string;
  fileName: string;
  pages: number;
  colorMode: "color" | "bw";
  timestamp: Date;
}
