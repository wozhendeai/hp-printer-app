import type { PrintSettings } from "../_components/print-settings";

export interface SubmitJobResponse {
  jobId: number;
  jobUrl: string;
}

export interface JobStatus {
  state: "pending" | "processing" | "completed" | "canceled" | "aborted";
  currentPage?: number;
  totalPages?: number;
  errorMessage?: string;
}

export async function submitPrintJob(
  file: File,
  settings: PrintSettings,
): Promise<SubmitJobResponse> {
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

  return response.json();
}

export async function getJobStatus(jobId: number): Promise<JobStatus> {
  const response = await fetch(`/api/print/jobs/${jobId}`);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error || `Failed to get job status: ${response.statusText}`,
    );
  }

  return response.json();
}

export async function cancelJob(jobId: number): Promise<void> {
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
