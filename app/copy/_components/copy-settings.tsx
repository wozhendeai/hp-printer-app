"use client";

import { Monitor, FileStack, Info } from "lucide-react";
import {
  Field,
  FieldContent,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type {
  CopySettings,
  CopySource,
  CopyColorMode,
  CopyQuality,
  CopyResize,
} from "@/lib/types";

interface CopySettingsFormProps {
  settings: CopySettings;
  onChange: (settings: CopySettings) => void;
  disabled?: boolean;
}

const RESIZE_OPTIONS: { value: CopyResize; label: string }[] = [
  { value: "actual", label: "Actual size (100%)" },
  { value: "fit", label: "Fit to page" },
  { value: "shrink", label: "Shrink to fit" },
];

export function CopySettingsForm({
  settings,
  onChange,
  disabled,
}: CopySettingsFormProps) {
  const updateSetting = <K extends keyof CopySettings>(
    key: K,
    value: CopySettings[K],
  ) => {
    onChange({ ...settings, [key]: value });
  };

  return (
    <FieldGroup
      className={cn(
        "bg-card rounded-xl border border-border divide-y divide-border overflow-hidden",
        disabled && "opacity-50 pointer-events-none",
      )}
    >
      {/* Source: Flatbed | ADF */}
      <Field orientation="horizontal" className="p-4">
        <FieldContent>
          <FieldLabel className="flex items-center gap-1.5">
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
          </FieldLabel>
        </FieldContent>
        <ToggleGroup
          value={[settings.source]}
          onValueChange={(values) =>
            values[0] && updateSetting("source", values[0] as CopySource)
          }
          variant="segmented"
        >
          <ToggleGroupItem value="Platen" className="gap-1.5">
            <Monitor className="size-4" />
            Flatbed
          </ToggleGroupItem>
          <ToggleGroupItem value="Adf" className="gap-1.5">
            <FileStack className="size-4" />
            ADF
          </ToggleGroupItem>
        </ToggleGroup>
      </Field>

      {/* Color: Color | B&W */}
      <Field orientation="horizontal" className="p-4">
        <FieldLabel>Color</FieldLabel>
        <ToggleGroup
          value={[settings.colorMode]}
          onValueChange={(values) =>
            values[0] && updateSetting("colorMode", values[0] as CopyColorMode)
          }
          variant="segmented"
        >
          <ToggleGroupItem value="color">Color</ToggleGroupItem>
          <ToggleGroupItem value="bw">B&W</ToggleGroupItem>
        </ToggleGroup>
      </Field>

      {/* Two-sided: Off | On */}
      <Field orientation="horizontal" className="p-4">
        <FieldLabel>Two-sided</FieldLabel>
        <ToggleGroup
          value={[settings.duplex ? "on" : "off"]}
          onValueChange={(values) =>
            values[0] && updateSetting("duplex", values[0] === "on")
          }
          variant="segmented"
        >
          <ToggleGroupItem value="off">Off</ToggleGroupItem>
          <ToggleGroupItem value="on">On</ToggleGroupItem>
        </ToggleGroup>
      </Field>

      {/* Quality: Draft | Normal | Best */}
      <Field orientation="horizontal" className="p-4">
        <FieldLabel>Quality</FieldLabel>
        <ToggleGroup
          value={[settings.quality]}
          onValueChange={(values) =>
            values[0] && updateSetting("quality", values[0] as CopyQuality)
          }
          variant="segmented"
        >
          <ToggleGroupItem value="draft">Draft</ToggleGroupItem>
          <ToggleGroupItem value="normal">Normal</ToggleGroupItem>
          <ToggleGroupItem value="best">Best</ToggleGroupItem>
        </ToggleGroup>
      </Field>

      {/* Resize: Dropdown */}
      <Field orientation="horizontal" className="p-4">
        <FieldLabel>Resize</FieldLabel>
        <Select
          value={settings.resize}
          onValueChange={(value) =>
            value && updateSetting("resize", value as CopyResize)
          }
        >
          <SelectTrigger className="w-40">
            <SelectValue>
              {RESIZE_OPTIONS.find((o) => o.value === settings.resize)?.label}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {RESIZE_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      {/* Lighter/Darker: Slider */}
      <Field orientation="horizontal" className="p-4">
        <FieldLabel>Lighter/Darker</FieldLabel>
        <div className="flex items-center gap-3">
          <Slider
            value={[settings.brightness]}
            onValueChange={(value) => {
              const newValue = Array.isArray(value) ? value[0] : value;
              updateSetting("brightness", newValue);
            }}
            min={-5}
            max={5}
            step={1}
            className="w-24"
          />
          <span className="text-sm font-medium tabular-nums w-6 text-right">
            {settings.brightness > 0
              ? `+${settings.brightness}`
              : settings.brightness}
          </span>
        </div>
      </Field>
    </FieldGroup>
  );
}
