"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import type { EpisodeRow } from "@/lib/supabase/rows";
import {
  enqueueEpisodeChange,
  episodesKey,
  withPendingEpisodes,
} from "./outbox";

export type EpisodePatch = { started_at?: string; ended_at?: string | null };

export async function fetchEpisodes(babyId: string): Promise<EpisodeRow[]> {
  const { data, error } = await supabase()
    .from("illness_episodes")
    .select("*")
    .eq("baby_id", babyId)
    .order("started_at", { ascending: false });
  if (error) throw error;
  return withPendingEpisodes(babyId, data);
}

// Spec 2026-11-26 §4.2: every episode of the baby, newest start first. The
// table is not in realtime, so the list asks again every minute: a second
// phone sees a new episode after two minutes at most.
export function useEpisodes(babyId: string) {
  return useQuery({
    queryKey: episodesKey(babyId),
    queryFn: () => fetchEpisodes(babyId),
    staleTime: 60_000,
    refetchInterval: 60_000,
  });
}

// Episodes go through the outbox with a client id, so they also work offline.
// Nothing is checked here: the caller checks the times first (spec §5.7), and
// the server has the last word.
export function useEpisodeActions(babyId: string, userId: string) {
  const queryClient = useQueryClient();
  const base = { babyId, userId };
  return {
    // Resolves to the new episode's id, so the caller can open its page.
    start: useMutation({
      networkMode: "always",
      mutationFn: async ({
        startedAt,
      }: {
        startedAt: string;
      }): Promise<string> => {
        const rowId = crypto.randomUUID();
        await enqueueEpisodeChange(queryClient, {
          ...base,
          op: "insert",
          rowId,
          row: { started_at: startedAt, ended_at: null },
        });
        return rowId;
      },
    }),
    update: useMutation({
      networkMode: "always",
      mutationFn: ({ id, patch }: { id: string; patch: EpisodePatch }) =>
        enqueueEpisodeChange(queryClient, {
          ...base,
          op: "update",
          rowId: id,
          row: patch,
        }),
    }),
    remove: useMutation({
      networkMode: "always",
      mutationFn: (id: string) =>
        enqueueEpisodeChange(queryClient, {
          ...base,
          op: "delete",
          rowId: id,
          row: null,
        }),
    }),
  };
}
