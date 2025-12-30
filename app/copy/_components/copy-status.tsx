"use client";

import {
  Loader2,
  CheckCircle,
  AlertCircle,
  ScanLine,
  Printer,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { CopyErrorPhase } from "../_lib/types";

interface CopyStatusProps {
  isScanning: boolean;
  isPrinting: boolean;
  isComplete: boolean;
  error: Error | null;
  errorPhase: CopyErrorPhase | null;
  scanProgress: string | null;
  printProgress: { current: number; total: number } | null;
  completedCopies: number | null;
  onCancel: () => void;
  onReset: () => void;
}

export function CopyStatus({
  isScanning,
  isPrinting,
  isComplete,
  error,
  errorPhase,
  scanProgress,
  printProgress,
  completedCopies,
  onCancel,
  onReset,
}: CopyStatusProps) {
  if (isScanning) {
    return (
      <ScanningStatus
        progress={scanProgress ?? "Starting..."}
        onCancel={onCancel}
      />
    );
  }

  if (isPrinting && printProgress) {
    return (
      <PrintingStatus
        currentCopy={printProgress.current}
        totalCopies={printProgress.total}
        onCancel={onCancel}
      />
    );
  }

  if (isComplete && completedCopies !== null) {
    return <CompleteStatus copies={completedCopies} onReset={onReset} />;
  }

  if (error && errorPhase) {
    return (
      <ErrorStatus
        message={error.message}
        phase={errorPhase}
        onRetry={onReset}
      />
    );
  }

  return null;
}

function ScanningStatus({
  progress,
  onCancel,
}: {
  progress: string;
  onCancel: () => void;
}) {
  return (
    <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
      <div className="flex flex-col items-center gap-3">
        <div className="relative size-16">
          <ScanLine className="size-16 text-muted-foreground animate-pulse" />
          <Loader2 className="absolute inset-0 m-auto size-8 animate-spin text-foreground" />
        </div>
        <span className="text-lg font-semibold">Scanning...</span>
        <span className="text-sm text-muted-foreground capitalize">
          {progress}
        </span>
      </div>

      <Progress value={null} />

      <Button variant="outline" className="w-full" onClick={onCancel}>
        Cancel
      </Button>
    </div>
  );
}

function PrintingStatus({
  currentCopy,
  totalCopies,
  onCancel,
}: {
  currentCopy: number;
  totalCopies: number;
  onCancel: () => void;
}) {
  const percentage = Math.round((currentCopy / totalCopies) * 100);

  return (
    <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
      <div className="flex flex-col items-center gap-3">
        <div className="relative size-16">
          <Printer className="size-16 text-muted-foreground" />
          <Loader2 className="absolute inset-0 m-auto size-8 animate-spin text-foreground" />
        </div>
        <span className="text-lg font-semibold">Printing...</span>
        <span className="text-sm text-muted-foreground">
          {totalCopies === 1
            ? "Printing your copy"
            : `Copy ${currentCopy} of ${totalCopies}`}
        </span>
      </div>

      <Progress value={percentage} />

      <Button variant="outline" className="w-full" onClick={onCancel}>
        Cancel
      </Button>
    </div>
  );
}

function CompleteStatus({
  copies,
  onReset,
}: {
  copies: number;
  onReset: () => void;
}) {
  return (
    <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
      <div className="flex flex-col items-center gap-3">
        <CheckCircle className="size-16 text-status-ready" />
        <span className="text-lg font-semibold">Copy Complete</span>
        <span className="text-sm text-muted-foreground">
          {copies === 1 ? "1 copy" : `${copies} copies`} printed successfully
        </span>
      </div>

      <Button className="w-full" onClick={onReset}>
        Copy Another
      </Button>
    </div>
  );
}

function ErrorStatus({
  message,
  phase,
  onRetry,
}: {
  message: string;
  phase: "scan" | "print";
  onRetry: () => void;
}) {
  return (
    <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
      <div className="flex flex-col items-center gap-3">
        <AlertCircle className="size-16 text-status-error" />
        <span className="text-lg font-semibold">
          {phase === "scan" ? "Scan Failed" : "Print Failed"}
        </span>
        <span className="text-sm text-muted-foreground text-center">
          {message}
        </span>
      </div>

      <Button className="w-full" onClick={onRetry}>
        Try Again
      </Button>
    </div>
  );
}
