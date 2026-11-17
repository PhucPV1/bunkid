"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import type { MedicineScheduleRow } from "@/lib/supabase/rows";
import { PermissionDeniedError } from "./errors";

const schedulesKey = (babyId: string) =>
  ["medicine-schedules", babyId] as const;

export function useMedicineSchedules(babyId: string) {
  return useQuery({
    queryKey: schedulesKey(babyId),
    queryFn: async (): Promise<MedicineScheduleRow[]> => {
      const { data, error } = await supabase()
        .from("medicine_schedules")
        .select("*")
        .eq("baby_id", babyId)
        .order("created_at");
      if (error) throw error;
      return data;
    },
    staleTime: 60_000,
  });
}

async function updateSchedule(
  id: string,
  patch: { enabled?: boolean; remind_at_min?: number },
): Promise<void> {
  const { data, error } = await supabase()
    .from("medicine_schedules")
    .update(patch)
    .eq("id", id)
    .select("id");
  if (error) throw error;
  if (data.length === 0) throw new PermissionDeniedError();
}

// Spec 2026-11-17 §4.2: schedules are written online only (OnlineOnly in the UI).
export function useScheduleActions(babyId: string) {
  const queryClient = useQueryClient();
  const onSettled = () =>
    queryClient.invalidateQueries({ queryKey: schedulesKey(babyId) });
  return {
    add: useMutation({
      mutationFn: async (input: { name: string; remind_at_min: number }) => {
        const { error } = await supabase()
          .from("medicine_schedules")
          .insert({ baby_id: babyId, ...input });
        if (error) throw error;
      },
      onSettled,
    }),
    setEnabled: useMutation({
      mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) =>
        updateSchedule(id, { enabled }),
      onSettled,
    }),
    setTime: useMutation({
      mutationFn: ({
        id,
        remind_at_min,
      }: {
        id: string;
        remind_at_min: number;
      }) => updateSchedule(id, { remind_at_min }),
      onSettled,
    }),
    remove: useMutation({
      mutationFn: async (id: string) => {
        const { data, error } = await supabase()
          .from("medicine_schedules")
          .delete()
          .eq("id", id)
          .select("id");
        if (error) throw error;
        if (data.length === 0) throw new PermissionDeniedError();
      },
      onSettled,
    }),
  };
}
