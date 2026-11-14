"use client";

import { supabase } from "@/lib/supabase/client";
import type { Json } from "@/lib/supabase/types";
import { localDb } from "./localDb";
import type { Failure, OutboxEntry } from "./outboxCore";
import { droppedWrites } from "./outboxEvents";
import type { FlushDeps, SendOutcome } from "./outboxFlush";

type Result = {
  error: { code?: string; message: string } | null;
  status: number;
};

function failed(result: Result): SendOutcome {
  return {
    ok: false,
    failure: {
      status: result.status,
      code: result.error?.code ?? null,
      message: result.error?.message ?? "",
    } satisfies Failure,
  };
}

async function send(entry: OutboxEntry): Promise<SendOutcome> {
  const sb = supabase();
  const row = entry.row ?? {};
  switch (entry.op) {
    case "insert": {
      // ignoreDuplicates: a retry after a lost response must not overwrite the row.
      const result = await sb.from("logs").upsert(
        {
          id: entry.rowId,
          baby_id: entry.babyId,
          type: String(row.type),
          started_at: String(row.started_at),
          ended_at: (row.ended_at as string | null | undefined) ?? null,
          details: (row.details ?? {}) as NonNullable<Json>,
          note: (row.note as string | null | undefined) ?? null,
        },
        { onConflict: "id", ignoreDuplicates: true },
      );
      return result.error ? failed(result) : { ok: true };
    }
    case "update": {
      const result = await sb
        .from("logs")
        .update(row as { details?: NonNullable<Json> })
        .eq("id", entry.rowId)
        .select("id");
      if (result.error) return failed(result);
      return result.data.length > 0
        ? { ok: true }
        : { ok: false, failure: { zeroRows: true } };
    }
    case "delete": {
      const result = await sb
        .from("logs")
        .delete()
        .eq("id", entry.rowId)
        .select("id");
      if (result.error) return failed(result);
      if (result.data.length > 0) return { ok: true };
      // 0 rows: gone already (another device deleted it) counts as done.
      const check = await sb.from("logs").select("id").eq("id", entry.rowId);
      if (check.error) return failed(check);
      return check.data.length === 0
        ? { ok: true }
        : { ok: false, failure: { zeroRows: true } };
    }
    case "stop": {
      const result = await sb.rpc("stop_timer", {
        p_log_id: entry.rowId,
        p_ended_at: String(row.ended_at),
      });
      return result.error ? failed(result) : { ok: true };
    }
  }
}

export function outboxDeps(): FlushDeps {
  return {
    async currentUserId() {
      const { data } = await supabase().auth.getSession();
      return data.session?.user.id ?? null;
    },
    pending: (userId) =>
      localDb().outbox.where("userId").equals(userId).sortBy("createdAt"),
    send,
    async remove(id) {
      await localDb().outbox.delete(id);
    },
    async bumpAttempts(id) {
      await localDb()
        .outbox.where("id")
        .equals(id)
        .modify((entry) => {
          entry.attempts += 1;
        });
    },
    async refreshSession() {
      const { error } = await supabase().auth.refreshSession();
      return !error;
    },
    onDropped: (entry, reason) => {
      console.warn(
        "Bỏ một thao tác chờ đồng bộ",
        entry.op,
        entry.rowId,
        reason,
      );
      droppedWrites.emit(reason);
    },
    onSignedOut: () => window.location.assign("/dang-nhap"),
  };
}
