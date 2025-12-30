"use client";

import { FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import type { InkLevel, PaperTray } from "@/lib/types";

// Compact ink dots showing all cartridge colors
function InkDots({ levels }: { levels: InkLevel[] }) {
  return (
    <div className="flex items-center gap-1">
      {levels.map((ink) => (
        <div
          key={ink.color}
          className={cn(
            "size-3 rounded-sm",
            ink.color === "K" && "bg-ink-black",
            ink.color === "C" && "bg-ink-cyan",
            ink.color === "M" && "bg-ink-magenta",
            ink.color === "Y" && "bg-ink-yellow",
            ink.percentRemaining < 20 && "opacity-50",
          )}
        />
      ))}
    </div>
  );
}

// Ink status pill
function InkPill({ levels }: { levels: InkLevel[] }) {
  const lowCount = levels.filter((ink) => ink.percentRemaining < 20).length;
  const hasLow = lowCount > 0;

  return (
    <button
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-full border transition-colors",
        hasLow
          ? "bg-status-busy/8 border-status-busy/30 hover:bg-status-busy/12"
          : "bg-muted/30 border-border/50 hover:bg-muted/50",
      )}
    >
      <InkDots levels={levels} />
      <span className="text-sm font-medium">Ink</span>
      {hasLow && (
        <span className="text-sm font-semibold text-status-busy">
          {lowCount} Low
        </span>
      )}
    </button>
  );
}

// Paper status pill
function PaperPill({ paper }: { paper: PaperTray }) {
  const isEmpty = paper.state === "missing";
  const hasJam = paper.state === "jam";
  const hasIssue = isEmpty || hasJam;

  return (
    <button
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-full border transition-colors",
        hasIssue
          ? "bg-status-error/8 border-status-error/30 hover:bg-status-error/12"
          : "bg-muted/30 border-border/50 hover:bg-muted/50",
      )}
    >
      <FileText
        className={cn(
          "size-4",
          hasIssue ? "text-status-error" : "text-muted-foreground",
        )}
      />
      <span className="text-sm font-medium">Paper</span>
      {hasIssue && (
        <span className="text-sm font-semibold text-status-error">
          {isEmpty ? "Empty" : "Jam"}
        </span>
      )}
    </button>
  );
}

// Combined status pills row
export function StatusPills({
  ink,
  paper,
}: {
  ink: InkLevel[];
  paper: PaperTray;
}) {
  return (
    <div className="flex gap-3">
      <InkPill levels={ink} />
      <PaperPill paper={paper} />
    </div>
  );
}
