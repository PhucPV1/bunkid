"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { vnDateString } from "@/lib/rules/time";
import { supabase } from "@/lib/supabase/client";
import type { EpisodeRow, PhotoRow, VisitRow } from "@/lib/supabase/rows";
import { PermissionDeniedError } from "./errors";
import {
  enqueueEpisodeChange,
  episodesKey,
  withPendingEpisodes,
} from "./outbox";
import { deletePhoto, uploadPhoto } from "./photos";

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

// Spec 2026-11-26 §8: a doctor's visit with the photos of its prescription.
export type Visit = VisitRow & { photos: PhotoRow[] };
// The columns of a visit the sheet writes; an empty field is null.
export type VisitFields = {
  visited_at: string;
  place: string | null;
  conclusion: string | null;
  advice: string | null;
};
// What a save did: the visit's id, and the photos that did not go up.
export type VisitSaved = { id: string; failed: File[] };

export const visitsKey = (babyId: string) =>
  ["illness-visits", babyId] as const;

// Every visit of the baby, oldest first, each with its photos (oldest
// first). A family has a handful of visits and at most six photos each, far
// under the 1000 rows the server returns at once.
export async function fetchVisits(babyId: string): Promise<Visit[]> {
  const [visits, photos] = await Promise.all([
    supabase()
      .from("illness_visits")
      .select("*")
      .eq("baby_id", babyId)
      .order("visited_at")
      .order("id"),
    supabase()
      .from("photos")
      .select("*")
      .eq("baby_id", babyId)
      .not("visit_id", "is", null)
      .order("created_at")
      .order("id"),
  ]);
  if (visits.error) throw visits.error;
  if (photos.error) throw photos.error;
  return visits.data.map((visit) => ({
    ...visit,
    photos: photos.data.filter((photo) => photo.visit_id === visit.id),
  }));
}

// Spec §8.2: read from the server. The cache is kept on the phone like every
// query, so a visit seen once still shows offline. `enabled` false loads
// nothing (the report away from the "Đợt ốm" period).
export function useVisits(babyId: string, enabled = true) {
  return useQuery({
    queryKey: visitsKey(babyId),
    queryFn: () => fetchVisits(babyId),
    staleTime: 60_000,
    enabled,
  });
}

// Takes the photos after the row is saved: a photo that fails is skipped,
// the next one still goes up (spec §8.2).
async function uploadAll(
  ids: { babyId: string; familyId: string; visitId: string },
  visitedAt: string,
  files: File[],
): Promise<File[]> {
  const failed: File[] = [];
  for (const file of files) {
    try {
      await uploadPhoto({
        ...ids,
        file,
        takenOn: vnDateString(new Date(visitedAt)),
        caption: null,
      });
    } catch {
      failed.push(file);
    }
  }
  return failed;
}

// Spec §8.2: visits and their photos go straight to the server and need the
// network, like the Photos page; the screen turns the buttons off offline.
export function useVisitActions(babyId: string, familyId: string) {
  const queryClient = useQueryClient();
  const onSettled = async () => {
    await queryClient.invalidateQueries({ queryKey: visitsKey(babyId) });
    await queryClient.invalidateQueries({
      queryKey: ["photos-usage", familyId],
    });
  };
  return {
    // The row first, under a new id; then each photo.
    add: useMutation({
      mutationFn: async (input: {
        episodeId: string;
        fields: VisitFields;
        files: File[];
      }): Promise<VisitSaved> => {
        const id = crypto.randomUUID();
        const { error } = await supabase()
          .from("illness_visits")
          .insert({
            id,
            episode_id: input.episodeId,
            baby_id: babyId,
            ...input.fields,
          });
        if (error) throw error;
        const failed = await uploadAll(
          { babyId, familyId, visitId: id },
          input.fields.visited_at,
          input.files,
        );
        return { id, failed };
      },
      onSettled,
    }),
    // `patch` null: the fields did not change, only photos go up.
    update: useMutation({
      mutationFn: async (input: {
        id: string;
        patch: VisitFields | null;
        visitedAt: string;
        files: File[];
      }): Promise<VisitSaved> => {
        if (input.patch) {
          const { data, error } = await supabase()
            .from("illness_visits")
            .update(input.patch)
            .eq("id", input.id)
            .select("id");
          if (error) throw error;
          if (data.length === 0) throw new PermissionDeniedError();
        }
        const failed = await uploadAll(
          { babyId, familyId, visitId: input.id },
          input.visitedAt,
          input.files,
        );
        return { id: input.id, failed };
      },
      onSettled,
    }),
    removePhoto: useMutation({ mutationFn: deletePhoto, onSettled }),
    // Each photo with the delete of the Photos page, then the row. A step
    // that fails stops the rest; what is left can be deleted again.
    remove: useMutation({
      mutationFn: async (visit: Visit) => {
        for (const photo of visit.photos) await deletePhoto(photo);
        const { data, error } = await supabase()
          .from("illness_visits")
          .delete()
          .eq("id", visit.id)
          .select("id");
        if (error) throw error;
        if (data.length === 0) throw new PermissionDeniedError();
      },
      onSettled,
    }),
  };
}
