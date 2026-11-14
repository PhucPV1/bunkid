"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";
import type { MemberInput, Role } from "@/lib/rules/familySettings";
import { supabase } from "@/lib/supabase/client";
import type { Baby, Family, FamilyMember } from "@/lib/supabase/rows";
import { PermissionDeniedError } from "./errors";

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

export async function addMember(
  familyId: string,
  input: MemberInput,
): Promise<void> {
  const { error } = await supabase()
    .from("family_members")
    .insert({ family_id: familyId, ...input });
  if (error) throw error;
}

export async function setMemberRole(id: string, role: Role): Promise<void> {
  const { data, error } = await supabase()
    .from("family_members")
    .update({ role })
    .eq("id", id)
    .select("id");
  if (error) throw error;
  if (data.length === 0) throw new PermissionDeniedError();
}

export async function removeMember(id: string): Promise<void> {
  const { data, error } = await supabase()
    .from("family_members")
    .delete()
    .eq("id", id)
    .select("id");
  if (error) throw error;
  if (data.length === 0) throw new PermissionDeniedError();
}

function invalidateFamily(queryClient: QueryClient, familyId: string) {
  void queryClient.invalidateQueries({ queryKey: ["members", familyId] });
  void queryClient.invalidateQueries({ queryKey: ["family-context"] });
}

export function useMemberActions(familyId: string) {
  const queryClient = useQueryClient();
  const onSettled = () => invalidateFamily(queryClient, familyId);
  return {
    add: useMutation({
      mutationFn: (input: MemberInput) => addMember(familyId, input),
      onSettled,
    }),
    setRole: useMutation({
      mutationFn: ({ id, role }: { id: string; role: Role }) =>
        setMemberRole(id, role),
      onSettled,
    }),
    remove: useMutation({ mutationFn: removeMember, onSettled }),
  };
}
