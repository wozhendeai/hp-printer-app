"use client";

import { Minus, Plus, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CopyCounterProps {
  value: number;
  onChange: (value: number) => void;
  onStartCopy: () => void;
  disabled?: boolean;
}

export function CopyCounter({
  value,
  onChange,
  onStartCopy,
  disabled,
}: CopyCounterProps) {
  const decrement = () => {
    if (value > 1) {
      onChange(value - 1);
    }
  };

  const increment = () => {
    if (value < 99) {
      onChange(value + 1);
    }
  };

  return (
    <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
      {/* Counter Controls */}
      <div className="flex items-center justify-center gap-6">
        <Button
          variant="outline"
          size="icon"
          className="size-12 rounded-full"
          onClick={decrement}
          disabled={value <= 1 || disabled}
          aria-label="Decrease copies"
        >
          <Minus className="size-5" />
        </Button>

        <div className="flex flex-col items-center">
          <span
            className="text-5xl font-bold tabular-nums min-w-[3ch] text-center"
            aria-live="polite"
          >
            {value}
          </span>
          <span className="text-sm text-muted-foreground">
            {value === 1 ? "copy" : "copies"}
          </span>
        </div>

        <Button
          variant="outline"
          size="icon"
          className="size-12 rounded-full"
          onClick={increment}
          disabled={value >= 99 || disabled}
          aria-label="Increase copies"
        >
          <Plus className="size-5" />
        </Button>
      </div>

      {/* Start Button */}
      <Button
        className="w-full"
        size="lg"
        onClick={onStartCopy}
        disabled={disabled}
      >
        <Copy className="size-5" />
        Start Copy
      </Button>

      {/* Helper Text */}
      <p className="text-sm text-muted-foreground text-center">
        Place document on scanner glass or in feeder
      </p>
    </div>
  );
}
