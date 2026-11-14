"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";
import type { DosePatch } from "@/lib/rules/vaccineForm";
import { supabase } from "@/lib/supabase/client";
import type { VaccineDoseRow } from "@/lib/supabase/rows";
import { updateBaby } from "./baby";
import { PermissionDeniedError } from "./errors";

export type DoseRef = { code: string; doseNo: number };

const dosesKey = (babyId: string) => ["vaccine-doses", babyId] as const;
const CONFLICT = "baby_id,vaccine_code,dose_no";

export function useVaccineDoses(babyId: string) {
  return useQuery({
    queryKey: dosesKey(babyId),
    queryFn: async (): Promise<VaccineDoseRow[]> => {
      const { data, error } = await supabase()
        .from("vaccine_doses")
        .select("*")
        .eq("baby_id", babyId);
      if (error) throw error;
      return data;
    },
    staleTime: 60_000,
  });
}

// Spec §9: upsert on the natural key and never send id, so the update branch
// keeps the row's primary key.
export async function saveDose(
  babyId: string,
  ref: DoseRef,
  patch: DosePatch,
): Promise<void> {
  const { data, error } = await supabase()
    .from("vaccine_doses")
    .upsert(
      {
        baby_id: babyId,
        vaccine_code: ref.code,
        dose_no: ref.doseNo,
        ...patch,
      },
      { onConflict: CONFLICT },
    )
    .select("id");
  if (error) throw error;
  if (data.length === 0) throw new PermissionDeniedError();
}

export async function clearDose(babyId: string, ref: DoseRef): Promise<void> {
  const { data, error } = await supabase()
    .from("vaccine_doses")
    .delete()
    .eq("baby_id", babyId)
    .eq("vaccine_code", ref.code)
    .eq("dose_no", ref.doseNo)
    .select("id");
  if (error) throw error;
  if (data.length === 0) throw new PermissionDeniedError();
}

// Quick tick (spec §6.1): "done" without a date; rows someone already marked stay as they are.
export async function tickDoses(
  babyId: string,
  refs: DoseRef[],
): Promise<void> {
  if (refs.length === 0) return;
  const { error } = await supabase()
    .from("vaccine_doses")
    .upsert(
      refs.map((ref) => ({
        baby_id: babyId,
        vaccine_code: ref.code,
        dose_no: ref.doseNo,
        status: "done",
      })),
      { onConflict: CONFLICT, ignoreDuplicates: true },
    );
  if (error) throw error;
}

function invalidateDoses(queryClient: QueryClient, babyId: string) {
  return queryClient.invalidateQueries({ queryKey: dosesKey(babyId) });
}

export function useDoseActions(babyId: string) {
  const queryClient = useQueryClient();
  const onSettled = () => invalidateDoses(queryClient, babyId);
  return {
    save: useMutation({
      mutationFn: ({ ref, patch }: { ref: DoseRef; patch: DosePatch }) =>
        saveDose(babyId, ref, patch),
      onSettled,
    }),
    clear: useMutation({
      mutationFn: (ref: DoseRef) => clearDose(babyId, ref),
      onSettled,
    }),
  };
}

// Owner only (spec §4.1). Ticks first: once the choices are saved the setup block
// disappears, so a failure after that point would go unseen.
export function useVaccineSetup(babyId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      choices: Record<string, string>;
      ticked: DoseRef[];
    }) => {
      await tickDoses(babyId, input.ticked);
      await updateBaby(babyId, { vaccine_choices: input.choices });
    },
    onSettled: async () => {
      await invalidateDoses(queryClient, babyId);
      await queryClient.invalidateQueries({ queryKey: ["family-context"] });
    },
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
