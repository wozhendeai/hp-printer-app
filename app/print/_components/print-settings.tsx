"use client";

import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export interface PrintSettings {
  copies: number;
  colorMode: "color" | "bw";
  duplex: boolean;
  quality: "draft" | "normal" | "best";
  paperSize: string;
  paperType: string;
}

interface PrintSettingsFormProps {
  settings: PrintSettings;
  onChange: (settings: PrintSettings) => void;
  disabled?: boolean;
}

const PAPER_SIZES = [
  { value: "letter", label: "Letter" },
  { value: "legal", label: "Legal" },
  { value: "a4", label: "A4" },
  { value: "4x6", label: "4×6 Photo" },
  { value: "5x7", label: "5×7 Photo" },
];

const PAPER_TYPES = [
  { value: "plain", label: "Plain Paper" },
  { value: "glossy", label: "Photo Glossy" },
  { value: "matte", label: "Photo Matte" },
  { value: "brochure", label: "Brochure" },
  { value: "envelope", label: "Envelope" },
];

export function PrintSettingsForm({
  settings,
  onChange,
  disabled,
}: PrintSettingsFormProps) {
  const updateSetting = <K extends keyof PrintSettings>(
    key: K,
    value: PrintSettings[K],
  ) => {
    onChange({ ...settings, [key]: value });
  };

  const incrementCopies = () => {
    if (settings.copies < 99) {
      updateSetting("copies", settings.copies + 1);
    }
  };

  const decrementCopies = () => {
    if (settings.copies > 1) {
      updateSetting("copies", settings.copies - 1);
    }
  };

  return (
    <div
      className={cn(
        "divide-y divide-border border rounded-xl overflow-hidden bg-card",
        disabled && "opacity-50 pointer-events-none",
      )}
    >
      {/* Copies */}
      <SettingRow label="Copies">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon-sm"
            onClick={decrementCopies}
            disabled={settings.copies <= 1}
          >
            <Minus className="size-3.5" />
          </Button>
          <span className="w-8 text-center font-medium tabular-nums">
            {settings.copies}
          </span>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={incrementCopies}
            disabled={settings.copies >= 99}
          >
            <Plus className="size-3.5" />
          </Button>
        </div>
      </SettingRow>

      {/* Color Mode */}
      <SettingRow label="Color">
        <ButtonGroup>
          <ToggleButton
            active={settings.colorMode === "color"}
            onClick={() => updateSetting("colorMode", "color")}
          >
            Color
          </ToggleButton>
          <ToggleButton
            active={settings.colorMode === "bw"}
            onClick={() => updateSetting("colorMode", "bw")}
          >
            B&W
          </ToggleButton>
        </ButtonGroup>
      </SettingRow>

      {/* Duplex */}
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

      {/* Quality */}
      <SettingRow label="Quality">
        <ButtonGroup>
          <ToggleButton
            active={settings.quality === "draft"}
            onClick={() => updateSetting("quality", "draft")}
          >
            Draft
          </ToggleButton>
          <ToggleButton
            active={settings.quality === "normal"}
            onClick={() => updateSetting("quality", "normal")}
          >
            Normal
          </ToggleButton>
          <ToggleButton
            active={settings.quality === "best"}
            onClick={() => updateSetting("quality", "best")}
          >
            Best
          </ToggleButton>
        </ButtonGroup>
      </SettingRow>

      {/* Paper Size */}
      <SettingRow label="Paper size">
        <Select
          value={settings.paperSize}
          onValueChange={(value) => value && updateSetting("paperSize", value)}
        >
          <SelectTrigger className="w-32">
            <SelectValue>
              {PAPER_SIZES.find((s) => s.value === settings.paperSize)?.label}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {PAPER_SIZES.map((size) => (
              <SelectItem key={size.value} value={size.value}>
                {size.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </SettingRow>

      {/* Paper Type */}
      <SettingRow label="Paper type">
        <Select
          value={settings.paperType}
          onValueChange={(value) => value && updateSetting("paperType", value)}
        >
          <SelectTrigger className="w-32">
            <SelectValue>
              {PAPER_TYPES.find((t) => t.value === settings.paperType)?.label}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {PAPER_TYPES.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </SettingRow>
    </div>
  );
}

function SettingRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <span className="text-sm font-medium">{label}</span>
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
