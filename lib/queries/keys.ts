// Unified query key factories for type-safe cache management.
// Consolidates jobKeys and printJobKeys into single structure.

/** Printer data queries (status, ink, paper, scanner, device) */
export const printerKeys = {
  all: ["printer"] as const,
  status: () => [...printerKeys.all, "status"] as const,
  ink: () => [...printerKeys.all, "ink"] as const,
  paper: () => [...printerKeys.all, "paper"] as const,
  scanner: () => [...printerKeys.all, "scanner"] as const,
  device: () => [...printerKeys.all, "device"] as const,
  network: () => [...printerKeys.all, "network"] as const,
  usage: () => [...printerKeys.all, "usage"] as const,
};

/** Job queries (EWS job list + IPP job progress) */
export const jobKeys = {
  all: ["jobs"] as const,
  /** EWS job list - all jobs of all types */
  list: () => [...jobKeys.all, "list"] as const,
  /** Currently processing job (derived from list) */
  current: () => [...jobKeys.all, "current"] as const,
  /** IPP print job progress (page count, state) */
  progress: (id: number) => [...jobKeys.all, "progress", id] as const,
};

/** Client-side state (recent scans, copies, prints for history) */
export const clientStateKeys = {
  all: ["client-state"] as const,
  recentCopies: () => [...clientStateKeys.all, "recent-copies"] as const,
  recentScans: () => [...clientStateKeys.all, "recent-scans"] as const,
  recentPrints: () => [...clientStateKeys.all, "recent-prints"] as const,
};
