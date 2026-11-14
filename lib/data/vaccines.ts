"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { DosePatch } from "@/lib/rules/vaccineForm";
import { supabase } from "@/lib/supabase/client";
import type { VaccineDoseRow } from "@/lib/supabase/rows";
import { updateBaby } from "./baby";
import { enqueueDoseChange, vaccineDosesKey, withPendingDoses } from "./outbox";

export type DoseRef = { code: string; doseNo: number };

export function useVaccineDoses(babyId: string) {
  return useQuery({
    queryKey: vaccineDosesKey(babyId),
    queryFn: async (): Promise<VaccineDoseRow[]> => {
      const { data, error } = await supabase()
        .from("vaccine_doses")
        .select("*")
        .eq("baby_id", babyId);
      if (error) throw error;
      return withPendingDoses(babyId, data);
    },
    staleTime: 60_000,
  });
}

// Spec §9: dose marks go through the outbox, so they work offline and show ⏳.
// networkMode "always" lets these run offline.
export function useDoseActions(babyId: string, userId: string) {
  const queryClient = useQueryClient();
  return {
    save: useMutation({
      networkMode: "always",
      mutationFn: ({ ref, patch }: { ref: DoseRef; patch: DosePatch }) =>
        enqueueDoseChange(queryClient, {
          op: "upsert",
          babyId,
          userId,
          code: ref.code,
          doseNo: ref.doseNo,
          marks: patch,
        }),
    }),
    clear: useMutation({
      networkMode: "always",
      mutationFn: (ref: DoseRef) =>
        enqueueDoseChange(queryClient, {
          op: "delete",
          babyId,
          userId,
          code: ref.code,
          doseNo: ref.doseNo,
        }),
    }),
  };
}

// Owner only (spec §4.1). The quick-ticked doses ("done" without a date, spec
// §6.1) go through the outbox first; the series choices then need the network.
export function useVaccineSetup(babyId: string, userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      choices: Record<string, string>;
      ticked: DoseRef[];
    }) => {
      for (const ref of input.ticked)
        await enqueueDoseChange(queryClient, {
          op: "insert",
          babyId,
          userId,
          code: ref.code,
          doseNo: ref.doseNo,
          marks: { status: "done" },
        });
      await updateBaby(babyId, { vaccine_choices: input.choices });
    },
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: ["family-context"] }),
  });
}

// Owner only (spec §4.1).
export function useUpdateChoices(babyId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (choices: Record<string, string>) =>
      updateBaby(babyId, { vaccine_choices: choices }),
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: ["family-context"] }),
  });
}
