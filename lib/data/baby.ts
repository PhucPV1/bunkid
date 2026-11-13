import type { BabyInput } from "@/lib/rules/babyInput";
import { supabase } from "@/lib/supabase/client";
import type { Baby } from "@/lib/supabase/rows";

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
