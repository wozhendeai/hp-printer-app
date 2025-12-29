// Proxy through Next.js API route to avoid CORS
const BASE_URL = "/api/printer";

// XML parsing utilities
function getTextContent(xml: Document, selector: string): string | null {
  // Handle namespaced elements by checking local name
  const parts = selector.split(":");
  const localName = parts.length > 1 ? parts[1] : parts[0];

  const elements = xml.getElementsByTagName("*");
  for (let i = 0; i < elements.length; i++) {
    if (elements[i].localName === localName) {
      return elements[i].textContent;
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

function getChildText(parent: Element, localName: string): string | null {
  const children = parent.getElementsByTagName("*");
  for (let i = 0; i < children.length; i++) {
    if (children[i].localName === localName) {
      return children[i].textContent;
    }
  }
  return null;
}

// Types
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

export interface InkLevel {
  color: "K" | "C" | "M" | "Y";
  colorName: "Black" | "Cyan" | "Magenta" | "Yellow";
  percentRemaining: number;
  state: "ok" | "low" | "used" | "empty" | "missing";
  cartridgeModel: string;
  isGenuineHP: boolean;
  installDate: string | null;
}

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

export interface UsageStats {
  totalImpressions: number;
  monochromeImpressions: number;
  colorImpressions: number;
  duplexSheets: number;
  jamEvents: number;
  inkUsedMl: number;
}

export interface PaperTray {
  id: string;
  mediaType: string;
  mediaSize: string;
  state: "ready" | "missing" | "jam";
  supportsDuplex: boolean;
}

export interface PrinterStatus {
  state: "ready" | "processing" | "inPowerSave" | "error";
  alerts: Array<{
    id: string;
    severity: "Info" | "Warning" | "Error";
    color?: string;
  }>;
}

export interface ScannerStatus {
  state: "Idle" | "Processing" | "Stopped";
  adfState: "ScannerAdfEmpty" | "ScannerAdfLoaded" | "ScannerAdfJam";
}

export type ScanColorMode = "BlackAndWhite1" | "Grayscale8" | "RGB24";
export type ScanResolution = 75 | 100 | 150 | 200 | 300 | 400 | 600 | 1200;
export type ScanSource = "Platen" | "Adf";
export type ScanFormat = "image/jpeg" | "application/pdf";
export type ScanIntent = "Document" | "Photo" | "Preview" | "TextAndGraphic";

export interface ScanSettings {
  intent: ScanIntent;
  source: ScanSource;
  colorMode: ScanColorMode;
  resolution: ScanResolution;
  format: ScanFormat;
  // Dimensions in 1/300ths of an inch (escl:ThreeHundredthsOfInches)
  width: number;
  height: number;
}

export interface PrinterData {
  device: DeviceInfo;
  network: NetworkInfo;
  ink: InkLevel[];
  usage: UsageStats;
  paper: PaperTray;
  status: PrinterStatus;
  scanner: ScannerStatus;
}

// Fetch with timeout
async function fetchWithTimeout(
  url: string,
  timeout = 5000,
): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
}

// Parse XML response
async function parseXmlResponse(url: string): Promise<Document> {
  const response = await fetchWithTimeout(url);
  const text = await response.text();
  const parser = new DOMParser();
  return parser.parseFromString(text, "text/xml");
}

// Fetch device info from ProductConfigDyn.xml
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

// Fetch network info from IoMgmt/Adapters
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
      // Check if it's an access point
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

    // Add WiFi info if available
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

// Fetch ink levels from ConsumableConfigDyn.xml
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

    // Skip non-ink items (like printhead)
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

  // Sort by station order: K, C, M, Y
  const order = ["K", "C", "M", "Y"];
  return inkLevels.sort(
    (a, b) => order.indexOf(a.color) - order.indexOf(b.color),
  );
}

// Fetch usage stats from ProductUsageDyn.xml
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

// Fetch paper tray from MediaHandlingDyn.xml
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

// Fetch printer status from ProductStatusDyn.xml
export async function fetchPrinterStatus(): Promise<PrinterStatus> {
  const xml = await parseXmlResponse(
    `${BASE_URL}/DevMgmt/ProductStatusDyn.xml`,
  );

  const statusCategory = getTextContent(xml, "StatusCategory") || "ready";
  let state: PrinterStatus["state"] = "ready";

  if (statusCategory === "processing") state = "processing";
  else if (statusCategory === "inPowerSave") state = "inPowerSave";
  else if (statusCategory.includes("error")) state = "error";

  const alerts: PrinterStatus["alerts"] = [];
  const alertElements = getAllElements(xml, "Alert");

  for (const alert of alertElements) {
    alerts.push({
      id: getChildText(alert, "ProductStatusAlertID") || "unknown",
      severity: (getChildText(alert, "Severity") || "Info") as
        | "Info"
        | "Warning"
        | "Error",
      color: getChildText(alert, "AlertDetailsMarkerColor") || undefined,
    });
  }

  return { state, alerts };
}

// Fetch scanner status from eSCL/ScannerStatus
export async function fetchScannerStatus(): Promise<ScannerStatus> {
  const xml = await parseXmlResponse(`${BASE_URL}/eSCL/ScannerStatus`);

  return {
    state: (getTextContent(xml, "State") || "Idle") as ScannerStatus["state"],
    adfState: (getTextContent(xml, "AdfState") ||
      "ScannerAdfEmpty") as ScannerStatus["adfState"],
  };
}

// Fetch all printer data
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

// Format helpers
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
  if (kb >= 1024 * 1024) {
    return `${(kb / 1024 / 1024).toFixed(1)} GB`;
  }
  if (kb >= 1024) {
    return `${Math.round(kb / 1024)} MB`;
  }
  return `${kb} KB`;
}

// Scan size presets in 1/300ths of an inch
export const SCAN_SIZES = {
  letter: { width: 2550, height: 3300 }, // 8.5" x 11"
  legal: { width: 2550, height: 4200 }, // 8.5" x 14"
  a4: { width: 2480, height: 3508 }, // 210mm x 297mm
  photo4x6: { width: 1200, height: 1800 }, // 4" x 6"
  photo5x7: { width: 1500, height: 2100 }, // 5" x 7"
} as const;

// Build eSCL ScanSettings XML
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

export interface ScanJob {
  jobUrl: string;
  state: "Pending" | "Processing" | "Completed" | "Canceled" | "Aborted";
}

// Create a scan job and return the job URL
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

// Poll scan job status until complete or error
export async function waitForScanComplete(
  jobUrl: string,
  onProgress?: (state: string) => void,
  maxWaitMs = 60000,
): Promise<void> {
  const startTime = Date.now();
  const pollInterval = 500;

  while (Date.now() - startTime < maxWaitMs) {
    const status = await fetchScannerStatus();
    onProgress?.(status.state);

    if (status.state === "Idle") {
      // Scanner returned to idle, scan is complete
      return;
    }

    if (status.state === "Stopped") {
      throw new Error("Scanner stopped unexpectedly");
    }

    await new Promise((resolve) => setTimeout(resolve, pollInterval));
  }

  throw new Error("Scan timed out");
}

// Retrieve the scanned document
export async function fetchScannedDocument(jobUrl: string): Promise<Blob> {
  const response = await fetch(`${jobUrl}/NextDocument`);

  if (!response.ok) {
    throw new Error(`Failed to fetch scanned document: ${response.status}`);
  }

  return response.blob();
}

// Cancel a scan job
export async function cancelScanJob(jobUrl: string): Promise<void> {
  const response = await fetch(jobUrl, { method: "DELETE" });

  if (!response.ok && response.status !== 404) {
    throw new Error(`Failed to cancel scan job: ${response.status}`);
  }
}

// Complete scan workflow: create job, wait, retrieve document
export async function performScan(
  settings: ScanSettings,
  onProgress?: (state: string) => void,
): Promise<Blob> {
  const jobUrl = await createScanJob(settings);
  onProgress?.("Processing");

  try {
    await waitForScanComplete(jobUrl, onProgress);
    return await fetchScannedDocument(jobUrl);
  } catch (error) {
    // Attempt cleanup on failure
    await cancelScanJob(jobUrl).catch(() => {});
    throw error;
  }
}
