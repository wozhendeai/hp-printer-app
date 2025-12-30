// Printer alert display utilities.
// Maps raw printer alert IDs to user-friendly messages.

import type { PrinterAlert } from "../types";

// Alert with derived title and description for display
export interface DisplayAlert {
  id: string;
  severity: "Info" | "Warning" | "Error";
  title: string;
  description: string;
  color?: string;
}

// Map of alert IDs to user-friendly messages
export const ALERT_MESSAGES: Record<
  string,
  { title: string; description: string }
> = {
  cartridgeLow: {
    title: "Ink low",
    description: "Order replacement cartridge",
  },
  cartridgeEmpty: {
    title: "Ink empty",
    description: "Replace cartridge to continue",
  },
  cartridgeMissing: {
    title: "Ink cartridge missing",
    description: "Install cartridge",
  },
  mediaEmpty: {
    title: "Paper tray empty",
    description: "Load paper to continue",
  },
  mediaJam: {
    title: "Paper jam",
    description: "Clear jam and press OK on printer",
  },
  doorOpen: {
    title: "Cover open",
    description: "Close the cover",
  },
  spoolAreaFull: {
    title: "Print queue full",
    description: "Wait for jobs to complete or cancel",
  },
  scannerError: {
    title: "Scanner error",
    description: "Check scanner glass and try again",
  },
  inkSystemFailure: {
    title: "Ink system problem",
    description: "Restart printer or contact support",
  },
  servicePending: {
    title: "Service required",
    description: "Contact HP support",
  },
};

/**
 * Convert a raw printer alert to a display-friendly format.
 * Looks up user-friendly title/description and normalizes severity.
 */
export function getAlertDisplay(alert: PrinterAlert): DisplayAlert {
  const baseMessage = ALERT_MESSAGES[alert.id] || {
    title: alert.id,
    description: "Check printer for details",
  };

  // Include color in title for ink-related alerts
  const title = alert.color
    ? baseMessage.title.replace(/^Ink/, `${alert.color}`)
    : baseMessage.title;

  // Normalize severity to DisplayAlert format (capitalize first letter)
  const displaySeverity = (alert.severity.charAt(0).toUpperCase() +
    alert.severity.slice(1)) as "Info" | "Warning" | "Error";

  return {
    id: alert.id,
    severity: displaySeverity,
    title,
    description: baseMessage.description,
    color: alert.color,
  };
}
