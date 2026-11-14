import type { BabyInput } from "@/lib/rules/babyInput";
import { supabase } from "@/lib/supabase/client";
import type { Baby } from "@/lib/supabase/rows";
import { PermissionDeniedError } from "./errors";

export async function createBaby(
  familyId: string,
  input: BabyInput,
): Promise<Baby> {
  const { data, error } = await supabase()
    .from("babies")
    .insert({ family_id: familyId, ...input })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateBaby(
  id: string,
  patch: Partial<BabyInput> & {
    feed_interval_min?: number;
    vaccine_choices?: Record<string, string>;
    blood_type?: string | null;
    allergies?: string | null;
  },
): Promise<void> {
  const { data, error } = await supabase()
    .from("babies")
    .update(patch)
    .eq("id", id)
    .select("id");
  if (error) throw error;
  if (data.length === 0) throw new PermissionDeniedError();
}
