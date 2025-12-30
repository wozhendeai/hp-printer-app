// Copy feature types.
// State machine types simplified - now using simple phase tracking + useMutation.

import type { CopySettings } from "@/lib/types";

// =============================================================================
// Copy Phase (simple tracking instead of discriminated union)
// =============================================================================

export type CopyPhase = "idle" | "scanning" | "printing";

// =============================================================================
// Copy Error Phase (for error attribution)
// =============================================================================

export type CopyErrorPhase = "scan" | "print";

// =============================================================================
// Copy History
// =============================================================================

export interface RecentCopy {
  id: string;
  timestamp: Date;
  copies: number;
  settings: CopySettings;
  status: "completed" | "failed";
}
