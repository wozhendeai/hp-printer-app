"use client";

import { Monitor, FileStack, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
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
} from "../_lib/copy-types";

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
    <div
      className={cn(
        "divide-y divide-border border rounded-xl overflow-hidden bg-card",
        disabled && "opacity-50 pointer-events-none",
      )}
    >
      {/* Source: Flatbed | ADF */}
      <SettingRow
        label="Source"
        tooltip={
          <>
            <p className="font-medium mb-1">Flatbed</p>
            <p className="mb-2">
              Place a single page face-down on the glass scanner bed.
            </p>
            <p className="font-medium mb-1">ADF (Auto Document Feeder)</p>
            <p>
              Load multiple pages face-up in the top tray for automatic feeding.
            </p>
          </>
        }
      >
        <SegmentedControl
          options={["Platen", "Adf"] as const}
          value={settings.source}
          onChange={(v) => updateSetting("source", v as CopySource)}
          renderLabel={(opt) => (
            <span className="flex items-center gap-1.5">
              {opt === "Platen" ? (
                <Monitor className="size-4" />
              ) : (
                <FileStack className="size-4" />
              )}
              {opt === "Platen" ? "Flatbed" : "ADF"}
            </span>
          )}
        />
      </SettingRow>

      {/* Color: Color | B&W */}
      <SettingRow label="Color">
        <ButtonGroup>
          <ToggleButton
            active={settings.colorMode === "color"}
            onClick={() => updateSetting("colorMode", "color" as CopyColorMode)}
          >
            Color
          </ToggleButton>
          <ToggleButton
            active={settings.colorMode === "bw"}
            onClick={() => updateSetting("colorMode", "bw" as CopyColorMode)}
          >
            B&W
          </ToggleButton>
        </ButtonGroup>
      </SettingRow>

      {/* Two-sided: Off | On */}
      <SettingRow label="Two-sided">
        <ButtonGroup>
          <ToggleButton
            active={!settings.duplex}
            onClick={() => updateSetting("duplex", false)}
          >
            Off
          </ToggleButton>
          <ToggleButton
            active={settings.duplex}
            onClick={() => updateSetting("duplex", true)}
          >
            On
          </ToggleButton>
        </ButtonGroup>
      </SettingRow>

      {/* Quality: Draft | Normal | Best */}
      <SettingRow label="Quality">
        <ButtonGroup>
          <ToggleButton
            active={settings.quality === "draft"}
            onClick={() => updateSetting("quality", "draft" as CopyQuality)}
          >
            Draft
          </ToggleButton>
          <ToggleButton
            active={settings.quality === "normal"}
            onClick={() => updateSetting("quality", "normal" as CopyQuality)}
          >
            Normal
          </ToggleButton>
          <ToggleButton
            active={settings.quality === "best"}
            onClick={() => updateSetting("quality", "best" as CopyQuality)}
          >
            Best
          </ToggleButton>
        </ButtonGroup>
      </SettingRow>

      {/* Resize: Dropdown */}
      <SettingRow label="Resize">
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
      </SettingRow>

      {/* Lighter/Darker: Slider */}
      <SettingRow label="Lighter/Darker">
        <BrightnessSlider
          value={settings.brightness}
          onChange={(v) => updateSetting("brightness", v)}
        />
      </SettingRow>
    </div>
  );
}

function SettingRow({
  label,
  tooltip,
  children,
}: {
  label: string;
  tooltip?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <span className="text-sm font-medium flex items-center gap-1.5">
        {label}
        {tooltip && (
          <Tooltip>
            <TooltipTrigger className="text-muted-foreground hover:text-foreground">
              <Info className="size-4" />
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-[240px] text-left">
              {tooltip}
            </TooltipContent>
          </Tooltip>
        )}
      </span>
      {children}
    </div>
  );
}

interface ToggleButtonProps {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

function ToggleButton({ active, onClick, children }: ToggleButtonProps) {
  return (
    <Button
      variant={active ? "default" : "outline"}
      size="sm"
      onClick={onClick}
      className="min-w-[4rem]"
    >
      {children}
    </Button>
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

function BrightnessSlider({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="flex items-center gap-3 w-40">
      <input
        type="range"
        min="-5"
        max="5"
        step="1"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-foreground"
      />
      <span className="text-sm font-medium tabular-nums w-6 text-right">
        {value > 0 ? `+${value}` : value}
      </span>
    </div>
  );
}
