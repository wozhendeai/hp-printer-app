// Scanner hardware and eSCL protocol types.
// State machine types are in app/scan/_lib/types.ts.
// Constants and helper functions are in lib/constants/scanner.ts.

// =============================================================================
// Scanner Hardware Status
// =============================================================================

export type ScannerState = "idle" | "processing" | "stopped";
export type AdfState = "empty" | "loaded" | "jam";

export interface ScannerStatus {
  state: ScannerState;
  adfState: AdfState;
}

// =============================================================================
// Scan Settings (eSCL protocol)
// =============================================================================

export type ScanColorMode = "BlackAndWhite1" | "Grayscale8" | "RGB24";
export type ScanResolution = 75 | 100 | 150 | 200 | 300 | 400 | 600 | 1200;
export type ScanSource = "Platen" | "Adf";
export type ScanFormat = "image/jpeg" | "application/pdf";
export type ScanIntent = "Document" | "Photo" | "Preview" | "TextAndGraphic";

export interface ScanSettings {
  intent: ScanIntent;
  source: ScanSource;
  colorMode: ScanColorMode;
  resolution: ScanResolution;
  format: ScanFormat;
  width: number;
  height: number;
}

// =============================================================================
// Scan Size Keys (for width/height presets)
// =============================================================================

export type ScanSizeKey = "letter" | "legal" | "a4" | "photo4x6" | "photo5x7";

// =============================================================================
// Preset Mode (used by derivePreset helper in lib/constants/scanner.ts)
// =============================================================================

export type PresetMode = "document" | "photo" | "custom";
