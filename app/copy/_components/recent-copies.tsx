"use client";

import { Copy, CheckCircle, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { RecentCopy } from "../_lib/copy-types";

interface RecentCopiesProps {
  copies: RecentCopy[];
}

export function RecentCopies({ copies }: RecentCopiesProps) {
  if (copies.length === 0) {
    return null;
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Recent Copies
        </h2>
        {copies.length > 3 && (
          <button className="text-xs text-muted-foreground hover:text-foreground">
            View All
          </button>
        )}
      </div>

      <div className="bg-card rounded-xl border border-border divide-y divide-border overflow-hidden">
        {copies.slice(0, 5).map((copy) => (
          <RecentCopyItem key={copy.id} copy={copy} />
        ))}
      </div>
    </section>
  );
}

function RecentCopyItem({ copy }: { copy: RecentCopy }) {
  const settingsSummary = [
    copy.settings.colorMode === "color" ? "Color" : "B&W",
    copy.settings.quality.charAt(0).toUpperCase() +
      copy.settings.quality.slice(1),
  ].join(" · ");

  const timeString = formatRelativeTime(copy.timestamp);
  const copyLabel = copy.copies === 1 ? "1 copy" : `${copy.copies} copies`;

  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="size-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
        <Copy className="size-4 text-muted-foreground" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{copyLabel}</p>
        <p className="text-xs text-muted-foreground truncate">
          {settingsSummary} · {timeString}
        </p>
      </div>

      <Badge
        variant="outline"
        className={cn(
          "gap-1 shrink-0",
          copy.status === "completed"
            ? "text-status-ready border-status-ready/30"
            : "text-status-error border-status-error/30",
        )}
      >
        {copy.status === "completed" ? (
          <CheckCircle className="size-3" />
        ) : (
          <XCircle className="size-3" />
        )}
        {copy.status === "completed" ? "Done" : "Failed"}
      </Badge>
    </div>
  );
}

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) {
    return "Just now";
  }
  if (diffMins < 60) {
    return `${diffMins}m ago`;
  }
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }
  if (diffDays === 1) {
    return "Yesterday";
  }
  if (diffDays < 7) {
    return `${diffDays}d ago`;
  }

  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
