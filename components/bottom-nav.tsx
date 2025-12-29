"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Printer, Copy, Scan } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/print", label: "Print", icon: Printer },
  { href: "/copy", label: "Copy", icon: Copy },
  { href: "/scan", label: "Scan", icon: Scan },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background border-t pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 px-4 py-2 min-w-[72px] transition-colors",
                isActive ? "text-foreground" : "text-muted-foreground",
              )}
            >
              <item.icon
                className={cn("size-5", isActive && "text-foreground")}
              />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
