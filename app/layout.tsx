import type { Metadata } from "next";
import { DM_Sans, Fraunces } from "next/font/google";
import { Navbar } from "@/components/navbar";
import { MobileHeader } from "@/components/mobile-header";
import { BottomNav } from "@/components/bottom-nav";
import { StatusDrawer } from "@/components/status-drawer";
import { PrinterStatusProvider } from "@/components/_lib/printer-status-context";
import { Providers } from "./_components/providers";
import "./globals.css";

const fontSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700"],
});

const fontDisplay = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "HP Printer",
  description: "Control your HP OfficeJet Pro 8020",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${fontSans.variable} ${fontDisplay.variable}`}>
      <body className="antialiased font-sans">
        <Providers>
          <PrinterStatusProvider>
            <div className="min-h-screen flex flex-col">
              <Navbar />
              <MobileHeader />
              <StatusDrawer />
              <main className="flex-1 pb-16 md:pb-0">{children}</main>
              <BottomNav />
            </div>
          </PrinterStatusProvider>
        </Providers>
      </body>
    </html>
  );
}
