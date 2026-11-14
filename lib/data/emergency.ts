"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ContactInput } from "@/lib/rules/emergency";
import { supabase } from "@/lib/supabase/client";
import type { EmergencyContactRow } from "@/lib/supabase/rows";
import { updateBaby } from "./baby";
import { PermissionDeniedError } from "./errors";

const contactsKey = (familyId: string) =>
  ["emergency-contacts", familyId] as const;

export function useEmergencyContacts(familyId: string) {
  return useQuery({
    queryKey: contactsKey(familyId),
    queryFn: async (): Promise<EmergencyContactRow[]> => {
      const { data, error } = await supabase()
        .from("emergency_contacts")
        .select("*")
        .eq("family_id", familyId)
        .order("sort")
        .order("created_at");
      if (error) throw error;
      return data;
    },
    staleTime: 60_000,
  });
}

async function updateContact(
  id: string,
  patch: Partial<ContactInput> & { sort?: number },
): Promise<void> {
  const { data, error } = await supabase()
    .from("emergency_contacts")
    .update(patch)
    .eq("id", id)
    .select("id");
  if (error) throw error;
  if (data.length === 0) throw new PermissionDeniedError();
}

// Spec §9: emergency_contacts are written online only (OnlineOnly in the UI).
export function useContactActions(familyId: string) {
  const queryClient = useQueryClient();
  const onSettled = () =>
    queryClient.invalidateQueries({ queryKey: contactsKey(familyId) });
  return {
    add: useMutation({
      mutationFn: async (input: ContactInput & { sort: number }) => {
        const { error } = await supabase()
          .from("emergency_contacts")
          .insert({ family_id: familyId, ...input });
        if (error) throw error;
      },
      onSettled,
    }),
    edit: useMutation({
      mutationFn: ({ id, input }: { id: string; input: ContactInput }) =>
        updateContact(id, input),
      onSettled,
    }),
    reorder: useMutation({
      mutationFn: async (moves: { id: string; sort: number }[]) => {
        for (const move of moves)
          await updateContact(move.id, { sort: move.sort });
      },
      onSettled,
    }),
    remove: useMutation({
      mutationFn: async (id: string) => {
        const { data, error } = await supabase()
          .from("emergency_contacts")
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

// Owner only (spec §4.1: the baby profile).
export function useSaveMedicalInfo(babyId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      blood_type: string | null;
      allergies: string | null;
    }) => updateBaby(babyId, input),
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: ["family-context"] }),
  });
}
