"use client";

import { useState, useCallback, useSyncExternalStore } from "react";
import type { RecentCopy, CopySettings } from "./copy-types";

const STORAGE_KEY = "hp-printer-recent-copies";
const MAX_RECENT = 10;

interface StoredCopy extends Omit<RecentCopy, "timestamp"> {
  timestamp: string;
}

function parseStoredCopies(stored: string | null): RecentCopy[] {
  if (!stored) return [];
  try {
    const parsed: StoredCopy[] = JSON.parse(stored);
    return parsed.map((c) => ({
      ...c,
      timestamp: new Date(c.timestamp),
    }));
  } catch {
    return [];
  }
}

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

function getSnapshot() {
  return localStorage.getItem(STORAGE_KEY);
}

function getServerSnapshot() {
  return null;
}

export function useRecentCopies() {
  // Use useSyncExternalStore for hydration-safe localStorage access
  const storedValue = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );
  const copies = parseStoredCopies(storedValue);

  // Force re-render trigger for immediate updates
  const [, forceUpdate] = useState(0);

  const addCopy = useCallback(
    (data: {
      copies: number;
      settings: CopySettings;
      status: "completed" | "failed";
    }) => {
      const currentCopies = parseStoredCopies(
        localStorage.getItem(STORAGE_KEY),
      );

      const newCopy: RecentCopy = {
        id: crypto.randomUUID(),
        timestamp: new Date(),
        copies: data.copies,
        settings: data.settings,
        status: data.status,
      };

      const updated = [newCopy, ...currentCopies].slice(0, MAX_RECENT);

      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        // Trigger re-render since storage event only fires for other tabs
        forceUpdate((n) => n + 1);
      } catch {
        // Ignore storage errors
      }
    },
    [],
  );

  return { recentCopies: copies, addCopy };
}
