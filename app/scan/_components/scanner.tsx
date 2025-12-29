"use client";

import { useState, useCallback } from "react";
import {
  ScanLine,
  FileText,
  Image,
  Settings,
  Monitor,
  FileStack,
  ChevronUp,
  File,
  ImageIcon,
  Download,
  AlertCircle,
  Loader2,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  performScan,
  type ScannerStatus,
  type ScanColorMode,
  type ScanResolution,
  type ScanSource,
  type ScanFormat,
  type ScanIntent,
  type ScanSettings as APIScanSettings,
  SCAN_SIZES,
} from "@/app/_lib/printer-api";
import { useScannerStatus } from "@/app/_lib/queries/printer-queries";

type ScanState = "idle" | "scanning" | "complete" | "error";
type PresetMode = "document" | "photo" | "custom";
type ScanSizeKey = keyof typeof SCAN_SIZES;

interface ScanSettings {
  source: ScanSource;
  colorMode: ScanColorMode;
  resolution: ScanResolution;
  format: ScanFormat;
  scanSize: ScanSizeKey;
  intent: ScanIntent;
}

const RESOLUTIONS: ScanResolution[] = [75, 100, 150, 200, 300, 400, 600, 1200];

const presets: Record<PresetMode, Partial<ScanSettings>> = {
  document: {
    format: "application/pdf",
    resolution: 300,
    colorMode: "RGB24",
    intent: "Document",
  },
  photo: {
    format: "image/jpeg",
    resolution: 600,
    colorMode: "RGB24",
    intent: "Photo",
  },
  custom: {},
};

const defaultSettings: ScanSettings = {
  source: "Platen",
  colorMode: "RGB24",
  resolution: 300,
  format: "application/pdf",
  scanSize: "letter",
  intent: "Document",
};

function PresetTab({
  icon: Icon,
  label,
  description,
  selected,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  description: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-1 px-4 py-3 rounded-xl transition-all duration-200 flex-1",
        selected
          ? "bg-foreground text-background"
          : "bg-card border border-border hover:bg-muted",
      )}
    >
      <Icon className="size-6" />
      <span className="font-semibold text-sm">{label}</span>
      <span
        className={cn(
          "text-xs",
          selected ? "text-background/70" : "text-muted-foreground",
        )}
      >
        {description}
      </span>
    </button>
  );
}

function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  renderLabel,
}: {
  options: readonly T[];
  value: T;
  onChange: (value: T) => void;
  renderLabel: (option: T) => React.ReactNode;
}) {
  return (
    <div className="flex bg-muted rounded-lg p-1">
      {options.map((option) => (
        <button
          key={option}
          onClick={() => onChange(option)}
          className={cn(
            "flex-1 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200",
            value === option
              ? "bg-foreground text-background shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {renderLabel(option)}
        </button>
      ))}
    </div>
  );
}

interface RecentScan {
  id: string;
  format: ScanFormat;
  timestamp: Date;
  blob: Blob;
  url: string;
}

function ScanThumbnail({
  scan,
  onDownload,
}: {
  scan: RecentScan;
  onDownload: () => void;
}) {
  const isImage = scan.format === "image/jpeg";
  return (
    <button
      onClick={onDownload}
      className="shrink-0 w-20 h-24 rounded-xl border border-border bg-card flex flex-col items-center justify-center gap-1 hover:bg-muted transition-colors group"
    >
      {isImage ? (
        <ImageIcon className="size-6 text-muted-foreground/50 group-hover:hidden" />
      ) : (
        <File className="size-6 text-muted-foreground/50 group-hover:hidden" />
      )}
      <Download className="size-6 text-foreground hidden group-hover:block" />
      <span className="text-[10px] text-muted-foreground">
        {scan.timestamp.toLocaleTimeString([], {
          hour: "numeric",
          minute: "2-digit",
        })}
      </span>
    </button>
  );
}

function EmptyScans() {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <File className="size-10 text-muted-foreground/30 mb-2" />
      <p className="text-sm text-muted-foreground">No recent scans</p>
      <p className="text-xs text-muted-foreground/70">
        Scanned documents will appear here
      </p>
    </div>
  );
}

function ScannerStatusBadge({
  status,
  error,
}: {
  status: ScannerStatus | null;
  error: string | null;
}) {
  if (error) {
    return (
      <div className="flex items-center gap-2 text-sm text-status-error">
        <AlertCircle className="size-4" />
        <span>{error}</span>
      </div>
    );
  }

  if (!status) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        <span>Connecting...</span>
      </div>
    );
  }

  const stateConfig = {
    Idle: { color: "bg-status-ready", label: "Ready" },
    Processing: { color: "bg-status-warning", label: "Scanning" },
    Stopped: { color: "bg-status-error", label: "Stopped" },
  };

  const adfConfig = {
    ScannerAdfEmpty: { label: "ADF Empty", icon: null },
    ScannerAdfLoaded: { label: "Documents in ADF", icon: FileStack },
    ScannerAdfJam: { label: "ADF Jam", icon: AlertCircle },
  };

  const state = stateConfig[status.state];
  const adf = adfConfig[status.adfState];

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2">
        <div className={cn("size-2 rounded-full", state.color)} />
        <span className="text-sm font-medium">{state.label}</span>
      </div>
      {status.adfState !== "ScannerAdfEmpty" && (
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          {adf.icon && <adf.icon className="size-4" />}
          <span>{adf.label}</span>
        </div>
      )}
    </div>
  );
}

export function Scanner() {
  const [state, setState] = useState<ScanState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [preset, setPreset] = useState<PresetMode>("document");
  const [settings, setSettings] = useState<ScanSettings>(defaultSettings);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [recentScans, setRecentScans] = useState<RecentScan[]>([]);

  // Poll scanner status via TanStack Query
  const { data: scannerStatus, error: connectionError } = useScannerStatus({
    pollInterval: 3000,
  });

  const handlePresetChange = (newPreset: PresetMode) => {
    setPreset(newPreset);
    if (newPreset !== "custom") {
      setSettings({ ...settings, ...presets[newPreset] });
    }
  };

  const updateSetting = <K extends keyof ScanSettings>(
    key: K,
    value: ScanSettings[K],
  ) => {
    setSettings({ ...settings, [key]: value });
    setPreset("custom");
  };

  const handleScan = useCallback(async () => {
    if (state === "complete" || state === "error") {
      setState("idle");
      setError(null);
      return;
    }

    if (state === "scanning") return;

    setState("scanning");
    setError(null);

    const scanSize = SCAN_SIZES[settings.scanSize];
    const apiSettings: APIScanSettings = {
      intent: settings.intent,
      source: settings.source,
      colorMode: settings.colorMode,
      resolution: settings.resolution,
      format: settings.format,
      width: scanSize.width,
      height: scanSize.height,
    };

    try {
      const blob = await performScan(apiSettings);

      const url = URL.createObjectURL(blob);
      const newScan: RecentScan = {
        id: crypto.randomUUID(),
        format: settings.format,
        timestamp: new Date(),
        blob,
        url,
      };

      setRecentScans((scans) => [newScan, ...scans].slice(0, 10));
      setState("complete");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Scan failed");
      setState("error");
    }
  }, [state, settings]);

  const handleDownload = (scan: RecentScan) => {
    const ext = scan.format === "image/jpeg" ? "jpg" : "pdf";
    const filename = `scan-${scan.timestamp.toISOString().slice(0, 19).replace(/[T:]/g, "-")}.${ext}`;

    const a = document.createElement("a");
    a.href = scan.url;
    a.download = filename;
    a.click();
  };

  const getSourceLabel = () =>
    settings.source === "Platen" ? "flatbed glass" : "document feeder";

  const getColorModeLabel = (mode: ScanColorMode) => {
    const labels: Record<ScanColorMode, string> = {
      RGB24: "Color",
      Grayscale8: "Gray",
      BlackAndWhite1: "B&W",
    };
    return labels[mode];
  };

  const getFormatLabel = (format: ScanFormat) =>
    format === "application/pdf" ? "PDF" : "JPEG";

  // Find closest resolution index for slider
  const resolutionIndex = RESOLUTIONS.indexOf(settings.resolution);

  return (
    <div className="w-full max-w-lg mx-auto px-4 py-6 space-y-4">
      {/* Scanner Status */}
      <div className="flex items-center justify-between">
        <ScannerStatusBadge status={scannerStatus} error={connectionError} />
      </div>

      {/* Preset Mode Tabs */}
      <div className="flex gap-2">
        <PresetTab
          icon={FileText}
          label="Document"
          description="PDF · 300 DPI"
          selected={preset === "document"}
          onClick={() => handlePresetChange("document")}
        />
        <PresetTab
          icon={Image}
          label="Photo"
          description="JPEG · 600 DPI"
          selected={preset === "photo"}
          onClick={() => handlePresetChange("photo")}
        />
        <PresetTab
          icon={Settings}
          label="Custom"
          description="Your settings"
          selected={preset === "custom"}
          onClick={() => handlePresetChange("custom")}
        />
      </div>

      {/* Scan Area */}
      <button
        onClick={handleScan}
        disabled={state === "scanning" || scannerStatus?.state === "Stopped"}
        className={cn(
          "w-full aspect-[4/3] rounded-2xl border-2 border-dashed transition-all duration-200",
          "flex flex-col items-center justify-center gap-3",
          state === "scanning"
            ? "border-muted-foreground/30 bg-muted/30"
            : state === "error"
              ? "border-status-error/30 bg-status-error/5"
              : "border-border hover:border-foreground/30 hover:bg-muted/20 active:scale-[0.99]",
        )}
      >
        {state === "scanning" ? (
          <>
            <div className="relative size-16">
              <ScanLine className="size-16 text-muted-foreground animate-pulse" />
              <Loader2 className="absolute inset-0 m-auto size-8 animate-spin text-foreground" />
            </div>
            <span className="text-lg font-semibold">Scanning...</span>
            <span className="text-sm text-muted-foreground">
              Please wait while the document is scanned
            </span>
          </>
        ) : state === "complete" ? (
          <>
            <ScanLine className="size-12 text-status-ready" />
            <span className="text-lg font-semibold">Scan Complete</span>
            <span className="text-sm text-muted-foreground">
              Tap to scan again
            </span>
          </>
        ) : state === "error" ? (
          <>
            <AlertCircle className="size-12 text-status-error" />
            <span className="text-lg font-semibold">Scan Failed</span>
            <span className="text-sm text-muted-foreground">{error}</span>
            <span className="text-xs text-muted-foreground mt-1">
              Tap to try again
            </span>
          </>
        ) : (
          <>
            <ScanLine className="size-12 text-muted-foreground" />
            <span className="text-lg font-semibold">Tap to Scan</span>
            <span className="text-sm text-muted-foreground">
              Place document on {getSourceLabel()}
            </span>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                {settings.resolution} DPI
              </span>
              <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                {getColorModeLabel(settings.colorMode)}
              </span>
              <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                {getFormatLabel(settings.format)}
              </span>
            </div>
          </>
        )}
      </button>

      {/* Settings Card */}
      <div className="bg-card rounded-2xl border border-border divide-y divide-border">
        {/* Source */}
        <div className="flex items-center justify-between p-4">
          <span className="text-sm font-medium flex items-center gap-1.5">
            Source
            <Tooltip>
              <TooltipTrigger className="text-muted-foreground hover:text-foreground">
                <Info className="size-4" />
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-[240px] text-left">
                <p className="font-medium mb-1">Flatbed</p>
                <p className="mb-2">
                  Place a single page face-down on the glass scanner bed.
                </p>
                <p className="font-medium mb-1">ADF (Auto Document Feeder)</p>
                <p>
                  Load multiple pages face-up in the top tray for automatic
                  feeding.
                </p>
              </TooltipContent>
            </Tooltip>
          </span>
          <SegmentedControl
            options={["Platen", "Adf"] as const}
            value={settings.source}
            onChange={(v) => updateSetting("source", v)}
            renderLabel={(option) => (
              <span className="flex items-center gap-1.5">
                {option === "Platen" ? (
                  <Monitor className="size-4" />
                ) : (
                  <FileStack className="size-4" />
                )}
                {option === "Platen" ? "Flatbed" : "ADF"}
              </span>
            )}
          />
        </div>

        {/* Resolution */}
        <div className="flex items-center justify-between p-4">
          <span className="text-sm font-medium">Resolution</span>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min="0"
              max={RESOLUTIONS.length - 1}
              step="1"
              value={resolutionIndex}
              onChange={(e) =>
                updateSetting("resolution", RESOLUTIONS[Number(e.target.value)])
              }
              className="w-24 accent-foreground"
            />
            <span className="text-sm font-semibold tabular-nums w-16 text-right">
              {settings.resolution} DPI
            </span>
          </div>
        </div>

        {/* Color */}
        <div className="flex items-center justify-between p-4">
          <span className="text-sm font-medium">Color</span>
          <SegmentedControl
            options={["RGB24", "Grayscale8", "BlackAndWhite1"] as const}
            value={settings.colorMode}
            onChange={(v) => updateSetting("colorMode", v)}
            renderLabel={getColorModeLabel}
          />
        </div>

        {/* Format */}
        <div className="flex items-center justify-between p-4">
          <span className="text-sm font-medium">Format</span>
          <SegmentedControl
            options={["application/pdf", "image/jpeg"] as const}
            value={settings.format}
            onChange={(v) => updateSetting("format", v)}
            renderLabel={getFormatLabel}
          />
        </div>

        {/* Advanced Toggle */}
        <button
          onClick={() => setAdvancedOpen(!advancedOpen)}
          className="w-full flex items-center justify-center gap-2 p-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Advanced
          <ChevronUp
            className={cn(
              "size-4 transition-transform",
              !advancedOpen && "rotate-180",
            )}
          />
        </button>

        {/* Advanced Settings */}
        {advancedOpen && (
          <div className="px-4 pb-2">
            <div className="flex items-center justify-between py-3 border-b border-border">
              <span className="text-sm text-muted-foreground">Page size</span>
              <select
                value={settings.scanSize}
                onChange={(e) =>
                  updateSetting("scanSize", e.target.value as ScanSizeKey)
                }
                className="text-sm font-medium bg-transparent"
              >
                <option value="letter">Letter (8.5×11&quot;)</option>
                <option value="legal">Legal (8.5×14&quot;)</option>
                <option value="a4">A4</option>
                <option value="photo4x6">4×6 Photo</option>
                <option value="photo5x7">5×7 Photo</option>
              </select>
            </div>
            <div className="flex items-center justify-between py-3">
              <span className="text-sm text-muted-foreground">Intent</span>
              <select
                value={settings.intent}
                onChange={(e) =>
                  updateSetting("intent", e.target.value as ScanIntent)
                }
                className="text-sm font-medium bg-transparent"
              >
                <option value="Document">Document</option>
                <option value="Photo">Photo</option>
                <option value="TextAndGraphic">Text &amp; Graphic</option>
                <option value="Preview">Preview</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Recent Scans */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-muted-foreground">
            Recent Scans
          </h2>
          {recentScans.length > 0 && (
            <button className="text-sm text-muted-foreground hover:text-foreground">
              View All
            </button>
          )}
        </div>
        {recentScans.length === 0 ? (
          <EmptyScans />
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-2">
            {recentScans.map((scan) => (
              <ScanThumbnail
                key={scan.id}
                scan={scan}
                onDownload={() => handleDownload(scan)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
