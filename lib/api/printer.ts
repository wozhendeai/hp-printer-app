// EWS (Embedded Web Server) API functions.
// Fetches printer status, ink, paper, scanner, device info via XML endpoints.
// All responses normalized to canonical types from lib/types/.

import type {
  PrinterStatus,
  PrinterAlert,
  AlertSeverity,
  InkLevel,
  PaperTray,
  ScannerStatus,
  ScannerState,
  AdfState,
  DeviceInfo,
  NetworkInfo,
  NetworkAdapter,
  UsageStats,
  PrinterData,
  ScanSettings,
} from "../types";
import {
  parseXmlResponse,
  getTextContent,
  getAllElements,
  getChildText,
} from "./xml-utils";

const BASE_URL = "/api/printer";

// ============================================================================
// Printer Status
// ============================================================================

/** Normalize EWS severity to lowercase */
function normalizeSeverity(severity: string): AlertSeverity {
  const lower = severity.toLowerCase();
  if (lower === "info" || lower === "warning" || lower === "error") {
    return lower;
  }
  return "info";
}

export async function fetchPrinterStatus(): Promise<PrinterStatus> {
  const xml = await parseXmlResponse(
    `${BASE_URL}/DevMgmt/ProductStatusDyn.xml`,
  );

  const statusCategory = getTextContent(xml, "StatusCategory") || "ready";
  let state: PrinterStatus["state"] = "ready";

  if (statusCategory === "processing") state = "processing";
  else if (statusCategory === "inPowerSave") state = "inPowerSave";
  else if (statusCategory.includes("error")) state = "error";

  const alerts: PrinterAlert[] = [];
  const alertElements = getAllElements(xml, "Alert");

  for (const alert of alertElements) {
    alerts.push({
      id: getChildText(alert, "ProductStatusAlertID") || "unknown",
      severity: normalizeSeverity(getChildText(alert, "Severity") || "Info"),
      color: getChildText(alert, "AlertDetailsMarkerColor") || undefined,
    });
  }

  return { state, alerts };
}

// ============================================================================
// Ink Levels
// ============================================================================

export async function fetchInkLevels(): Promise<InkLevel[]> {
  const xml = await parseXmlResponse(
    `${BASE_URL}/DevMgmt/ConsumableConfigDyn.xml`,
  );

  const colorMap: Record<
    string,
    { color: InkLevel["color"]; name: InkLevel["colorName"] }
  > = {
    K: { color: "K", name: "Black" },
    C: { color: "C", name: "Cyan" },
    M: { color: "M", name: "Magenta" },
    Y: { color: "Y", name: "Yellow" },
  };

  const consumables = getAllElements(xml, "ConsumableInfo");
  const inkLevels: InkLevel[] = [];

  for (const consumable of consumables) {
    const labelCode = getChildText(consumable, "ConsumableLabelCode");
    const typeEnum = getChildText(consumable, "ConsumableTypeEnum");

    if (typeEnum !== "ink" || !labelCode || !colorMap[labelCode]) continue;

    const colorInfo = colorMap[labelCode];
    const stateText = getChildText(consumable, "ConsumableState") || "ok";
    const state = ["ok", "low", "used", "empty", "missing"].includes(stateText)
      ? (stateText as InkLevel["state"])
      : "ok";

    inkLevels.push({
      color: colorInfo.color,
      colorName: colorInfo.name,
      percentRemaining: parseInt(
        getChildText(consumable, "ConsumablePercentageLevelRemaining") || "0",
        10,
      ),
      state,
      cartridgeModel:
        getChildText(consumable, "ConsumableSelectibilityNumber") || "Unknown",
      isGenuineHP: getChildText(consumable, "Brand") === "HP",
      installDate: getChildText(
        getAllElements(consumable as unknown as Document, "Installation")[0] ||
          consumable,
        "Date",
      ),
    });
  }

  const order = ["K", "C", "M", "Y"];
  return inkLevels.sort(
    (a, b) => order.indexOf(a.color) - order.indexOf(b.color),
  );
}

// ============================================================================
// Paper Tray
// ============================================================================

export async function fetchPaperTray(): Promise<PaperTray> {
  const xml = await parseXmlResponse(
    `${BASE_URL}/DevMgmt/MediaHandlingDyn.xml`,
  );

  const mediaState = getTextContent(xml, "MediaState") || "ready";
  const state = ["ready", "missing", "jam"].includes(mediaState)
    ? (mediaState as PaperTray["state"])
    : "ready";

  return {
    id: getTextContent(xml, "InputBin") || "Tray1",
    mediaType: getTextContent(xml, "MediaType") || "plain",
    mediaSize: getTextContent(xml, "MediaSizeName") || "na_letter_8.5x11in",
    state,
    supportsDuplex: getTextContent(xml, "Plex") === "Duplex",
  };
}

// ============================================================================
// Scanner Status
// ============================================================================

/** Normalize eSCL scanner state to lowercase */
function normalizeScannerState(state: string): ScannerState {
  const lower = state.toLowerCase();
  if (lower === "idle" || lower === "processing" || lower === "stopped") {
    return lower;
  }
  return "idle";
}

/** Normalize eSCL ADF state to simple lowercase */
function normalizeAdfState(adfState: string): AdfState {
  if (adfState.includes("Loaded")) return "loaded";
  if (adfState.includes("Jam")) return "jam";
  return "empty";
}

export async function fetchScannerStatus(): Promise<ScannerStatus> {
  const xml = await parseXmlResponse(`${BASE_URL}/eSCL/ScannerStatus`);

  return {
    state: normalizeScannerState(getTextContent(xml, "State") || "Idle"),
    adfState: normalizeAdfState(
      getTextContent(xml, "AdfState") || "ScannerAdfEmpty",
    ),
  };
}

// ============================================================================
// Device Info
// ============================================================================

export async function fetchDeviceInfo(): Promise<DeviceInfo> {
  const xml = await parseXmlResponse(
    `${BASE_URL}/DevMgmt/ProductConfigDyn.xml`,
  );

  return {
    model: getTextContent(xml, "MakeAndModel") || "Unknown",
    serialNumber: getTextContent(xml, "SerialNumber") || "Unknown",
    productNumber: getTextContent(xml, "ProductNumber") || "Unknown",
    uuid: getTextContent(xml, "UUID") || "Unknown",
    firmware: {
      version: getTextContent(xml, "Revision") || "Unknown",
      date: getTextContent(xml, "Date") || "Unknown",
    },
    manufacturer: {
      name: "HP",
      date: getAllElements(xml, "Manufacturer")[0]
        ? getChildText(getAllElements(xml, "Manufacturer")[0], "Date") ||
          "Unknown"
        : "Unknown",
    },
    capabilities: {
      duplex: getTextContent(xml, "DuplexUnit") === "Installed",
      fax: getTextContent(xml, "Fax") === "Yes",
    },
    memory: {
      totalKb: parseInt(getTextContent(xml, "TotalMemory") || "0", 10),
      availableKb: parseInt(getTextContent(xml, "AvailableMemory") || "0", 10),
    },
    settings: {
      language: getTextContent(xml, "DeviceLanguage") || "en",
      region: getTextContent(xml, "CountryAndRegionName") || "Unknown",
    },
  };
}

// ============================================================================
// Network Info
// ============================================================================

export async function fetchNetworkInfo(): Promise<NetworkInfo> {
  const [adaptersXml, configXml, netAppsXml] = await Promise.all([
    parseXmlResponse(`${BASE_URL}/IoMgmt/Adapters`),
    parseXmlResponse(`${BASE_URL}/IoMgmt/IoConfig.xml`),
    parseXmlResponse(`${BASE_URL}/DevMgmt/NetAppsDyn.xml`),
  ]);

  const adapters: NetworkAdapter[] = [];
  const adapterElements = getAllElements(adaptersXml, "Adapter");

  for (const adapter of adapterElements) {
    const name = getChildText(adapter, "Name");
    const portType = getChildText(adapter, "DeviceConnectivityPortType");
    const macAddress = getChildText(adapter, "MacAddress") || "";
    const isConnected = getChildText(adapter, "IsConnected") === "true";

    let type: NetworkAdapter["type"] = "ethernet";
    if (portType === "wifiEmbedded") {
      const resourceType = adapter.querySelector(
        '[localName="IoMgmtResourceType"]',
      );
      type =
        resourceType?.textContent === "AccessPointAdapter"
          ? "accessPoint"
          : "wifi";
    } else if (portType === "usb") {
      type = "usb";
    }

    const adapterData: NetworkAdapter = {
      name: name || "Unknown",
      type,
      macAddress:
        macAddress
          .match(/.{1,2}/g)
          ?.join(":")
          .toUpperCase() || macAddress,
      isConnected,
    };

    if (type === "wifi" && isConnected) {
      const ssidHex = getChildText(adapter, "SSID") || "";
      const ssid = ssidHex
        ? decodeURIComponent(ssidHex.replace(/(.{2})/g, "%$1"))
        : "Unknown";

      adapterData.wifi = {
        ssid,
        channel: parseInt(getChildText(adapter, "Channel") || "0", 10),
        signalStrength: parseInt(
          getChildText(adapter, "SignalStrength") || "0",
          10,
        ),
        signalDbm: parseInt(getChildText(adapter, "dBm") || "0", 10),
        encryption: getChildText(adapter, "EncryptionType") || "Unknown",
      };
    }

    adapters.push(adapterData);
  }

  return {
    hostname: getTextContent(configXml, "Hostname") || "Unknown",
    domainName:
      getTextContent(netAppsXml, "DomainName")?.replace(/\.$/, "") || "Unknown",
    adapters,
  };
}

// ============================================================================
// Usage Stats
// ============================================================================

export async function fetchUsageStats(): Promise<UsageStats> {
  const xml = await parseXmlResponse(`${BASE_URL}/DevMgmt/ProductUsageDyn.xml`);

  return {
    totalImpressions: parseInt(
      getTextContent(xml, "TotalImpressions") || "0",
      10,
    ),
    monochromeImpressions: parseInt(
      getTextContent(xml, "MonochromeImpressions") || "0",
      10,
    ),
    colorImpressions: parseInt(
      getTextContent(xml, "ColorImpressions") || "0",
      10,
    ),
    duplexSheets: parseInt(getTextContent(xml, "DuplexSheets") || "0", 10),
    jamEvents: parseInt(getTextContent(xml, "JamEvents") || "0", 10),
    inkUsedMl: parseFloat(getTextContent(xml, "ValueFloat") || "0"),
  };
}

// ============================================================================
// All Data (Dashboard)
// ============================================================================

export async function fetchAllPrinterData(): Promise<PrinterData> {
  const [device, network, ink, usage, paper, status, scanner] =
    await Promise.all([
      fetchDeviceInfo(),
      fetchNetworkInfo(),
      fetchInkLevels(),
      fetchUsageStats(),
      fetchPaperTray(),
      fetchPrinterStatus(),
      fetchScannerStatus(),
    ]);

  return { device, network, ink, usage, paper, status, scanner };
}

// ============================================================================
// Scan Operations
// ============================================================================

function buildScanSettingsXml(settings: ScanSettings): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<scan:ScanSettings xmlns:scan="http://schemas.hp.com/imaging/escl/2011/05/03"
                   xmlns:pwg="http://www.pwg.org/schemas/2010/12/sm">
  <pwg:Version>2.63</pwg:Version>
  <scan:Intent>${settings.intent}</scan:Intent>
  <pwg:ScanRegions>
    <pwg:ScanRegion>
      <pwg:XOffset>0</pwg:XOffset>
      <pwg:YOffset>0</pwg:YOffset>
      <pwg:Width>${settings.width}</pwg:Width>
      <pwg:Height>${settings.height}</pwg:Height>
      <pwg:ContentRegionUnits>escl:ThreeHundredthsOfInches</pwg:ContentRegionUnits>
    </pwg:ScanRegion>
  </pwg:ScanRegions>
  <pwg:InputSource>${settings.source}</pwg:InputSource>
  <scan:ColorMode>${settings.colorMode}</scan:ColorMode>
  <scan:XResolution>${settings.resolution}</scan:XResolution>
  <scan:YResolution>${settings.resolution}</scan:YResolution>
  <pwg:DocumentFormat>${settings.format}</pwg:DocumentFormat>
</scan:ScanSettings>`;
}

export async function createScanJob(settings: ScanSettings): Promise<string> {
  const response = await fetch(`${BASE_URL}/eSCL/ScanJobs`, {
    method: "POST",
    headers: { "Content-Type": "application/xml" },
    body: buildScanSettingsXml(settings),
  });

  if (!response.ok) {
    throw new Error(`Failed to create scan job: ${response.status}`);
  }

  const location = response.headers.get("Location");
  if (!location) {
    throw new Error("No Location header in scan job response");
  }

  return location;
}

export async function waitForScanComplete(
  _jobUrl: string,
  onProgress?: (state: string) => void,
  maxWaitMs = 60000,
): Promise<void> {
  const startTime = Date.now();
  const pollInterval = 500;

  while (Date.now() - startTime < maxWaitMs) {
    const status = await fetchScannerStatus();
    onProgress?.(status.state);

    if (status.state === "idle") return;
    if (status.state === "stopped")
      throw new Error("Scanner stopped unexpectedly");

    await new Promise((resolve) => setTimeout(resolve, pollInterval));
  }

  throw new Error("Scan timed out");
}

export async function fetchScannedDocument(jobUrl: string): Promise<Blob> {
  const response = await fetch(`${jobUrl}/NextDocument`);

  if (!response.ok) {
    throw new Error(`Failed to fetch scanned document: ${response.status}`);
  }

  return response.blob();
}

export async function cancelScanJob(jobUrl: string): Promise<void> {
  const response = await fetch(jobUrl, { method: "DELETE" });

  if (!response.ok && response.status !== 404) {
    throw new Error(`Failed to cancel scan job: ${response.status}`);
  }
}

export async function performScan(
  settings: ScanSettings,
  onProgress?: (state: string) => void,
): Promise<Blob> {
  const jobUrl = await createScanJob(settings);
  onProgress?.("processing");

  try {
    await waitForScanComplete(jobUrl, onProgress);
    return await fetchScannedDocument(jobUrl);
  } catch (error) {
    await cancelScanJob(jobUrl).catch(() => {});
    throw error;
  }
}

// ============================================================================
// Format Helpers
// ============================================================================

export function formatMediaSize(size: string): string {
  const sizeMap: Record<string, string> = {
    "na_letter_8.5x11in": "Letter",
    "na_legal_8.5x14in": "Legal",
    iso_a4_210x297mm: "A4",
    "na_index-4x6_4x6in": "4x6 Photo",
    na_5x7_5x7in: "5x7 Photo",
  };
  return sizeMap[size] || size;
}

export function formatMemory(kb: number): string {
  if (kb >= 1024 * 1024) return `${(kb / 1024 / 1024).toFixed(1)} GB`;
  if (kb >= 1024) return `${Math.round(kb / 1024)} MB`;
  return `${kb} KB`;
}
