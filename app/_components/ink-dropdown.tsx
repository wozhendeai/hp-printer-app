"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

interface InkLevel {
  color: "black" | "cyan" | "magenta" | "yellow";
  level: number;
  label: string;
}

interface InkDropdownProps {
  levels?: InkLevel[];
}

const defaultLevels: InkLevel[] = [
  { color: "black", level: 85, label: "K" },
  { color: "cyan", level: 62, label: "C" },
  { color: "magenta", level: 45, label: "M" },
  { color: "yellow", level: 78, label: "Y" },
];

const inkColorMap = {
  black: "bg-ink-black",
  cyan: "bg-ink-cyan",
  magenta: "bg-ink-magenta",
  yellow: "bg-ink-yellow",
};

export function InkDropdown({ levels = defaultLevels }: InkDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={dropdownRef} className="relative">
      {/* Compact Preview Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-1 px-3 py-2 rounded-xl transition-all duration-200",
          "hover:bg-muted/80 active:scale-95",
          isOpen && "bg-muted",
        )}
        aria-expanded={isOpen}
        aria-label="Ink levels"
      >
        <div className="flex gap-0.5">
          {levels.map((ink) => (
            <div
              key={ink.color}
              className="w-6 h-1.5 bg-muted rounded-full overflow-hidden"
            >
              <div
                className={cn("h-full rounded-full", inkColorMap[ink.color])}
                style={{ width: `${ink.level}%` }}
              />
            </div>
          ))}
        </div>
      </button>

      {/* Dropdown Panel */}
      <div
        className={cn(
          "absolute top-full right-0 mt-2 w-56 p-4 rounded-2xl",
          "bg-card border border-border shadow-lg",
          "transition-all duration-200 origin-top-right",
          isOpen
            ? "opacity-100 scale-100 translate-y-0"
            : "opacity-0 scale-95 -translate-y-2 pointer-events-none",
        )}
      >
        <div className="space-y-3">
          {levels.map((ink) => (
            <div key={ink.color} className="flex items-center gap-3">
              {/* Label */}
              <span className="w-4 text-xs font-medium text-muted-foreground">
                {ink.label}
              </span>

              {/* Bar */}
              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-500",
                    inkColorMap[ink.color],
                  )}
                  style={{ width: `${ink.level}%` }}
                />
              </div>

              {/* Percentage */}
              <span className="w-8 text-xs text-right tabular-nums text-muted-foreground">
                {ink.level}%
              </span>
            </div>
          ))}
        </div>

        {/* Low ink warning */}
        {levels.some((ink) => ink.level < 20) && (
          <p className="mt-3 pt-3 border-t text-xs text-status-error">
            Low ink warning
          </p>
        )}
      </div>
    </div>
  );
}
