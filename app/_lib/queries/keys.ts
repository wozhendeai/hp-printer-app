// Query key factory for type-safe, consistent query keys

export const clientStateKeys = {
  all: ["client-state"] as const,
  recentCopies: () => [...clientStateKeys.all, "recent-copies"] as const,
  recentScans: () => [...clientStateKeys.all, "recent-scans"] as const,
  recentPrints: () => [...clientStateKeys.all, "recent-prints"] as const,
};

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

export const jobKeys = {
  all: ["jobs"] as const,
  list: () => [...jobKeys.all, "list"] as const,
  current: () => [...jobKeys.all, "current"] as const,
  detail: (id: string) => [...jobKeys.all, "detail", id] as const,
};

export const printJobKeys = {
  all: ["print-jobs"] as const,
  detail: (id: string) => [...printJobKeys.all, "detail", id] as const,
};
