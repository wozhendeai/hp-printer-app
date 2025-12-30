// Shared primitive types used across multiple domains.
// These are foundational types that don't belong to a specific feature.

/** Job lifecycle states (normalized to lowercase from EWS/IPP) */
export type JobState =
  | "pending"
  | "processing"
  | "completed"
  | "canceled"
  | "aborted";

/** Alert severity levels for printer notifications */
export type AlertSeverity = "info" | "warning" | "error";
