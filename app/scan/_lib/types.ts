// Scan feature types.
// State machine types removed - now derived from useMutation.

import type { ScanFormat } from "@/lib/types";

// Re-export PresetMode from lib (used by lib/constants/scanner.ts helpers)
export type { PresetMode } from "@/lib/types";

// =============================================================================
// Scan History
// =============================================================================

export interface RecentScan {
  id: string;
  format: ScanFormat;
  timestamp: Date;
  blob: Blob;
  url: string;
}
