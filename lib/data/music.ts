"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { MusicCategory } from "@/lib/content/music";
import type { YouTubeTarget } from "@/lib/rules/youtube";
import { supabase } from "@/lib/supabase/client";
import type { MusicLinkRow } from "@/lib/supabase/rows";
import { PermissionDeniedError } from "./errors";

const musicKey = (familyId: string) => ["music-links", familyId] as const;

export function useMusicLinks(familyId: string) {
  return useQuery({
    queryKey: musicKey(familyId),
    queryFn: async (): Promise<MusicLinkRow[]> => {
      const { data, error } = await supabase()
        .from("music_links")
        .select("*")
        .eq("family_id", familyId)
        .order("created_at");
      if (error) throw error;
      return data;
    },
    staleTime: 60_000,
  });
}

async function expectRows(
  query: PromiseLike<{ data: { id: string }[] | null; error: unknown }>,
) {
  const { data, error } = await query;
  if (error) throw error;
  if (!data || data.length === 0) throw new PermissionDeniedError();
}

// Spec §9: music_links are written online only (OnlineOnly in the UI).
export function useMusicActions(familyId: string) {
  const queryClient = useQueryClient();
  const onSettled = () =>
    queryClient.invalidateQueries({ queryKey: musicKey(familyId) });
  return {
    add: useMutation({
      mutationFn: async (input: {
        category: MusicCategory;
        title: string | null;
        target: YouTubeTarget;
      }) => {
        const { error } = await supabase()
          .from("music_links")
          .insert({
            family_id: familyId,
            category: input.category,
            title: input.title,
            youtube_video_id:
              input.target.kind === "video" ? input.target.id : null,
            youtube_playlist_id:
              input.target.kind === "playlist" ? input.target.id : null,
          });
        if (error) throw error;
      },
      onSettled,
    }),
    // Hiding a preset stores a row with its preset_code (spec §6.11).
    setPresetHidden: useMutation({
      mutationFn: (input: {
        presetCode: string;
        category: MusicCategory;
        hidden: boolean;
      }) =>
        expectRows(
          supabase()
            .from("music_links")
            .upsert(
              {
                family_id: familyId,
                category: input.category,
                preset_code: input.presetCode,
                hidden: input.hidden,
              },
              { onConflict: "family_id,preset_code" },
            )
            .select("id"),
        ),
      onSettled,
    }),
    setLinkHidden: useMutation({
      mutationFn: ({ id, hidden }: { id: string; hidden: boolean }) =>
        expectRows(
          supabase()
            .from("music_links")
            .update({ hidden })
            .eq("id", id)
            .select("id"),
        ),
      onSettled,
    }),
    remove: useMutation({
      mutationFn: (id: string) =>
        expectRows(
          supabase().from("music_links").delete().eq("id", id).select("id"),
        ),
      onSettled,
    }),
  };
}
