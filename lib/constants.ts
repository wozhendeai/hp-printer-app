// Constants for scanner and copy features.
// Defaults, presets, labels, and helper functions.

import type {
  ScanSizeKey,
  ScanResolution,
  ScanColorMode,
  ScanFormat,
  ScanSource,
  ScanSettings,
  PresetMode,
  CopySettings,
} from "./types";

// =============================================================================
// Scan Sizes (dimensions at 300 DPI)
// =============================================================================

export const SCAN_SIZES: Record<
  ScanSizeKey,
  { width: number; height: number }
> = {
  letter: { width: 2550, height: 3300 },
  legal: { width: 2550, height: 4200 },
  a4: { width: 2480, height: 3508 },
  photo4x6: { width: 1200, height: 1800 },
  photo5x7: { width: 1500, height: 2100 },
};

// =============================================================================
// Resolution Options
// =============================================================================

export const RESOLUTIONS: readonly ScanResolution[] = [
  75, 100, 150, 200, 300, 400, 600, 1200,
];

// =============================================================================
// Display Labels
// =============================================================================

export const COLOR_MODE_LABELS: Record<ScanColorMode, string> = {
  RGB24: "Color",
  Grayscale8: "Gray",
  BlackAndWhite1: "B&W",
};

export const FORMAT_LABELS: Record<ScanFormat, string> = {
  "application/pdf": "PDF",
  "image/jpeg": "JPEG",
};

export const SOURCE_LABELS: Record<ScanSource, string> = {
  Platen: "flatbed glass",
  Adf: "document feeder",
};

export const SCAN_SIZE_LABELS: Record<ScanSizeKey, string> = {
  letter: 'Letter (8.5×11")',
  legal: 'Legal (8.5×14")',
  a4: "A4",
  photo4x6: "4×6 Photo",
  photo5x7: "5×7 Photo",
};

// =============================================================================
// Preset Configurations
// =============================================================================

export const PRESET_CONFIGS = {
  document: {
    format: "application/pdf",
    resolution: 300,
    colorMode: "RGB24",
    intent: "Document",
    ...SCAN_SIZES.letter,
  },
  photo: {
    format: "image/jpeg",
    resolution: 600,
    colorMode: "RGB24",
    intent: "Photo",
    ...SCAN_SIZES.photo4x6,
  },
} as const satisfies Record<string, Partial<ScanSettings>>;

export const DEFAULT_SCAN_SETTINGS: ScanSettings = {
  source: "Platen",
  colorMode: "RGB24",
  resolution: 300,
  format: "application/pdf",
  intent: "Document",
  ...SCAN_SIZES.letter,
};

export const DEFAULT_COPY_SETTINGS: CopySettings = {
  source: "Platen",
  colorMode: "color",
  duplex: false,
  quality: "normal",
  resize: "actual",
  brightness: 0,
};

// =============================================================================
// Helper Functions
// =============================================================================

export function derivePreset(settings: ScanSettings): PresetMode {
  const { format, resolution, colorMode, intent } = settings;

  if (
    format === "application/pdf" &&
    resolution === 300 &&
    colorMode === "RGB24" &&
    intent === "Document"
  ) {
    return "document";
  }

  if (
    format === "image/jpeg" &&
    resolution === 600 &&
    colorMode === "RGB24" &&
    intent === "Photo"
  ) {
    return "photo";
  }

  return "custom";
}

export function deriveScanSizeKey(settings: ScanSettings): ScanSizeKey {
  for (const [key, size] of Object.entries(SCAN_SIZES)) {
    if (settings.width === size.width && settings.height === size.height) {
      return key as ScanSizeKey;
    }
  }
  return "letter";
}

export function resolutionToIndex(resolution: ScanResolution): number {
  const index = RESOLUTIONS.indexOf(resolution);
  return index >= 0 ? index : RESOLUTIONS.indexOf(300);
}

export function indexToResolution(index: number): ScanResolution {
  return RESOLUTIONS[Math.min(Math.max(0, index), RESOLUTIONS.length - 1)];
}
