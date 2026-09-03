"use client";

import { useState, ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "@/context/AuthContext";

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 1,
            refetchOnWindowFocus: false,
            staleTime: 30_000,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: "#12172A",
              color: "#F6F1E4",
              border: "1px solid #232C48",
              borderRadius: "12px",
              fontSize: "14px",
              padding: "12px 16px",
            },
            success: { iconTheme: { primary: "#1F7A5C", secondary: "#F6F1E4" } },
            error: { iconTheme: { primary: "#C2452D", secondary: "#F6F1E4" } },
          }}
        />
      </AuthProvider>
    </QueryClientProvider>
  );
}
