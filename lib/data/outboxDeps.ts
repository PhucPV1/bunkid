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

const UNSUPPORTED: SendOutcome = {
  ok: false,
  failure: { status: 400, code: null, message: "unsupported outbox entry" },
};

async function sendLog(entry: OutboxEntry): Promise<SendOutcome> {
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
    case "upsert":
      return UNSUPPORTED;
  }
}

const DOSE_CONFLICT = "baby_id,vaccine_code,dose_no";

// Spec §9: upsert on the natural key and never send id, so the update branch
// keeps the server's primary key.
async function sendDose(entry: OutboxEntry): Promise<SendOutcome> {
  const sb = supabase();
  const row = entry.row ?? {};
  const key = {
    baby_id: entry.babyId,
    vaccine_code: String(row.vaccine_code),
    dose_no: Number(row.dose_no),
  };
  const marks = {
    status: String(row.status),
    given_on: (row.given_on as string | null | undefined) ?? null,
    due_on_override: (row.due_on_override as string | null | undefined) ?? null,
    place: (row.place as string | null | undefined) ?? null,
    note: (row.note as string | null | undefined) ?? null,
  };
  switch (entry.op) {
    case "upsert": {
      const result = await sb
        .from("vaccine_doses")
        .upsert({ ...key, ...marks }, { onConflict: DOSE_CONFLICT })
        .select("id");
      if (result.error) return failed(result);
      return result.data.length > 0
        ? { ok: true }
        : { ok: false, failure: { zeroRows: true } };
    }
    case "insert": {
      // Quick tick: a dose someone already marked keeps its mark.
      const result = await sb
        .from("vaccine_doses")
        .upsert(
          { ...key, status: marks.status },
          { onConflict: DOSE_CONFLICT, ignoreDuplicates: true },
        );
      return result.error ? failed(result) : { ok: true };
    }
    case "delete": {
      const result = await sb
        .from("vaccine_doses")
        .delete()
        .eq("baby_id", key.baby_id)
        .eq("vaccine_code", key.vaccine_code)
        .eq("dose_no", key.dose_no)
        .select("id");
      if (result.error) return failed(result);
      if (result.data.length > 0) return { ok: true };
      // 0 rows: already cleared on another device counts as done.
      const check = await sb
        .from("vaccine_doses")
        .select("id")
        .eq("baby_id", key.baby_id)
        .eq("vaccine_code", key.vaccine_code)
        .eq("dose_no", key.dose_no);
      if (check.error) return failed(check);
      return check.data.length === 0
        ? { ok: true }
        : { ok: false, failure: { zeroRows: true } };
    }
    default:
      return UNSUPPORTED;
  }
}

type GrowthColumns = {
  measured_on?: string;
  weight_g?: number | null;
  length_cm?: number | null;
  head_cm?: number | null;
};

async function sendGrowth(entry: OutboxEntry): Promise<SendOutcome> {
  const sb = supabase();
  const row = (entry.row ?? {}) as GrowthColumns;
  switch (entry.op) {
    case "insert": {
      // ignoreDuplicates: a retry after a lost response must not overwrite the row.
      const result = await sb.from("growth").upsert(
        {
          id: entry.rowId,
          baby_id: entry.babyId,
          measured_on: String(row.measured_on),
          weight_g: row.weight_g ?? null,
          length_cm: row.length_cm ?? null,
          head_cm: row.head_cm ?? null,
        },
        { onConflict: "id", ignoreDuplicates: true },
      );
      return result.error ? failed(result) : { ok: true };
    }
    case "update": {
      const result = await sb
        .from("growth")
        .update(row)
        .eq("id", entry.rowId)
        .select("id");
      if (result.error) return failed(result);
      return result.data.length > 0
        ? { ok: true }
        : { ok: false, failure: { zeroRows: true } };
    }
    case "delete": {
      const result = await sb
        .from("growth")
        .delete()
        .eq("id", entry.rowId)
        .select("id");
      if (result.error) return failed(result);
      if (result.data.length > 0) return { ok: true };
      // 0 rows: gone already (another device deleted it) counts as done.
      const check = await sb.from("growth").select("id").eq("id", entry.rowId);
      if (check.error) return failed(check);
      return check.data.length === 0
        ? { ok: true }
        : { ok: false, failure: { zeroRows: true } };
    }
    default:
      return UNSUPPORTED;
  }
}

type EpisodeColumns = { started_at?: string; ended_at?: string | null };

// Spec 2026-11-26 §4.2. An overlap with another episode comes back as 23P01
// and is dropped with its own sentence (DROP_CODES).
async function sendEpisode(entry: OutboxEntry): Promise<SendOutcome> {
  const sb = supabase();
  const row = (entry.row ?? {}) as EpisodeColumns;
  switch (entry.op) {
    case "insert": {
      // ignoreDuplicates: a retry after a lost response must not overwrite the row.
      const result = await sb.from("illness_episodes").upsert(
        {
          id: entry.rowId,
          baby_id: entry.babyId,
          started_at: String(row.started_at),
          ended_at: row.ended_at ?? null,
        },
        { onConflict: "id", ignoreDuplicates: true },
      );
      return result.error ? failed(result) : { ok: true };
    }
    case "update": {
      const result = await sb
        .from("illness_episodes")
        .update(row)
        .eq("id", entry.rowId)
        .select("id");
      if (result.error) return failed(result);
      return result.data.length > 0
        ? { ok: true }
        : { ok: false, failure: { zeroRows: true } };
    }
    case "delete": {
      const result = await sb
        .from("illness_episodes")
        .delete()
        .eq("id", entry.rowId)
        .select("id");
      if (result.error) return failed(result);
      if (result.data.length > 0) return { ok: true };
      // 0 rows: gone already (another device deleted it) counts as done.
      const check = await sb
        .from("illness_episodes")
        .select("id")
        .eq("id", entry.rowId);
      if (check.error) return failed(check);
      return check.data.length === 0
        ? { ok: true }
        : { ok: false, failure: { zeroRows: true } };
    }
    default:
      return UNSUPPORTED;
  }
}

// Spec §9: upsert on (baby_id, milestone_code) without sending id.
async function sendMilestone(entry: OutboxEntry): Promise<SendOutcome> {
  const sb = supabase();
  const row = entry.row ?? {};
  const code = String(row.milestone_code);
  if (entry.op === "upsert") {
    const result = await sb
      .from("milestones_achieved")
      .upsert(
        {
          baby_id: entry.babyId,
          milestone_code: code,
          achieved_on: String(row.achieved_on),
          note: (row.note as string | null | undefined) ?? null,
          photo_id: (row.photo_id as string | null | undefined) ?? null,
        },
        { onConflict: "baby_id,milestone_code" },
      )
      .select("id");
    if (result.error) return failed(result);
    return result.data.length > 0
      ? { ok: true }
      : { ok: false, failure: { zeroRows: true } };
  }
  if (entry.op === "delete") {
    const result = await sb
      .from("milestones_achieved")
      .delete()
      .eq("baby_id", entry.babyId)
      .eq("milestone_code", code)
      .select("id");
    if (result.error) return failed(result);
    if (result.data.length > 0) return { ok: true };
    // 0 rows: already cleared on another device counts as done.
    const check = await sb
      .from("milestones_achieved")
      .select("id")
      .eq("baby_id", entry.babyId)
      .eq("milestone_code", code);
    if (check.error) return failed(check);
    return check.data.length === 0
      ? { ok: true }
      : { ok: false, failure: { zeroRows: true } };
  }
  return UNSUPPORTED;
}

function send(entry: OutboxEntry): Promise<SendOutcome> {
  if (entry.table === "milestones_achieved") return sendMilestone(entry);
  if (entry.table === "vaccine_doses") return sendDose(entry);
  if (entry.table === "growth") return sendGrowth(entry);
  if (entry.table === "illness_episodes") return sendEpisode(entry);
  return sendLog(entry);
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
