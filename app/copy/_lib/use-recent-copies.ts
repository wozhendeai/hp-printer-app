// Hook for managing recent copy history in client state.
"use client";

import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { clientStateKeys } from "@/lib/queries/keys";
import type { CopySettings } from "@/lib/types";
import type { RecentCopy } from "./types";

const MAX_RECENT = 10;

// Stored format has timestamp as string for JSON serialization
interface StoredCopy extends Omit<RecentCopy, "timestamp"> {
  timestamp: string;
}

// Convert stored format to runtime format
function parseStoredCopies(stored: StoredCopy[]): RecentCopy[] {
  return stored.map((c) => ({
    ...c,
    timestamp: new Date(c.timestamp),
  }));
}

export function useRecentCopies() {
  const queryClient = useQueryClient();

  const { data: storedCopies = [] } = useQuery<StoredCopy[]>({
    queryKey: clientStateKeys.recentCopies(),
    queryFn: () => [],
    staleTime: Infinity,
    gcTime: Infinity,
  });

  const copies = parseStoredCopies(storedCopies);

  const addCopy = useCallback(
    (data: {
      copies: number;
      settings: CopySettings;
      status: "completed" | "failed";
    }) => {
      const newCopy: StoredCopy = {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        copies: data.copies,
        settings: data.settings,
        status: data.status,
      };

      queryClient.setQueryData<StoredCopy[]>(
        clientStateKeys.recentCopies(),
        (old = []) => [newCopy, ...old].slice(0, MAX_RECENT),
      );
    },
    [queryClient],
  );

  return { recentCopies: copies, addCopy };
}
