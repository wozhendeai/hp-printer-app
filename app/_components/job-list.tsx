"use client";

import { useState } from "react";
import {
  FileText,
  X,
  Clock,
  CheckCircle2,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type JobStatus = "printing" | "queued" | "completed" | "failed";

interface PrintJob {
  id: string;
  name: string;
  pages: number;
  status: JobStatus;
  progress?: number;
  time: string;
}

const mockJobs: PrintJob[] = [
  {
    id: "1",
    name: "Quarterly Report.pdf",
    pages: 12,
    status: "printing",
    progress: 67,
    time: "Now",
  },
  {
    id: "2",
    name: "Meeting Notes.docx",
    pages: 3,
    status: "queued",
    time: "2 min",
  },
  {
    id: "3",
    name: "Invoice #4521.pdf",
    pages: 1,
    status: "completed",
    time: "10 min ago",
  },
  {
    id: "4",
    name: "Contract Draft v2.pdf",
    pages: 8,
    status: "completed",
    time: "25 min ago",
  },
  {
    id: "5",
    name: "Photo.jpg",
    pages: 1,
    status: "failed",
    time: "1 hour ago",
  },
];

const statusConfig = {
  printing: {
    icon: Loader2,
    label: "Printing",
    color: "text-status-busy",
    iconClass: "animate-spin",
  },
  queued: {
    icon: Clock,
    label: "Queued",
    color: "text-muted-foreground",
    iconClass: "",
  },
  completed: {
    icon: CheckCircle2,
    label: "Done",
    color: "text-status-ready",
    iconClass: "",
  },
  failed: {
    icon: AlertCircle,
    label: "Failed",
    color: "text-status-error",
    iconClass: "",
  },
};

function JobItem({ job, isActive }: { job: PrintJob; isActive?: boolean }) {
  const config = statusConfig[job.status];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "group flex items-center gap-4 p-4 rounded-2xl transition-all duration-200",
        isActive
          ? "bg-card border border-border shadow-sm"
          : "hover:bg-muted/50",
      )}
    >
      {/* Document icon */}
      <div
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-xl",
          isActive ? "bg-foreground text-background" : "bg-muted",
        )}
      >
        <FileText className="size-4" />
      </div>

      {/* Job info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium truncate">{job.name}</span>
          <span className="text-xs text-muted-foreground shrink-0">
            {job.pages} {job.pages === 1 ? "page" : "pages"}
          </span>
        </div>

        {isActive && job.progress !== undefined ? (
          <div className="mt-2">
            <Progress value={job.progress} className="h-1" />
            <p className="text-xs text-muted-foreground mt-1">
              {job.progress}% complete
            </p>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 mt-0.5">
            <Icon className={cn("size-3", config.color, config.iconClass)} />
            <span className={cn("text-xs", config.color)}>{config.label}</span>
            <span className="text-xs text-muted-foreground">· {job.time}</span>
          </div>
        )}
      </div>

      {/* Actions */}
      {(job.status === "printing" || job.status === "queued") && (
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                className="size-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              />
            }
          >
            <X className="size-4" />
          </TooltipTrigger>
          <TooltipContent>Cancel job</TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}

export function JobList() {
  const [jobs] = useState(mockJobs);

  const activeJob = jobs.find((j) => j.status === "printing");
  const queuedJobs = jobs.filter((j) => j.status === "queued");
  const historyJobs = jobs.filter(
    (j) => j.status === "completed" || j.status === "failed",
  );

  return (
    <div>
      {/* Active Job */}
      {activeJob && (
        <section className="mb-6">
          <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
            Now Printing
          </h2>
          <JobItem job={activeJob} isActive />
        </section>
      )}

      {/* Queue */}
      {queuedJobs.length > 0 && (
        <section className="mb-6">
          <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
            Up Next
          </h2>
          <div className="space-y-1">
            {queuedJobs.map((job) => (
              <JobItem key={job.id} job={job} />
            ))}
          </div>
        </section>
      )}

      {/* History */}
      {historyJobs.length > 0 && (
        <section>
          <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
            Recent
          </h2>
          <div className="space-y-1">
            {historyJobs.map((job) => (
              <JobItem key={job.id} job={job} />
            ))}
          </div>
        </section>
      )}

      {/* Empty state */}
      {jobs.length === 0 && (
        <div className="text-center py-12">
          <div className="size-14 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <FileText className="size-5 text-muted-foreground" />
          </div>
          <h3 className="font-medium mb-1">No print jobs</h3>
          <p className="text-sm text-muted-foreground">
            Print something to see it here
          </p>
        </div>
      )}
    </div>
  );
}
