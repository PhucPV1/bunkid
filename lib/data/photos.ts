"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { compressPhoto } from "@/lib/photoCompress";
import { photoPath } from "@/lib/rules/photos";
import { supabase } from "@/lib/supabase/client";
import type { PhotoRow } from "@/lib/supabase/rows";
import { PermissionDeniedError } from "./errors";

const BUCKET = "photos";
const URL_SECONDS = 3600;
const photosKey = (babyId: string) => ["photos", babyId] as const;

export function usePhotos(babyId: string) {
  return useQuery({
    queryKey: photosKey(babyId),
    queryFn: async (): Promise<PhotoRow[]> => {
      const { data, error } = await supabase()
        .from("photos")
        .select("*")
        .eq("baby_id", babyId)
        .order("taken_on", { ascending: false })
        .order("created_at", { ascending: false })
        // PostgREST returns at most 1000 rows; the quota uses photos_total_bytes().
        .range(0, 999);
      if (error) throw error;
      return data;
    },
    staleTime: 60_000,
  });
}

// Spec §6.14: total bytes of the family's photos, as an aggregate on the server.
export function usePhotosUsage(familyId: string) {
  return useQuery({
    queryKey: ["photos-usage", familyId],
    queryFn: async (): Promise<number> => {
      const { data, error } = await supabase().rpc("photos_total_bytes");
      if (error) throw error;
      return data;
    },
    staleTime: 60_000,
  });
}

// Spec §6.14: signed URLs valid for 1 hour, refreshed before they expire.
// One query per month group, so an upload does not blank every thumbnail.
export function usePhotoUrls(paths: string[]) {
  return useQuery({
    queryKey: ["photo-urls", ...paths],
    queryFn: async (): Promise<Record<string, string>> => {
      if (paths.length === 0) return {};
      const { data, error } = await supabase()
        .storage.from(BUCKET)
        .createSignedUrls(paths, URL_SECONDS);
      if (error) throw error;
      const urls: Record<string, string> = {};
      for (const item of data)
        if (item.path && item.signedUrl) urls[item.path] = item.signedUrl;
      return urls;
    },
    staleTime: 50 * 60_000,
    gcTime: 55 * 60_000,
    refetchInterval: 50 * 60_000,
    placeholderData: keepPreviousData,
    enabled: paths.length > 0,
  });
}

// Spec §9: photos need the network (OnlineOnly in the UI).
export function usePhotoActions(babyId: string, familyId: string) {
  const queryClient = useQueryClient();
  const onSettled = async () => {
    await queryClient.invalidateQueries({ queryKey: photosKey(babyId) });
    await queryClient.invalidateQueries({
      queryKey: ["photos-usage", familyId],
    });
  };
  return {
    upload: useMutation({
      mutationFn: async (input: {
        file: File;
        takenOn: string;
        caption: string | null;
      }) => {
        const blob = await compressPhoto(input.file);
        const id = crypto.randomUUID();
        const path = photoPath(familyId, babyId, id);
        const storage = supabase().storage.from(BUCKET);
        const uploaded = await storage.upload(path, blob, {
          contentType: "image/jpeg",
          upsert: false,
        });
        if (uploaded.error) throw uploaded.error;
        const { error } = await supabase().from("photos").insert({
          id,
          baby_id: babyId,
          storage_path: path,
          taken_on: input.takenOn,
          caption: input.caption,
          size_bytes: blob.size,
        });
        if (error) {
          // No row means nobody can see or delete the object: remove it again.
          await storage.remove([path]);
          throw error;
        }
      },
      onSettled,
    }),
    // Spec §5.2: delete the Storage object first, then the row.
    remove: useMutation({
      mutationFn: async (photo: PhotoRow) => {
        const removed = await supabase()
          .storage.from(BUCKET)
          .remove([photo.storage_path]);
        // 0 objects: already removed by an earlier, half-finished delete (or not
        // allowed); the row delete below applies the same rule and decides.
        if (removed.error) throw removed.error;
        const { data, error } = await supabase()
          .from("photos")
          .delete()
          .eq("id", photo.id)
          .select("id");
        if (error) throw error;
        if (data.length === 0) throw new PermissionDeniedError();
      },
      onSettled,
    }),
  };
}
