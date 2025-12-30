// API functions for job management.
// EWS job list for all job types, IPP for print job progress.

import type {
  Job,
  JobState,
  JobCategory,
  PrintJobProgress,
  PrintJobSubmission,
  PrintSettings,
} from "../types";
import { parseXmlResponse, getAllElements, getChildText } from "./xml-utils";

const BASE_URL = "/api/printer";

// ============================================================================
// State Normalization (EWS XML strings → canonical types)
// Note: IPP uses numeric job-state codes (RFC 8011), handled separately in
// app/api/print/jobs/[id]/route.ts. These are protocol-specific adapters.
// ============================================================================

/** Normalize PascalCase EWS state to lowercase */
function normalizeJobState(state: string): JobState {
  const lower = state.toLowerCase();
  if (
    ["pending", "processing", "completed", "canceled", "aborted"].includes(
      lower,
    )
  ) {
    return lower as JobState;
  }
  return "pending";
}

/** Normalize PascalCase EWS category to lowercase */
function normalizeJobCategory(category: string): JobCategory {
  const lower = category.toLowerCase();
  if (["print", "scan", "copy", "fax"].includes(lower)) {
    return lower as JobCategory;
  }
  return "print";
}

// ============================================================================
// EWS Job List Operations
// ============================================================================

/** Fetch all jobs from EWS /Jobs/JobList */
export async function fetchJobList(): Promise<Job[]> {
  const xml = await parseXmlResponse(`${BASE_URL}/Jobs/JobList`);

  const jobElements = getAllElements(xml, "Job");
  const jobs: Job[] = [];

  for (const job of jobElements) {
    const jobUrl = getChildText(job, "JobUrl") || "";
    const idStr = jobUrl.split("/").pop() || "0";
    const id = parseInt(idStr, 10);

    jobs.push({
      id,
      url: jobUrl,
      category: normalizeJobCategory(
        getChildText(job, "JobCategory") || "Print",
      ),
      state: normalizeJobState(getChildText(job, "JobState") || "Pending"),
      source: getChildText(job, "JobSource") || "",
    });
  }

  return jobs;
}

/** Fetch only active jobs (pending or processing) */
export async function fetchActiveJobs(): Promise<Job[]> {
  const jobs = await fetchJobList();
  return jobs.filter(
    (job) => job.state === "pending" || job.state === "processing",
  );
}

/** Fetch the currently processing job if any */
export async function fetchCurrentJob(): Promise<Job | null> {
  const jobs = await fetchJobList();
  return jobs.find((job) => job.state === "processing") || null;
}

/** Cancel a job via EWS PUT request */
export async function cancelJobEws(jobId: number): Promise<void> {
  const response = await fetch(`${BASE_URL}/Jobs/JobList/${jobId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/xml" },
    body: `<?xml version="1.0" encoding="UTF-8"?>
<j:Job xmlns:j="http://www.hp.com/schemas/imaging/con/ledm/jobs/2009/04/30">
  <j:JobState>Canceled</j:JobState>
</j:Job>`,
  });

  if (!response.ok) {
    throw new Error(`Failed to cancel job: ${response.status}`);
  }
}

// ============================================================================
// IPP Print Job Operations (via /api/print)
// ============================================================================

/** Submit a print job via IPP */
export async function submitPrintJob(
  file: File,
  settings: PrintSettings,
): Promise<PrintJobSubmission> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("copies", String(settings.copies));
  formData.append("colorMode", settings.colorMode);
  formData.append("duplex", String(settings.duplex));
  formData.append("quality", settings.quality);
  formData.append("paperSize", settings.paperSize);
  formData.append("paperType", settings.paperType);

  const response = await fetch("/api/print", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error || `Failed to submit job: ${response.statusText}`,
    );
  }

  const data = await response.json();
  return {
    jobId: data.jobId,
    jobUrl: data.jobUrl,
  };
}

/** Get print job progress via IPP */
export async function getJobProgress(jobId: number): Promise<PrintJobProgress> {
  const response = await fetch(`/api/print/jobs/${jobId}`);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error || `Failed to get job status: ${response.statusText}`,
    );
  }

  return response.json();
}

/** Cancel a print job via IPP */
export async function cancelPrintJobIpp(jobId: number): Promise<void> {
  const response = await fetch(`/api/print/jobs/${jobId}`, {
    method: "DELETE",
  });

  if (!response.ok && response.status !== 204) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error || `Failed to cancel job: ${response.statusText}`,
    );
  }
}
