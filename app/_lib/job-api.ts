// API for fetching printer job list from /Jobs/JobList endpoint

const BASE_URL = "/api/printer";

export type JobCategory = "Print" | "Scan" | "Copy" | "Fax";
export type JobState =
  | "Pending"
  | "Processing"
  | "Completed"
  | "Canceled"
  | "Aborted";

export interface PrinterJob {
  id: string;
  url: string;
  category: JobCategory;
  state: JobState;
  stateUpdate: string;
  source: string;
}

function getChildText(parent: Element, localName: string): string | null {
  const children = parent.getElementsByTagName("*");
  for (let i = 0; i < children.length; i++) {
    if (children[i].localName === localName) {
      return children[i].textContent;
    }
  }
  return null;
}

function getAllElements(xml: Document, localName: string): Element[] {
  const elements = xml.getElementsByTagName("*");
  const matches: Element[] = [];
  for (let i = 0; i < elements.length; i++) {
    if (elements[i].localName === localName) {
      matches.push(elements[i]);
    }
  }
  return matches;
}

async function parseXmlResponse(url: string): Promise<Document> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    const text = await response.text();
    const parser = new DOMParser();
    return parser.parseFromString(text, "text/xml");
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

/**
 * Fetch all jobs from the printer's job list
 */
export async function fetchJobList(): Promise<PrinterJob[]> {
  const xml = await parseXmlResponse(`${BASE_URL}/Jobs/JobList`);

  const jobElements = getAllElements(xml, "Job");
  const jobs: PrinterJob[] = [];

  for (const job of jobElements) {
    const jobUrl = getChildText(job, "JobUrl") || "";
    // Extract job ID from URL (e.g., "/Jobs/JobList/1" -> "1")
    const id = jobUrl.split("/").pop() || "";

    const categoryText = getChildText(job, "JobCategory") || "Print";
    const category = ["Print", "Scan", "Copy", "Fax"].includes(categoryText)
      ? (categoryText as JobCategory)
      : "Print";

    const stateText = getChildText(job, "JobState") || "Pending";
    const state = [
      "Pending",
      "Processing",
      "Completed",
      "Canceled",
      "Aborted",
    ].includes(stateText)
      ? (stateText as JobState)
      : "Pending";

    jobs.push({
      id,
      url: jobUrl,
      category,
      state,
      stateUpdate: getChildText(job, "JobStateUpdate") || "",
      source: getChildText(job, "JobSource") || "",
    });
  }

  return jobs;
}

/**
 * Fetch only active jobs (Pending or Processing state)
 */
export async function fetchActiveJobs(): Promise<PrinterJob[]> {
  const jobs = await fetchJobList();
  return jobs.filter(
    (job) => job.state === "Pending" || job.state === "Processing",
  );
}

/**
 * Fetch the currently processing job if any
 */
export async function fetchCurrentJob(): Promise<PrinterJob | null> {
  const jobs = await fetchJobList();
  return jobs.find((job) => job.state === "Processing") || null;
}

/**
 * Cancel a job by its ID
 * Sends a PUT request with cancel state to the job URL
 */
export async function cancelJob(jobId: string): Promise<void> {
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
