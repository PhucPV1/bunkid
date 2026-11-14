import type { PushSubscriptionDeps } from "./pushSubscriptions";
import { supabaseForUser, supabaseServiceRole } from "./supabaseServer";

export function supabasePushSubscriptionDeps(): PushSubscriptionDeps {
  return {
    async userIdForToken(token) {
      // The anon-key client is enough to check a token; the service role is
      // kept for the one write that needs it (spec §3.1).
      const { data, error } = await supabaseForUser(token).auth.getUser(token);
      return error ? null : (data.user?.id ?? null);
    },
    async upsertSubscription(row) {
      const { error } = await supabaseServiceRole()
        .from("push_subscriptions")
        .upsert(row, { onConflict: "endpoint" });
      if (error) throw error;
    },
    async deleteOwnSubscription(token, endpoint) {
      // The user's own token: RLS only lets them delete their own row.
      const { error } = await supabaseForUser(token)
        .from("push_subscriptions")
        .delete()
        .eq("endpoint", endpoint);
      if (error) throw error;
    },
  };
}
