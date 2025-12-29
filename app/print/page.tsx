"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { UploadZone } from "./_components/upload-zone";
import { FilePreview } from "./_components/file-preview";
import {
  PrintSettingsForm,
  type PrintSettings,
} from "./_components/print-settings";
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

  const { state, selectFile, removeFile, startPrint, cancel, reset } =
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
        {state.type === "empty" && <UploadZone onFileSelect={selectFile} />}

        {state.type === "ready" && (
          <FilePreview file={state.file} onRemove={removeFile} />
        )}

        {(state.type === "sending" || state.type === "printing") && (
          <PrintingStatus
            job={{
              fileName: state.file.name,
              fileType: state.file.type === "application/pdf" ? "pdf" : "image",
              totalPages:
                state.type === "printing" ? state.totalPages : undefined,
              currentPage:
                state.type === "printing" ? state.currentPage : undefined,
              colorMode: settings.colorMode,
            }}
            progress={state.type === "printing" ? state.progress : 0}
            onCancel={cancel}
          />
        )}

        {state.type === "complete" && (
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

        {state.type === "error" && (
          <PrintError
            errorMessage={state.errorMessage}
            onRetry={startPrint}
            onCancel={cancel}
          />
        )}

        {(state.type === "empty" || state.type === "ready") && (
          <PrintSettingsForm settings={settings} onChange={setSettings} />
        )}

        {state.type === "ready" && (
          <Button className="w-full" size="lg" onClick={startPrint}>
            Print
          </Button>
        )}

        {state.type === "empty" && (
          <Button className="w-full" size="lg" disabled>
            Print
          </Button>
        )}

        {(state.type === "empty" ||
          state.type === "ready" ||
          state.type === "complete") && <RecentJobs jobs={recentJobs} />}
      </div>
    </div>
  );
}
