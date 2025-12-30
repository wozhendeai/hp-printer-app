"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import type { PrintSettings } from "@/lib/types";
import { UploadZone } from "./_components/upload-zone";
import { FilePreview } from "./_components/file-preview";
import { PrintSettingsForm } from "./_components/print-settings";
import {
  PrintingStatus,
  PrintComplete,
  PrintError,
} from "./_components/print-status";
import { RecentJobs, type RecentJob } from "./_components/recent-jobs";
import { usePrintFlow } from "./_lib/use-print-flow";

const DEFAULT_SETTINGS: PrintSettings = {
  copies: 1,
  colorMode: "color",
  duplex: false,
  quality: "normal",
  paperSize: "letter",
  paperType: "plain",
};

const MOCK_RECENT_JOBS: RecentJob[] = [
  {
    id: "1",
    fileName: "Q4_Report.pdf",
    fileType: "pdf",
    pages: 12,
    colorMode: "color",
    status: "completed",
    timestamp: "10 min ago",
  },
  {
    id: "2",
    fileName: "photo.jpg",
    fileType: "image",
    pages: 1,
    colorMode: "color",
    status: "completed",
    timestamp: "25 min ago",
  },
];

export default function PrintPage() {
  const [settings, setSettings] = useState<PrintSettings>(DEFAULT_SETTINGS);
  const [recentJobs, setRecentJobs] = useState<RecentJob[]>(MOCK_RECENT_JOBS);

  const addToRecentJobs = useCallback(
    (
      file: File,
      pages: number,
      colorMode: "color" | "bw",
      status: "completed" | "failed",
    ) => {
      const newJob: RecentJob = {
        id: Date.now().toString(),
        fileName: file.name,
        fileType: file.type === "application/pdf" ? "pdf" : "image",
        pages,
        colorMode,
        status,
        timestamp: "Just now",
      };
      setRecentJobs((prev) => [newJob, ...prev].slice(0, 5));
    },
    [],
  );

  const { state, status, selectFile, removeFile, startPrint, cancel, reset } =
    usePrintFlow(settings, {
      onJobComplete: (file, pages, colorMode) => {
        addToRecentJobs(file, pages, colorMode, "completed");
      },
      onJobError: (file) => {
        addToRecentJobs(file, 0, settings.colorMode, "failed");
      },
    });

  const handlePrintAnother = useCallback(() => {
    reset();
    setSettings(DEFAULT_SETTINGS);
  }, [reset]);

  return (
    <div className="flex-1 overflow-auto">
      <div className="p-6 max-w-lg mx-auto space-y-6">
        {status === "empty" && <UploadZone onFileSelect={selectFile} />}

        {status === "ready" && state.file && (
          <FilePreview file={state.file} onRemove={removeFile} />
        )}

        {(status === "sending" || status === "printing") && state.file && (
          <PrintingStatus
            job={{
              fileName: state.file.name,
              fileType: state.file.type === "application/pdf" ? "pdf" : "image",
              totalPages: state.totalPages > 0 ? state.totalPages : undefined,
              currentPage:
                state.currentPage > 0 ? state.currentPage : undefined,
              colorMode: settings.colorMode,
            }}
            progress={state.progress}
            onCancel={cancel}
          />
        )}

        {status === "complete" && state.file && (
          <PrintComplete
            job={{
              fileName: state.file.name,
              fileType: state.file.type === "application/pdf" ? "pdf" : "image",
              totalPages: state.totalPages,
              colorMode: settings.colorMode,
            }}
            onPrintAnother={handlePrintAnother}
          />
        )}

        {status === "error" && state.error && (
          <PrintError
            errorMessage={state.error}
            onRetry={startPrint}
            onCancel={cancel}
          />
        )}

        {(status === "empty" || status === "ready") && (
          <PrintSettingsForm settings={settings} onChange={setSettings} />
        )}

        {status === "ready" && (
          <Button className="w-full" size="lg" onClick={startPrint}>
            Print
          </Button>
        )}

        {status === "empty" && (
          <Button className="w-full" size="lg" disabled>
            Print
          </Button>
        )}

        {(status === "empty" ||
          status === "ready" ||
          status === "complete") && <RecentJobs jobs={recentJobs} />}
      </div>
    </div>
  );
}
