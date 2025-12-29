"use client";

import {
  CheckCircle2,
  AlertCircle,
  FileText,
  Image as ImageIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Item,
  ItemMedia,
  ItemContent,
  ItemTitle,
  ItemDescription,
} from "@/components/ui/item";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from "@/components/ui/empty";

interface PrintJob {
  fileName: string;
  fileType: "pdf" | "image";
  totalPages?: number;
  currentPage?: number;
  colorMode: "color" | "bw";
}

interface PrintingStatusProps {
  job: PrintJob;
  progress: number;
  onCancel: () => void;
}

export function PrintingStatus({
  job,
  progress,
  onCancel,
}: PrintingStatusProps) {
  const isSending = !job.totalPages;
  const pageText = job.totalPages
    ? `Printing page ${job.currentPage || 1}/${job.totalPages}`
    : "Uploading to printer...";

  return (
    <div className="space-y-4">
      <Item variant="outline" className="rounded-xl">
        <ItemMedia className="size-14 shrink-0 rounded-lg bg-muted flex items-center justify-center">
          <FileIcon type={job.fileType} />
        </ItemMedia>
        <ItemContent>
          <ItemTitle>{job.fileName}</ItemTitle>
          <div className="mt-1">
            <Progress value={isSending ? null : progress} className="h-1" />
            <ItemDescription className="mt-1">{pageText}</ItemDescription>
          </div>
        </ItemContent>
      </Item>

      <Button variant="outline" className="w-full" onClick={onCancel}>
        Cancel
      </Button>
    </div>
  );
}

interface PrintCompleteProps {
  job: PrintJob;
  onPrintAnother: () => void;
}

export function PrintComplete({ job, onPrintAnother }: PrintCompleteProps) {
  const colorText = job.colorMode === "color" ? "Color" : "B&W";
  const pagesText = job.totalPages ? `${job.totalPages} pages` : "1 page";

  return (
    <div className="space-y-4">
      <Empty className="border-0 p-8">
        <EmptyHeader>
          <EmptyMedia variant="icon" className="bg-chart-3/10">
            <CheckCircle2 className="text-chart-3" />
          </EmptyMedia>
          <EmptyTitle>Print complete</EmptyTitle>
          <EmptyDescription>
            {job.fileName}
            <br />
            {pagesText} · {colorText}
          </EmptyDescription>
        </EmptyHeader>
      </Empty>

      <Button className="w-full" onClick={onPrintAnother}>
        Print Another
      </Button>
    </div>
  );
}

interface PrintErrorProps {
  errorMessage: string;
  onRetry: () => void;
  onCancel: () => void;
}

export function PrintError({
  errorMessage,
  onRetry,
  onCancel,
}: PrintErrorProps) {
  return (
    <div className="space-y-4">
      <Empty className="border-0 p-8">
        <EmptyHeader>
          <EmptyMedia variant="icon" className="bg-destructive/10">
            <AlertCircle className="text-destructive" />
          </EmptyMedia>
          <EmptyTitle>Print failed</EmptyTitle>
          <EmptyDescription>{errorMessage}</EmptyDescription>
        </EmptyHeader>
      </Empty>

      <EmptyContent className="w-full max-w-none">
        <Button className="w-full" onClick={onRetry}>
          Try Again
        </Button>
        <Button variant="outline" className="w-full" onClick={onCancel}>
          Cancel
        </Button>
      </EmptyContent>
    </div>
  );
}

function FileIcon({ type }: { type: "pdf" | "image" }) {
  const Icon = type === "pdf" ? FileText : ImageIcon;
  return <Icon className="size-6 text-muted-foreground" />;
}
