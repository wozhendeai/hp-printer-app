"use client";

import { PrinterHub } from "./printer-hub";
import { usePrinterStatus } from "@/lib/queries/printer";

export function Dashboard() {
  const { data, loading, isOffline } = usePrinterStatus({
    pollInterval: 10000,
  });

  // Determine status based on connection and printer state
  const status = isOffline
    ? "offline"
    : data?.status.state === "error"
      ? "error"
      : data?.status.state === "processing"
        ? "printing"
        : "ready";

  return <PrinterHub status={status} printerData={data} isLoading={loading} />;
}
