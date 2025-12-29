import { NextRequest, NextResponse } from "next/server";
import { Printer, type FullRequest, type FullResponse } from "ipp";

const PRINTER_IP = "192.168.1.62";
const PRINTER_URI = `ipp://${PRINTER_IP}:631/ipp/print`;

export type JobState =
  | "pending"
  | "processing"
  | "completed"
  | "canceled"
  | "aborted";

interface JobStatusResponse {
  state: JobState;
  currentPage?: number;
  totalPages?: number;
  errorMessage?: string;
}

// Map IPP job states to our simplified states
function mapJobState(ippState: number): JobState {
  // IPP job-state values (RFC 8011)
  // 3 = pending, 4 = pending-held, 5 = processing
  // 6 = processing-stopped, 7 = canceled, 8 = aborted, 9 = completed
  switch (ippState) {
    case 3:
    case 4:
      return "pending";
    case 5:
    case 6:
      return "processing";
    case 7:
      return "canceled";
    case 8:
      return "aborted";
    case 9:
      return "completed";
    default:
      return "pending";
  }
}

interface IppJobAttributes {
  "job-state"?: number;
  "job-state-reasons"?: string | string[];
  "job-state-message"?: string;
  "job-impressions-completed"?: number;
  "job-media-sheets-completed"?: number;
  "job-impressions"?: number;
  "job-media-sheets"?: number;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const jobId = parseInt(id, 10);

  if (isNaN(jobId)) {
    return NextResponse.json({ error: "Invalid job ID" }, { status: 400 });
  }

  try {
    const printer = new Printer(PRINTER_URI);

    // Type assertion needed because @types/ipp has overly strict typing
    const getJobRequest = {
      "operation-attributes-tag": {
        "job-id": jobId,
        "requested-attributes": [
          "job-state",
          "job-state-reasons",
          "job-state-message",
          "job-impressions-completed",
          "job-media-sheets-completed",
          "job-impressions",
          "job-media-sheets",
        ],
      },
    } as unknown as FullRequest;

    const result = await new Promise<JobStatusResponse>((resolve, reject) => {
      printer.execute(
        "Get-Job-Attributes",
        getJobRequest,
        (error: Error | null, response: FullResponse) => {
          if (error) {
            reject(error);
            return;
          }

          const jobAttrs = response["job-attributes-tag"] as
            | IppJobAttributes
            | undefined;
          if (!jobAttrs) {
            reject(new Error("Job not found"));
            return;
          }

          const state = mapJobState(jobAttrs["job-state"] ?? 3);
          const stateReasons = jobAttrs["job-state-reasons"];

          // Extract page progress if available
          const completedPages =
            jobAttrs["job-impressions-completed"] ||
            jobAttrs["job-media-sheets-completed"] ||
            undefined;
          const totalPages =
            jobAttrs["job-impressions"] ||
            jobAttrs["job-media-sheets"] ||
            undefined;

          // Build error message from state reasons if job failed
          let errorMessage: string | undefined;
          if (state === "aborted" || state === "canceled") {
            const reasons = Array.isArray(stateReasons)
              ? stateReasons
              : stateReasons
                ? [stateReasons]
                : [];
            errorMessage =
              jobAttrs["job-state-message"] ||
              reasons.join(", ") ||
              "Print job failed";
          }

          resolve({
            state,
            currentPage: completedPages,
            totalPages,
            errorMessage,
          });
        },
      );
    });

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`Failed to get job ${jobId} status:`, message);
    return NextResponse.json(
      { error: `Failed to get job status: ${message}` },
      { status: 502 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const jobId = parseInt(id, 10);

  if (isNaN(jobId)) {
    return NextResponse.json({ error: "Invalid job ID" }, { status: 400 });
  }

  try {
    const printer = new Printer(PRINTER_URI);

    // Type assertion needed because @types/ipp has overly strict typing
    const cancelRequest = {
      "operation-attributes-tag": {
        "job-id": jobId,
      },
    } as unknown as FullRequest;

    await new Promise<void>((resolve, reject) => {
      printer.execute("Cancel-Job", cancelRequest, (error: Error | null) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`Failed to cancel job ${jobId}:`, message);
    return NextResponse.json(
      { error: `Failed to cancel job: ${message}` },
      { status: 502 },
    );
  }
}
