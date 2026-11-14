"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import type { MilestoneRow } from "@/lib/supabase/rows";
import {
  enqueueMilestoneChange,
  milestonesKey,
  withPendingMilestones,
} from "./outbox";

export function useMilestones(babyId: string) {
  return useQuery({
    queryKey: milestonesKey(babyId),
    queryFn: async (): Promise<MilestoneRow[]> => {
      const { data, error } = await supabase()
        .from("milestones_achieved")
        .select("*")
        .eq("baby_id", babyId);
      if (error) throw error;
      return withPendingMilestones(babyId, data);
    },
    staleTime: 60_000,
  });
}

// Spec §9: marks go through the outbox, so they work offline and show ⏳.
export function useMilestoneActions(babyId: string, userId: string) {
  const queryClient = useQueryClient();
  return {
    mark: useMutation({
      networkMode: "always",
      mutationFn: (input: {
        code: string;
        achieved_on: string;
        note: string | null;
        photo_id: string | null;
      }) =>
        enqueueMilestoneChange(queryClient, {
          op: "upsert",
          babyId,
          userId,
          code: input.code,
          marks: {
            achieved_on: input.achieved_on,
            note: input.note,
            photo_id: input.photo_id,
          },
        }),
    }),
    unmark: useMutation({
      networkMode: "always",
      mutationFn: (code: string) =>
        enqueueMilestoneChange(queryClient, {
          op: "delete",
          babyId,
          userId,
          code,
        }),
    }),
  };
}
