"use client";

import { ReactNode, useEffect, useState, useCallback } from "react";
import {
  Printer,
  Wifi,
  WifiOff,
  FileText,
  Cpu,
  HardDrive,
  Calendar,
  Hash,
  RefreshCw,
  AlertTriangle,
  Zap,
  Copy as CopyIcon,
  CheckCheck,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import {
  fetchAllPrinterData,
  formatMediaSize,
  formatMemory,
  type PrinterData,
} from "@/app/_lib/printer-api";

const PRINTER_IP = "192.168.1.62";

// Ink color styling
const inkStyles = {
  K: {
    bg: "bg-ink-black",
    glow: "shadow-[0_0_12px_rgba(0,0,0,0.3)]",
    label: "Black",
  },
  C: {
    bg: "bg-ink-cyan",
    glow: "shadow-[0_0_12px_rgba(0,200,255,0.4)]",
    label: "Cyan",
  },
  M: {
    bg: "bg-ink-magenta",
    glow: "shadow-[0_0_12px_rgba(255,0,150,0.4)]",
    label: "Magenta",
  },
  Y: {
    bg: "bg-ink-yellow",
    glow: "shadow-[0_0_12px_rgba(255,200,0,0.4)]",
    label: "Yellow",
  },
} as const;

// Signal strength bars component
function SignalBars({ strength, dbm }: { strength: number; dbm: number }) {
  return (
    <div className="flex items-end gap-0.5 h-4" title={`${dbm} dBm`}>
      {[1, 2, 3, 4, 5].map((bar) => (
        <div
          key={bar}
          className={cn(
            "w-1 rounded-full transition-all duration-300",
            bar <= strength ? "bg-status-ready" : "bg-muted-foreground/20",
          )}
          style={{ height: `${bar * 3 + 2}px` }}
        />
      ))}
    </div>
  );
}

// Ink tank visualization - vertical gauge style
function InkTank({
  color,
  level,
}: {
  color: "K" | "C" | "M" | "Y";
  level: number;
  state: string;
  model: string;
}) {
  const style = inkStyles[color];
  const isLow = level < 20;

  return (
    <div className="flex flex-col items-center gap-2">
      {/* Tank container */}
      <div
        className={cn(
          "relative w-10 h-20 rounded-lg border-2 border-border/50 overflow-hidden",
          "bg-gradient-to-b from-muted/30 to-muted/60",
          isLow && "animate-pulse",
        )}
      >
        {/* Liquid fill */}
        <div
          className={cn(
            "absolute bottom-0 left-0 right-0 transition-all duration-700 ease-out",
            style.bg,
            level > 50 && style.glow,
          )}
          style={{ height: `${level}%` }}
        >
          {/* Liquid surface highlight */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-white/20" />
        </div>

        {/* Level markers */}
        <div className="absolute inset-0 flex flex-col justify-between py-1 px-0.5 pointer-events-none">
          {[75, 50, 25].map((mark) => (
            <div
              key={mark}
              className="w-full h-px bg-foreground/10"
              style={{ marginTop: `${100 - mark - 12.5}%` }}
            />
          ))}
        </div>
      </div>

      {/* Label */}
      <div className="text-center">
        <div className="text-xs font-semibold tabular-nums">{level}%</div>
        <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
          {color}
        </div>
      </div>
    </div>
  );
}

// Data row component
function DataRow({
  icon: Icon,
  label,
  value,
  mono = false,
  copyable = false,
}: {
  icon?: React.ElementType;
  label: string;
  value: string | number;
  mono?: boolean;
  copyable?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(String(value));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
      <div className="flex items-center gap-2 text-muted-foreground">
        {Icon && <Icon className="size-3.5" />}
        <span className="text-xs">{label}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span
          className={cn(
            "text-sm font-medium",
            mono && "font-mono text-xs tracking-tight",
          )}
        >
          {value}
        </span>
        {copyable && (
          <button
            onClick={handleCopy}
            className="p-1 rounded hover:bg-muted transition-colors"
          >
            {copied ? (
              <CheckCheck className="size-3 text-status-ready" />
            ) : (
              <CopyIcon className="size-3 text-muted-foreground" />
            )}
          </button>
        )}
      </div>
    </div>
  );
}

// Section header
function SectionHeader({ children }: { children: ReactNode }) {
  return (
    <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.15em] mb-2">
      {children}
    </h3>
  );
}

// Loading skeleton
function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-6 bg-muted rounded w-3/4" />
      <div className="flex justify-center gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="w-10 h-20 bg-muted rounded-lg" />
        ))}
      </div>
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-8 bg-muted rounded" />
        ))}
      </div>
    </div>
  );
}

// Error state
function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="size-12 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
        <AlertTriangle className="size-6 text-destructive" />
      </div>
      <h3 className="font-medium mb-1">Connection Failed</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Could not reach the printer at {PRINTER_IP}
      </p>
      <button
        onClick={onRetry}
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
      >
        <RefreshCw className="size-4" />
        Retry
      </button>
    </div>
  );
}

interface PrinterInfoModalProps {
  children: ReactNode;
}

export function PrinterInfoModal({ children }: PrinterInfoModalProps) {
  const [data, setData] = useState<PrinterData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const printerData = await fetchAllPrinterData();
      setData(printerData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen, fetchData]);

  const connectedWifi = data?.network.adapters.find(
    (a) => a.type === "wifi" && a.isConnected && a.wifi,
  );

  const hasLowInk = data?.ink.some((i) => i.percentRemaining < 20) ?? false;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger render={<button className="text-left w-full" />}>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
        {loading ? (
          <LoadingSkeleton />
        ) : error ? (
          <ErrorState onRetry={fetchData} />
        ) : data ? (
          <>
            <DialogHeader className="pb-2">
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "size-10 rounded-xl flex items-center justify-center",
                    "bg-gradient-to-br from-muted to-muted/50 border border-border/50",
                  )}
                >
                  <Printer className="size-5" />
                </div>
                <div>
                  <DialogTitle className="text-base font-semibold leading-tight">
                    {data.device.model.replace("HP ", "")}
                  </DialogTitle>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-xs text-muted-foreground font-mono">
                      {PRINTER_IP}
                    </p>
                    {/* Status indicator */}
                    <div
                      className={cn(
                        "flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium",
                        data.status.state === "ready" &&
                          "bg-status-ready/10 text-status-ready",
                        data.status.state === "inPowerSave" &&
                          "bg-status-busy/10 text-status-busy",
                        data.status.state === "processing" &&
                          "bg-chart-2/10 text-chart-2",
                        data.status.state === "error" &&
                          "bg-destructive/10 text-destructive",
                      )}
                    >
                      <span
                        className={cn(
                          "size-1.5 rounded-full",
                          data.status.state === "ready" && "bg-status-ready",
                          data.status.state === "inPowerSave" &&
                            "bg-status-busy",
                          data.status.state === "processing" &&
                            "bg-chart-2 animate-pulse",
                          data.status.state === "error" && "bg-destructive",
                        )}
                      />
                      {data.status.state === "inPowerSave"
                        ? "Sleep"
                        : data.status.state.charAt(0).toUpperCase() +
                          data.status.state.slice(1)}
                    </div>
                  </div>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-5 pt-2">
              {/* Ink Levels - Hero Section */}
              <div>
                <SectionHeader>Ink Levels</SectionHeader>
                <div
                  className={cn(
                    "p-4 rounded-xl",
                    "bg-gradient-to-b from-muted/30 to-muted/60",
                    "border border-border/30",
                  )}
                >
                  <div className="flex justify-center gap-5">
                    {data.ink.map((ink) => (
                      <InkTank
                        key={ink.color}
                        color={ink.color}
                        level={ink.percentRemaining}
                        state={ink.state}
                        model={ink.cartridgeModel}
                      />
                    ))}
                  </div>
                  {hasLowInk && (
                    <div className="flex items-center justify-center gap-2 mt-4 pt-3 border-t border-border/30">
                      <AlertTriangle className="size-3.5 text-status-busy" />
                      <span className="text-xs text-status-busy font-medium">
                        Low ink warning
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Paper Tray */}
              <div>
                <SectionHeader>Paper</SectionHeader>
                <div
                  className={cn(
                    "p-4 rounded-xl border",
                    data.paper.state === "missing"
                      ? "border-status-busy/50 bg-status-busy/5"
                      : "border-border/30 bg-muted/20",
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-sm">
                        {data.paper.id.replace(/([A-Z])/g, " $1").trim()}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {formatMediaSize(data.paper.mediaSize)} ·{" "}
                        {data.paper.mediaType.charAt(0).toUpperCase() +
                          data.paper.mediaType.slice(1)}
                      </div>
                    </div>
                    {data.paper.state === "missing" ? (
                      <span className="text-xs font-medium text-status-busy px-2 py-1 rounded-full bg-status-busy/10">
                        Empty
                      </span>
                    ) : (
                      <span className="text-xs font-medium text-status-ready px-2 py-1 rounded-full bg-status-ready/10">
                        Ready
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Network */}
              <div>
                <SectionHeader>Network</SectionHeader>
                <Collapsible className="rounded-xl border border-border/30 overflow-hidden">
                  <CollapsibleTrigger className="px-4 py-3 bg-muted/20 hover:bg-muted/30 transition-colors">
                    {connectedWifi?.wifi ? (
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2">
                          <Wifi className="size-4 text-status-ready" />
                          <span className="text-sm font-medium">
                            {connectedWifi.wifi.ssid}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <SignalBars
                            strength={connectedWifi.wifi.signalStrength}
                            dbm={connectedWifi.wifi.signalDbm}
                          />
                          <ChevronDown className="size-4 text-muted-foreground transition-transform duration-200 [[data-panel-open]_&]:rotate-180" />
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <WifiOff className="size-4" />
                          <span className="text-sm">Not connected</span>
                        </div>
                        <ChevronDown className="size-4 text-muted-foreground transition-transform duration-200 [[data-panel-open]_&]:rotate-180" />
                      </div>
                    )}
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="px-4 border-t border-border/30 divide-y divide-border/30">
                      <DataRow
                        label="Hostname"
                        value={data.network.domainName}
                        mono
                        copyable
                      />
                      {connectedWifi?.wifi && (
                        <>
                          <DataRow
                            label="Channel"
                            value={connectedWifi.wifi.channel}
                          />
                          <DataRow
                            label="Security"
                            value={connectedWifi.wifi.encryption}
                          />
                        </>
                      )}
                      <DataRow
                        label="MAC"
                        value={connectedWifi?.macAddress || "N/A"}
                        mono
                        copyable
                      />
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </div>

              {/* Usage Stats */}
              <div>
                <SectionHeader>Usage Statistics</SectionHeader>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-3 rounded-xl bg-muted/30 border border-border/30">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <FileText className="size-3.5" />
                      <span className="text-[10px] uppercase tracking-wider">
                        Total Pages
                      </span>
                    </div>
                    <div className="text-xl font-semibold tabular-nums">
                      {data.usage.totalImpressions.toLocaleString()}
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-muted/30 border border-border/30">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <Zap className="size-3.5" />
                      <span className="text-[10px] uppercase tracking-wider">
                        Ink Used
                      </span>
                    </div>
                    <div className="text-xl font-semibold tabular-nums">
                      {data.usage.inkUsedMl} ml
                    </div>
                  </div>
                </div>
                <div className="mt-2 px-4 py-2 rounded-xl bg-muted/20 border border-border/30">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Color</span>
                    <span className="font-medium tabular-nums">
                      {data.usage.colorImpressions.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs mt-1">
                    <span className="text-muted-foreground">B&W</span>
                    <span className="font-medium tabular-nums">
                      {data.usage.monochromeImpressions.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs mt-1">
                    <span className="text-muted-foreground">Duplex</span>
                    <span className="font-medium tabular-nums">
                      {data.usage.duplexSheets.toLocaleString()} sheets
                    </span>
                  </div>
                </div>
              </div>

              {/* Device Info */}
              <div>
                <SectionHeader>Device Information</SectionHeader>
                <div className="rounded-xl border border-border/30 px-4 divide-y divide-border/30">
                  <DataRow
                    icon={Hash}
                    label="Serial"
                    value={data.device.serialNumber}
                    mono
                    copyable
                  />
                  <DataRow
                    icon={Cpu}
                    label="Firmware"
                    value={data.device.firmware.version
                      .split(".")
                      .slice(0, 2)
                      .join(".")}
                    mono
                  />
                  <DataRow
                    icon={HardDrive}
                    label="Memory"
                    value={formatMemory(data.device.memory.totalKb)}
                  />
                  <DataRow
                    icon={Calendar}
                    label="Manufactured"
                    value={new Date(
                      data.device.manufacturer.date,
                    ).toLocaleDateString("en-US", {
                      month: "short",
                      year: "numeric",
                    })}
                  />
                </div>
              </div>

              {/* Refresh button */}
              <button
                onClick={fetchData}
                disabled={loading}
                className={cn(
                  "w-full py-2.5 rounded-xl text-sm font-medium",
                  "border border-border/50 bg-muted/20",
                  "hover:bg-muted/40 transition-colors",
                  "flex items-center justify-center gap-2",
                  "disabled:opacity-50",
                )}
              >
                <RefreshCw
                  className={cn("size-4", loading && "animate-spin")}
                />
                Refresh Data
              </button>
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
