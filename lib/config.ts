// Printer connection configuration.
// Centralized constants for connecting to the HP OfficeJet Pro 8020.

export const PRINTER_IP = "192.168.1.62";
export const PRINTER_URI = `ipp://${PRINTER_IP}:631/ipp/print`;
export const PRINTER_HTTP_BASE = `http://${PRINTER_IP}`;
