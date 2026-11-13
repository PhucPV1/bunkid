"use client";

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import type { Baby, Family, FamilyMember } from "@/lib/supabase/rows";

export type FamilyContext = {
  family: Family;
  member: FamilyMember;
  baby: Baby | null;
} | null;

export async function fetchFamilyContext(
  userId: string,
): Promise<FamilyContext> {
  const sb = supabase();
  const { data: families, error } = await sb.rpc("claim_membership");
  if (error) throw error;
  const family = families?.[0];
  if (!family) return null;

  const { data: member, error: memberError } = await sb
    .from("family_members")
    .select("*")
    .eq("family_id", family.id)
    .eq("user_id", userId)
    .single();
  if (memberError) throw memberError;

  const { data: babies, error: babyError } = await sb
    .from("babies")
    .select("*")
    .eq("family_id", family.id)
    .order("created_at")
    .limit(1);
  if (babyError) throw babyError;

  return { family, member, baby: babies[0] ?? null };
}

export function useFamilyContext(userId: string | undefined) {
  return useQuery({
    queryKey: ["family-context", userId],
    queryFn: () => fetchFamilyContext(userId as string),
    enabled: Boolean(userId),
    staleTime: 60_000,
  });
}

export function useMembers(familyId: string) {
  return useQuery({
    queryKey: ["members", familyId],
    queryFn: async (): Promise<FamilyMember[]> => {
      const { data, error } = await supabase()
        .from("family_members")
        .select("*")
        .eq("family_id", familyId)
        .order("created_at");
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60_000,
  });
}
