// Printer hardware types for EWS status, consumables, and device info.

import type { AlertSeverity } from "./common";

// =============================================================================
// Printer Status
// =============================================================================

export type PrinterState = "ready" | "processing" | "inPowerSave" | "error";

export interface PrinterAlert {
  id: string;
  severity: AlertSeverity;
  color?: string;
}

export interface PrinterStatus {
  state: PrinterState;
  alerts: PrinterAlert[];
}

// =============================================================================
// Consumables
// =============================================================================

export type InkColor = "K" | "C" | "M" | "Y";
export type InkColorName = "Black" | "Cyan" | "Magenta" | "Yellow";
export type InkState = "ok" | "low" | "used" | "empty" | "missing";

export interface InkLevel {
  color: InkColor;
  colorName: InkColorName;
  percentRemaining: number;
  state: InkState;
  cartridgeModel: string;
  isGenuineHP: boolean;
  installDate: string | null;
}

export type PaperTrayState = "ready" | "missing" | "jam";

export interface PaperTray {
  id: string;
  mediaType: string;
  mediaSize: string;
  state: PaperTrayState;
  supportsDuplex: boolean;
}

// =============================================================================
// Device Info
// =============================================================================

export interface DeviceInfo {
  model: string;
  serialNumber: string;
  productNumber: string;
  uuid: string;
  firmware: {
    version: string;
    date: string;
  };
  manufacturer: {
    name: string;
    date: string;
  };
  capabilities: {
    duplex: boolean;
    fax: boolean;
  };
  memory: {
    totalKb: number;
    availableKb: number;
  };
  settings: {
    language: string;
    region: string;
  };
}

// =============================================================================
// Network Info
// =============================================================================

export interface NetworkAdapter {
  name: string;
  type: "ethernet" | "wifi" | "usb" | "accessPoint";
  macAddress: string;
  isConnected: boolean;
  wifi?: {
    ssid: string;
    channel: number;
    signalStrength: number;
    signalDbm: number;
    encryption: string;
  };
}

export interface NetworkInfo {
  hostname: string;
  domainName: string;
  adapters: NetworkAdapter[];
}

// =============================================================================
// Usage Stats
// =============================================================================

export interface UsageStats {
  totalImpressions: number;
  monochromeImpressions: number;
  colorImpressions: number;
  duplexSheets: number;
  jamEvents: number;
  inkUsedMl: number;
}

// =============================================================================
// Composite Type (all data for dashboard)
// =============================================================================

import type { ScannerStatus } from "./scanner";

export interface PrinterData {
  device: DeviceInfo;
  network: NetworkInfo;
  ink: InkLevel[];
  usage: UsageStats;
  paper: PaperTray;
  status: PrinterStatus;
  scanner: ScannerStatus;
}
