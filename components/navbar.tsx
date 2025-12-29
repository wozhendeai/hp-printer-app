"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Printer, Copy, Scan } from "lucide-react";
import { cn } from "@/lib/utils";
import { RefreshButton } from "@/app/_components/refresh-button";
import { StatusBar } from "./status-bar";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/print", label: "Print", icon: Printer },
  { href: "/copy", label: "Copy", icon: Copy },
  { href: "/scan", label: "Scan", icon: Scan },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="hidden md:flex items-center justify-between h-14 px-6 border-b bg-background">
      <div className="flex items-center gap-6">
        {/* Status Bar */}
        <StatusBar className="pr-4 border-r border-border" />

        {/* Navigation */}
        <div className="flex items-center gap-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors",
                  isActive
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted",
                )}
              >
                <item.icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>
      <RefreshButton />
    </nav>
  );
}
