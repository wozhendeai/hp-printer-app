"use client";

import { useState, useCallback, useMemo } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  FileText,
  Image as ImageIcon,
  Settings,
  Monitor,
  FileStack,
  ChevronUp,
  File,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ItemGroup } from "@/components/ui/item";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { performScan } from "@/lib/api/printer";
import { useScannerStatus } from "@/lib/queries/printer";
import type {
  ScanColorMode,
  ScanSource,
  ScanFormat,
  ScanIntent,
  ScanSettings,
} from "@/lib/types";
import type { PresetMode, RecentScan } from "../_lib/types";
import {
  SCAN_SIZES,
  DEFAULT_SCAN_SETTINGS,
  derivePreset,
  deriveScanSizeKey,
  indexToResolution,
  PRESET_CONFIGS,
  RESOLUTIONS,
  resolutionToIndex,
  SCAN_SIZE_LABELS,
} from "@/lib/constants";
import { ScanArea } from "./scan-area";
import { ScannerStatusBadge } from "./scanner-status-badge";
import { ScanThumbnail } from "./scan-thumbnail";

const presetItemClassName = "flex-1 flex-col gap-1 h-auto px-4 py-3";

export function Scanner() {
  function getMockRecentScans(): RecentScan[] {
    const now = Date.now();
    const scans: RecentScan[] = [
      {
        id: "1",
        format: "application/pdf",
        timestamp: new Date(now - 3600 * 1000),
        blob: new Blob(["PDF Scan 1"], { type: "application/pdf" }),
        url: URL.createObjectURL(
          new Blob(["PDF Scan 1"], { type: "application/pdf" }),
        ),
      },
      {
        id: "2",
        format: "image/jpeg",
        timestamp: new Date(now - 7200 * 1000),
        blob: new Blob(["JPEG Scan 2"], { type: "image/jpeg" }),
        url: URL.createObjectURL(
          new Blob(["JPEG Scan 2"], { type: "image/jpeg" }),
        ),
      },
    ];
    return scans;
  }

  const [settings, setSettings] = useState(DEFAULT_SCAN_SETTINGS);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [recentScans, setRecentScans] = useState<RecentScan[]>(() =>
    getMockRecentScans(),
  );

  // Scan mutation replaces useState<ScanState>
  const scanMutation = useMutation({
    mutationFn: (scanSettings: ScanSettings) => performScan(scanSettings),
    onSuccess: (blob) => {
      const url = URL.createObjectURL(blob);
      const newScan: RecentScan = {
        id: crypto.randomUUID(),
        format: settings.format,
        timestamp: new Date(),
        blob,
        url,
      };
      setRecentScans((scans) => [newScan, ...scans].slice(0, 10));
    },
  });

  // Derived values
  const preset = useMemo(() => derivePreset(settings), [settings]);
  const scanSizeKey = useMemo(() => deriveScanSizeKey(settings), [settings]);
  const resolutionIndex = useMemo(
    () => resolutionToIndex(settings.resolution),
    [settings.resolution],
  );

  // Scanner status via TanStack Query
  const scannerStatus = useScannerStatus({ pollInterval: 3000 });

  const handlePresetChange = useCallback((newPreset: PresetMode) => {
    if (newPreset === "custom") return;

    setSettings((prev) => ({
      ...prev,
      ...PRESET_CONFIGS[newPreset],
    }));
  }, []);

  const updateSetting = useCallback(
    <K extends keyof typeof settings>(key: K, value: (typeof settings)[K]) => {
      setSettings((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const handleScanSizeChange = useCallback(
    (sizeKey: keyof typeof SCAN_SIZES) => {
      const size = SCAN_SIZES[sizeKey];
      setSettings((prev) => ({
        ...prev,
        width: size.width,
        height: size.height,
      }));
    },
    [],
  );

  const handleResolutionChange = useCallback(
    (value: number | readonly number[]) => {
      const index = Array.isArray(value) ? value[0] : value;
      const resolution = indexToResolution(index);
      setSettings((prev) => ({ ...prev, resolution }));
    },
    [],
  );

  const handleScan = useCallback(() => {
    // Reset if complete or error, otherwise start scan
    if (scanMutation.isSuccess || scanMutation.isError) {
      scanMutation.reset();
      return;
    }

    if (scanMutation.isPending) return;

    scanMutation.mutate(settings);
  }, [scanMutation, settings]);

  const handleDownload = useCallback((scan: RecentScan) => {
    const ext = scan.format === "image/jpeg" ? "jpg" : "pdf";
    const filename = `scan-${scan.timestamp.toISOString().slice(0, 19).replace(/[T:]/g, "-")}.${ext}`;

    const a = document.createElement("a");
    a.href = scan.url;
    a.download = filename;
    a.click();
  }, []);

  const isScanDisabled =
    scanMutation.isPending || scannerStatus.data?.state === "stopped";

  return (
    <div className="w-full max-w-lg mx-auto px-4 py-6 space-y-4">
      {/* Scanner Status */}
      <div className="flex items-center justify-between">
        <ScannerStatusBadge
          status={scannerStatus.data}
          error={scannerStatus.error}
        />
      </div>

      {/* Preset Mode Tabs */}
      <ToggleGroup
        value={[preset]}
        onValueChange={(values) =>
          values[0] && handlePresetChange(values[0] as PresetMode)
        }
        variant="cards"
        className="w-full"
      >
        <ToggleGroupItem value="document" className={presetItemClassName}>
          <FileText className="size-6" />
          <span className="font-semibold text-sm">Document</span>
          <span className="text-xs opacity-70">PDF · 300 DPI</span>
        </ToggleGroupItem>
        <ToggleGroupItem value="photo" className={presetItemClassName}>
          <ImageIcon className="size-6" />
          <span className="font-semibold text-sm">Photo</span>
          <span className="text-xs opacity-70">JPEG · 600 DPI</span>
        </ToggleGroupItem>
        <ToggleGroupItem value="custom" className={presetItemClassName}>
          <Settings className="size-6" />
          <span className="font-semibold text-sm">Custom</span>
          <span className="text-xs opacity-70">Your settings</span>
        </ToggleGroupItem>
      </ToggleGroup>

      {/* Scan Area */}
      <ScanArea
        settings={settings}
        disabled={isScanDisabled}
        onScan={handleScan}
        isPending={scanMutation.isPending}
        isSuccess={scanMutation.isSuccess}
        isError={scanMutation.isError}
        errorMessage={
          scanMutation.error instanceof Error
            ? scanMutation.error.message
            : undefined
        }
      />

      {/* Settings Card */}
      <FieldGroup className="bg-card rounded-2xl border border-border divide-y divide-border overflow-hidden">
        {/* Source */}
        <Field orientation="horizontal" className="p-4">
          <FieldContent>
            <FieldLabel>Source</FieldLabel>
            <FieldDescription>
              Flatbed for single pages, ADF for stacks
            </FieldDescription>
          </FieldContent>
          <ToggleGroup
            value={[settings.source]}
            onValueChange={(values) =>
              values[0] && updateSetting("source", values[0] as ScanSource)
            }
            variant="segmented"
          >
            <ToggleGroupItem
              value="Platen"
              aria-label="Flatbed"
              className="gap-1.5 flex-1"
            >
              <Monitor className="size-4" />
              Flatbed
            </ToggleGroupItem>
            <ToggleGroupItem
              value="Adf"
              aria-label="ADF"
              className="gap-1.5 flex-1"
            >
              <FileStack className="size-4" />
              ADF
            </ToggleGroupItem>
          </ToggleGroup>
        </Field>

        {/* Resolution */}
        <Field orientation="horizontal" className="p-4">
          <FieldLabel>Resolution</FieldLabel>
          <div className="flex items-center gap-3">
            <Slider
              value={[resolutionIndex]}
              onValueChange={handleResolutionChange}
              min={0}
              max={RESOLUTIONS.length - 1}
              step={1}
              className="w-24"
            />
            <span className="text-sm font-semibold tabular-nums w-16 text-right">
              {settings.resolution} DPI
            </span>
          </div>
        </Field>

        {/* Color */}
        <Field orientation="horizontal" className="p-4">
          <FieldLabel>Color</FieldLabel>
          <ToggleGroup
            value={[settings.colorMode]}
            onValueChange={(values) =>
              values[0] &&
              updateSetting("colorMode", values[0] as ScanColorMode)
            }
            variant="segmented"
          >
            <ToggleGroupItem value="RGB24" className="flex-1">
              Color
            </ToggleGroupItem>
            <ToggleGroupItem value="Grayscale8" className="flex-1">
              Gray
            </ToggleGroupItem>
            <ToggleGroupItem value="BlackAndWhite1" className="flex-1">
              B&W
            </ToggleGroupItem>
          </ToggleGroup>
        </Field>

        {/* Format */}
        <Field orientation="horizontal" className="p-4">
          <FieldLabel>Format</FieldLabel>
          <ToggleGroup
            value={[settings.format]}
            onValueChange={(values) =>
              values[0] && updateSetting("format", values[0] as ScanFormat)
            }
            variant="segmented"
          >
            <ToggleGroupItem value="application/pdf" className="flex-1">
              PDF
            </ToggleGroupItem>
            <ToggleGroupItem value="image/jpeg" className="flex-1">
              JPEG
            </ToggleGroupItem>
          </ToggleGroup>
        </Field>

        {/* Advanced Toggle */}
        <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
          <CollapsibleTrigger
            className={cn(
              "w-full flex items-center justify-center gap-2 p-3 text-sm",
              "text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors",
            )}
          >
            Advanced
            <ChevronUp
              className={cn(
                "size-4 transition-transform",
                !advancedOpen && "rotate-180",
              )}
            />
          </CollapsibleTrigger>

          <CollapsibleContent className="divide-y divide-border">
            <Field orientation="horizontal" className="px-4 py-3">
              <FieldLabel className="text-muted-foreground font-normal">
                Page size
              </FieldLabel>
              <Select
                value={scanSizeKey}
                onValueChange={(value) =>
                  handleScanSizeChange(value as keyof typeof SCAN_SIZES)
                }
              >
                <SelectTrigger className="border-0 shadow-none h-auto p-0 text-sm font-medium">
                  <SelectValue>{SCAN_SIZE_LABELS[scanSizeKey]}</SelectValue>
                </SelectTrigger>
                <SelectContent align="end">
                  {Object.entries(SCAN_SIZE_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field orientation="horizontal" className="px-4 py-3">
              <FieldLabel className="text-muted-foreground font-normal">
                Intent
              </FieldLabel>
              <Select
                value={settings.intent}
                onValueChange={(value) =>
                  updateSetting("intent", value as ScanIntent)
                }
              >
                <SelectTrigger className="border-0 shadow-none h-auto p-0 text-sm font-medium">
                  <SelectValue>
                    {settings.intent === "TextAndGraphic"
                      ? "Text & Graphic"
                      : settings.intent}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent align="end">
                  <SelectItem value="Document">Document</SelectItem>
                  <SelectItem value="Photo">Photo</SelectItem>
                  <SelectItem value="TextAndGraphic">Text & Graphic</SelectItem>
                  <SelectItem value="Preview">Preview</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </CollapsibleContent>
        </Collapsible>
      </FieldGroup>

      {/* Recent Scans */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-muted-foreground">
            Recent Scans
          </h2>
          {recentScans.length > 0 && (
            <Button
              variant="link"
              size="sm"
              className="h-auto p-0 text-muted-foreground"
            >
              View All
            </Button>
          )}
        </div>
        {recentScans.length === 0 ? (
          <Empty className="py-8 border-0">
            <EmptyHeader>
              <EmptyMedia>
                <File className="size-10 text-muted-foreground/30" />
              </EmptyMedia>
              <EmptyTitle className="text-sm">No recent scans</EmptyTitle>
              <EmptyDescription className="text-xs">
                Scanned documents will appear here
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <ItemGroup className="flex-row flex-nowrap gap-3 overflow-x-auto pb-2">
            {recentScans.map((scan) => (
              <ScanThumbnail
                key={scan.id}
                scan={scan}
                onDownload={() => handleDownload(scan)}
              />
            ))}
          </ItemGroup>
        )}
      </div>
    </div>
  );
}
