// Print settings for job submission.
// State machine types are in app/print/_lib/types.ts.

export interface PrintSettings {
  copies: number;
  colorMode: "color" | "bw";
  duplex: boolean;
  quality: "draft" | "normal" | "best";
  paperSize: string;
  paperType: string;
}
