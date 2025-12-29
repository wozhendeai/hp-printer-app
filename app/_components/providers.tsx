"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import { type ReactNode, useMemo } from "react";
import { getQueryClient } from "../_lib/get-query-client";

interface ProvidersProps {
  children: ReactNode;
}

// Check if we're on the client side
const isClient = typeof window !== "undefined";

export function Providers({ children }: ProvidersProps) {
  const queryClient = getQueryClient();

  // Create persister only on client side using useMemo for lazy initialization
  const persister = useMemo(() => {
    if (!isClient) return null;
    return createSyncStoragePersister({
      storage: window.localStorage,
      key: "hp-printer-query-cache",
    });
  }, []);

  // During SSR or if persister unavailable, render without persistence
  if (!persister) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    );
  }

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister,
        dehydrateOptions: {
          // Only persist client-state queries (recent copies, scans, prints)
          shouldDehydrateQuery: (query) => query.queryKey[0] === "client-state",
        },
      }}
    >
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </PersistQueryClientProvider>
  );
}
