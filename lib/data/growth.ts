"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  loadWhoTable,
  type WhoIndicator,
  type WhoSex,
} from "@/lib/content/who";
import type { GrowthInput } from "@/lib/rules/growthForm";
import { supabase } from "@/lib/supabase/client";
import type { GrowthRow } from "@/lib/supabase/rows";
import { enqueueGrowthChange, growthKey, withPendingGrowth } from "./outbox";

export function useGrowth(babyId: string) {
  return useQuery({
    queryKey: growthKey(babyId),
    queryFn: async (): Promise<GrowthRow[]> => {
      const { data, error } = await supabase()
        .from("growth")
        .select("*")
        .eq("baby_id", babyId)
        .order("measured_on", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return withPendingGrowth(babyId, data);
    },
    staleTime: 60_000,
  });
}

// The WHO tables never change: kept forever, and persisted like other queries,
// so the charts also work offline once they were opened online. A fix to
// content/who/*.json reaches devices only after PERSIST_BUSTER is bumped.
// networkMode "always": the loader is a chunk import, which the service worker
// may already hold; offline without it the import fails and the page says so.
export function useWhoTable(indicator: WhoIndicator, sex: WhoSex) {
  return useQuery({
    queryKey: ["who", indicator, sex],
    queryFn: () => loadWhoTable(indicator, sex),
    networkMode: "always",
    staleTime: Infinity,
    gcTime: Infinity,
  });
}

// Spec §9: measurements go through the outbox with a client id.
export function useGrowthActions(babyId: string, userId: string) {
  const queryClient = useQueryClient();
  const base = { babyId, userId };
  return {
    add: useMutation({
      networkMode: "always",
      mutationFn: (input: GrowthInput) =>
        enqueueGrowthChange(queryClient, {
          ...base,
          op: "insert",
          rowId: crypto.randomUUID(),
          row: input,
        }),
    }),
    update: useMutation({
      networkMode: "always",
      mutationFn: ({ id, input }: { id: string; input: GrowthInput }) =>
        enqueueGrowthChange(queryClient, {
          ...base,
          op: "update",
          rowId: id,
          row: input,
        }),
    }),
    remove: useMutation({
      networkMode: "always",
      mutationFn: (id: string) =>
        enqueueGrowthChange(queryClient, {
          ...base,
          op: "delete",
          rowId: id,
          row: null,
        }),
    }),
  };
}
