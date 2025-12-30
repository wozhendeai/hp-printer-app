// Copy settings primitives.
// State machine types are in app/copy/_lib/types.ts.
// Constants are in lib/constants/copy.ts.

import type { ScanSource } from "./scanner";

export type CopySource = ScanSource;
export type CopyColorMode = "color" | "bw";
export type CopyQuality = "draft" | "normal" | "best";
export type CopyResize = "actual" | "fit" | "shrink";

export interface CopySettings {
  source: CopySource;
  colorMode: CopyColorMode;
  duplex: boolean;
  quality: CopyQuality;
  resize: CopyResize;
  brightness: number; // -5 to +5
}
