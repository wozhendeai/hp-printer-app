// Job management types for EWS job list and IPP print jobs.

import type { JobState } from "./common";

// =============================================================================
// EWS Job Types
// =============================================================================

export type JobCategory = "print" | "scan" | "copy" | "fax";

/** Job from EWS /Jobs/JobList endpoint */
export interface Job {
  id: number;
  url: string;
  category: JobCategory;
  state: JobState;
  source: string;
}

// =============================================================================
// IPP Print Job Types
// =============================================================================

/** Progress info from IPP Get-Job-Attributes */
export interface PrintJobProgress {
  state: JobState;
  currentPage?: number;
  totalPages?: number;
  errorMessage?: string;
}

/** Response from IPP Print-Job operation */
export interface PrintJobSubmission {
  jobId: number;
  jobUrl: string;
}
