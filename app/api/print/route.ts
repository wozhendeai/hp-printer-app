import { NextRequest, NextResponse } from "next/server";
import { Printer, type FullRequest, type FullResponse } from "ipp";

const PRINTER_IP = "192.168.1.62";
const PRINTER_URI = `ipp://${PRINTER_IP}:631/ipp/print`;

// Map app settings to IPP attributes
const MEDIA_MAP: Record<string, string> = {
  letter: "na_letter_8.5x11in",
  legal: "na_legal_8.5x14in",
  a4: "iso_a4_210x297mm",
  "4x6": "na_index-4x6_4x6in",
  "5x7": "na_5x7_5x7in",
};

// Note: media-type attribute is not supported by this printer via IPP.
// Paper type must be set through the printer's control panel or EWS interface.

const QUALITY_MAP: Record<string, number> = {
  draft: 3,
  normal: 4,
  best: 5,
};

interface PrintSettings {
  copies: number;
  colorMode: "color" | "bw";
  duplex: boolean;
  quality: "draft" | "normal" | "best";
  paperSize: string;
  paperType: string;
}

function parseSettings(formData: FormData): PrintSettings {
  return {
    copies: Number(formData.get("copies")) || 1,
    colorMode: (formData.get("colorMode") as "color" | "bw") || "color",
    duplex: formData.get("duplex") === "true",
    quality:
      (formData.get("quality") as "draft" | "normal" | "best") || "normal",
    paperSize: (formData.get("paperSize") as string) || "letter",
    paperType: (formData.get("paperType") as string) || "plain",
  };
}

interface JobAttributesTag {
  "job-id": number;
  "job-uri": string;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const settings = parseSettings(formData);
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    const printer = new Printer(PRINTER_URI);

    // Type assertion needed because @types/ipp has overly strict typing
    // that doesn't match the actual runtime behavior of the ipp library
    // Note: media-type is not supported by this printer via IPP, paper type
    // selection must be done through the printer's EWS interface instead
    const printRequest = {
      "operation-attributes-tag": {
        "requesting-user-name": "hp-printer-app",
        "document-format": "application/octet-stream",
        "document-name": file.name,
        "job-name": file.name,
      },
      "job-attributes-tag": {
        copies: settings.copies,
        "print-color-mode":
          settings.colorMode === "bw" ? "monochrome" : "color",
        sides: settings.duplex ? "two-sided-long-edge" : "one-sided",
        "print-quality": QUALITY_MAP[settings.quality],
        media: MEDIA_MAP[settings.paperSize] || "na_letter_8.5x11in",
      },
      data: fileBuffer,
    } as unknown as FullRequest;

    const result = await new Promise<{ jobId: number; jobUri: string }>(
      (resolve, reject) => {
        printer.execute(
          "Print-Job",
          printRequest,
          (error: Error | null, response: FullResponse) => {
            if (error) {
              reject(error);
              return;
            }

            // Check for IPP error status codes
            const statusCode = response.statusCode as string;
            if (statusCode && !statusCode.startsWith("successful")) {
              const errorMessages: Record<string, string> = {
                "server-error-busy": "Printer is busy, please try again",
                "server-error-not-accepting-jobs":
                  "Printer is not accepting jobs",
                "client-error-document-format-not-supported":
                  "Document format not supported",
                "client-error-attributes-or-values-not-supported":
                  "Print settings not supported",
              };
              reject(
                new Error(
                  errorMessages[statusCode] || `Printer error: ${statusCode}`,
                ),
              );
              return;
            }

            const jobAttrs = response["job-attributes-tag"] as
              | JobAttributesTag
              | undefined;
            if (!jobAttrs) {
              reject(new Error("No job attributes in response"));
              return;
            }

            resolve({
              jobId: jobAttrs["job-id"],
              jobUri: jobAttrs["job-uri"],
            });
          },
        );
      },
    );

    return NextResponse.json({
      jobId: result.jobId,
      jobUrl: `/Jobs/JobList/${result.jobId}`,
    });
  } catch (error) {
    console.error("Print job submission failed:", error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: `Failed to submit print job: ${message}` },
      { status: 502 },
    );
  }
}
