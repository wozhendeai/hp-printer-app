import type { ScanSource } from "@/app/_lib/printer-api";

export type CopySource = ScanSource; // "Platen" | "Adf"
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

export type CopyPhase = "scan" | "print";

export type CopyState =
  | { status: "idle" }
  | { status: "scanning"; progress: string }
  | { status: "printing"; currentCopy: number; totalCopies: number }
  | { status: "complete"; copies: number }
  | { status: "error"; message: string; phase: CopyPhase };

export interface RecentCopy {
  id: string;
  timestamp: Date;
  copies: number;
  settings: CopySettings;
  status: "completed" | "failed";
}

export const defaultCopySettings: CopySettings = {
  source: "Platen",
  colorMode: "color",
  duplex: false,
  quality: "normal",
  resize: "actual",
  brightness: 0,
};
