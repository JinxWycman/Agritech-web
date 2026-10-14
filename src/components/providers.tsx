"use client";

import { QueryClient, QueryClientProvider, keepPreviousData } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { bootstrapSession } from "@/lib/api";
import { ApiError } from "@/lib/http";
import { getDataMode } from "@/lib/data-mode";

function shouldRetry(failureCount: number, error: unknown) {
  // Do not hammer the API when the password is wrong or the role is forbidden.
  if (error instanceof ApiError && error.status >= 400 && error.status < 500) return false;
  return failureCount < 1;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: shouldRetry,
            staleTime: 30_000,
            gcTime: 10 * 60_000,
            refetchOnWindowFocus: false,
            refetchOnReconnect: true,
            placeholderData: keepPreviousData,
          },
          mutations: { retry: false },
        },
      }),
  );
  useEffect(() => {
    if (getDataMode() === "api") void bootstrapSession();
  }, []);
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
