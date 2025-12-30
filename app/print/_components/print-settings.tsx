// CHANGES: Removed duplicate PrintSettings interface. Now imports from @/lib/types.
"use client";

import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { PrintSettings } from "@/lib/types";

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
    <FieldGroup
      className={cn(
        "bg-card rounded-xl border border-border divide-y divide-border overflow-hidden",
        disabled && "opacity-50 pointer-events-none",
      )}
    >
      {/* Copies */}
      <Field orientation="horizontal" className="p-4">
        <FieldLabel>Copies</FieldLabel>
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
      </Field>

      {/* Color Mode */}
      <Field orientation="horizontal" className="p-4">
        <FieldLabel>Color</FieldLabel>
        <ToggleGroup
          value={[settings.colorMode]}
          onValueChange={(values) =>
            values[0] && updateSetting("colorMode", values[0] as "color" | "bw")
          }
          variant="segmented"
        >
          <ToggleGroupItem value="color">Color</ToggleGroupItem>
          <ToggleGroupItem value="bw">B&W</ToggleGroupItem>
        </ToggleGroup>
      </Field>

      {/* Duplex */}
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

      {/* Quality */}
      <Field orientation="horizontal" className="p-4">
        <FieldLabel>Quality</FieldLabel>
        <ToggleGroup
          value={[settings.quality]}
          onValueChange={(values) =>
            values[0] &&
            updateSetting("quality", values[0] as "draft" | "normal" | "best")
          }
          variant="segmented"
        >
          <ToggleGroupItem value="draft">Draft</ToggleGroupItem>
          <ToggleGroupItem value="normal">Normal</ToggleGroupItem>
          <ToggleGroupItem value="best">Best</ToggleGroupItem>
        </ToggleGroup>
      </Field>

      {/* Paper Size */}
      <Field orientation="horizontal" className="p-4">
        <FieldLabel>Paper size</FieldLabel>
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
      </Field>

      {/* Paper Type */}
      <Field orientation="horizontal" className="p-4">
        <FieldLabel>Paper type</FieldLabel>
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
      </Field>
    </FieldGroup>
  );
}
