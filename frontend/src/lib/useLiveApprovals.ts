"use client";

import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { api } from "@/lib/axios";

/**
 * Keeps an approvals list fresh by checking every few seconds, so new requests
 * appear without refreshing or switching tabs. It shares its query key with the
 * Approvals tab, so the tab updates from the same data. Returns how many are
 * waiting, for the sidebar badge, and shows a small notice when a new one arrives.
 */
export function useLiveApprovalCount(queryKey: string, endpoint: string, noun: string) {
  const { data } = useQuery({
    queryKey: [queryKey],
    queryFn: async () => (await api.get(endpoint)).data.data as unknown[],
    refetchInterval: 5000,
    refetchOnWindowFocus: "always",
  });

  const count = data?.length ?? 0;
  const previous = useRef<number | null>(null);

  useEffect(() => {
    if (data === undefined) return;
    if (previous.current !== null && count > previous.current) {
      toast(`New ${noun} waiting for approval.`, { icon: "🔔" });
    }
    previous.current = count;
  }, [count, data, noun]);

  return count;
}
