"use client";

import { RefreshButton } from "@/app/_components/refresh-button";
import { StatusBar } from "./status-bar";

export function MobileHeader() {
  return (
    <header className="md:hidden flex items-center justify-between h-14 px-4 border-b bg-background">
      {/* Status Bar */}
      <StatusBar className="flex-1 min-w-0" />

      {/* Refresh */}
      <RefreshButton />
    </header>
  );
}
