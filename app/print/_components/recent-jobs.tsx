"use client";

import {
  FileText,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Item,
  ItemMedia,
  ItemContent,
  ItemTitle,
  ItemDescription,
  ItemActions,
  ItemGroup,
} from "@/components/ui/item";
import { cn } from "@/lib/utils";

export interface RecentJob {
  id: string;
  fileName: string;
  fileType: "pdf" | "image";
  pages: number;
  colorMode: "color" | "bw";
  status: "completed" | "failed";
  timestamp: string;
}

interface RecentJobsProps {
  jobs: RecentJob[];
  onViewAll?: () => void;
}

export function RecentJobs({ jobs, onViewAll }: RecentJobsProps) {
  if (jobs.length === 0) return null;

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Recent Print Jobs
        </h2>
        {onViewAll && (
          <button
            onClick={onViewAll}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            View All
          </button>
        )}
      </div>

      <ItemGroup>
        {jobs.map((job) => (
          <RecentJobItem key={job.id} job={job} />
        ))}
      </ItemGroup>
    </section>
  );
}

function RecentJobItem({ job }: { job: RecentJob }) {
  const Icon = job.fileType === "pdf" ? FileText : ImageIcon;
  const StatusIcon = job.status === "completed" ? CheckCircle2 : AlertCircle;

  return (
    <Item size="sm" className="hover:bg-muted/50 rounded-lg">
      <ItemMedia variant="icon" className="size-9 rounded-lg bg-muted">
        <Icon className="size-4 text-muted-foreground" />
      </ItemMedia>

      <ItemContent>
        <ItemTitle>{job.fileName}</ItemTitle>
        <ItemDescription>
          {job.pages} {job.pages === 1 ? "page" : "pages"} ·{" "}
          {job.colorMode === "color" ? "Color" : "B&W"} · {job.timestamp}
        </ItemDescription>
      </ItemContent>

      <ItemActions>
        <Badge
          variant="outline"
          className={cn(
            "gap-1",
            job.status === "completed"
              ? "text-chart-3 border-chart-3/30"
              : "text-destructive border-destructive/30",
          )}
        >
          <StatusIcon className="size-3" />
          {job.status === "completed" ? "Done" : "Failed"}
        </Badge>
      </ItemActions>
    </Item>
  );
}
