"use client";

import type { QueryClient } from "@tanstack/react-query";
import type {
  EpisodeRow,
  GrowthRow,
  LogRow,
  MilestoneRow,
  VaccineDoseRow,
} from "@/lib/supabase/rows";
import { localDb } from "./localDb";
import {
  applyDoseChange,
  applyEpisodeChange,
  applyGrowthChange,
  applyMilestoneChange,
  applyToCache,
  overlayPending,
  overlayPendingDoses,
  overlayPendingEpisodes,
  overlayPendingGrowth,
  overlayPendingMilestones,
  type OutboxEntry,
} from "./outboxCore";
import { flushRequests } from "./outboxEvents";

export type LogChange = Pick<
  OutboxEntry,
  "op" | "rowId" | "babyId" | "userId" | "row"
>;

let lastCreatedAt = 0;

// Strictly increasing, so a stop and a start queued in the same millisecond keep
// their order; seeded from the outbox so a clock that moved back after a reload
// cannot sort a new entry before older ones.
async function nextCreatedAt(): Promise<number> {
  const newest = await localDb().outbox.orderBy("createdAt").last();
  lastCreatedAt = Math.max(
    Date.now(),
    lastCreatedAt + 1,
    (newest?.createdAt ?? 0) + 1,
  );
  return lastCreatedAt;
}

export async function enqueueLogChange(
  queryClient: QueryClient,
  change: LogChange,
): Promise<void> {
  const entry: OutboxEntry = {
    ...change,
    id: crypto.randomUUID(),
    table: "logs",
    createdAt: await nextCreatedAt(),
    attempts: 0,
  };
  await localDb().outbox.add(entry);
  // A refetch already in flight would overwrite the optimistic change below.
  await queryClient.cancelQueries({ queryKey: ["logs", change.babyId] });
  const nowIso = new Date().toISOString();
  queryClient.setQueriesData({ queryKey: ["logs", change.babyId] }, (data) =>
    applyToCache(data, entry, nowIso),
  );
  flushRequests.emit();
}

export async function withPending(
  babyId: string,
  rows: LogRow[],
  inRange: (row: LogRow) => boolean,
): Promise<LogRow[]> {
  try {
    const entries = await localDb()
      .outbox.where("babyId")
      .equals(babyId)
      .toArray();
    return overlayPending(rows, entries, inRange, new Date().toISOString());
  } catch {
    return rows;
  }
}

export type DoseChange = Pick<OutboxEntry, "babyId" | "userId"> & {
  op: "upsert" | "insert" | "delete";
  code: string;
  doseNo: number;
  marks?: Record<string, unknown>;
};

export const vaccineDosesKey = (babyId: string) =>
  ["vaccine-doses", babyId] as const;

export async function enqueueDoseChange(
  queryClient: QueryClient,
  change: DoseChange,
): Promise<void> {
  const entry: OutboxEntry = {
    id: crypto.randomUUID(),
    table: "vaccine_doses",
    op: change.op,
    rowId: `${change.code}#${change.doseNo}`,
    babyId: change.babyId,
    userId: change.userId,
    row: { vaccine_code: change.code, dose_no: change.doseNo, ...change.marks },
    createdAt: await nextCreatedAt(),
    attempts: 0,
  };
  await localDb().outbox.add(entry);
  const key = vaccineDosesKey(change.babyId);
  await queryClient.cancelQueries({ queryKey: key });
  const nowIso = new Date().toISOString();
  queryClient.setQueryData<VaccineDoseRow[]>(key, (rows) =>
    rows ? applyDoseChange(rows, entry, nowIso) : rows,
  );
  flushRequests.emit();
}

export async function withPendingDoses(
  babyId: string,
  rows: VaccineDoseRow[],
): Promise<VaccineDoseRow[]> {
  try {
    const entries = await localDb()
      .outbox.where("babyId")
      .equals(babyId)
      .toArray();
    return overlayPendingDoses(rows, entries, new Date().toISOString());
  } catch {
    return rows;
  }
}

export type GrowthChange = Pick<
  OutboxEntry,
  "rowId" | "babyId" | "userId" | "row"
> & { op: "insert" | "update" | "delete" };

export const growthKey = (babyId: string) => ["growth", babyId] as const;

export async function enqueueGrowthChange(
  queryClient: QueryClient,
  change: GrowthChange,
): Promise<void> {
  const entry: OutboxEntry = {
    ...change,
    id: crypto.randomUUID(),
    table: "growth",
    createdAt: await nextCreatedAt(),
    attempts: 0,
  };
  await localDb().outbox.add(entry);
  const key = growthKey(change.babyId);
  await queryClient.cancelQueries({ queryKey: key });
  const nowIso = new Date().toISOString();
  queryClient.setQueryData<GrowthRow[]>(key, (rows) =>
    rows ? applyGrowthChange(rows, entry, nowIso) : rows,
  );
  flushRequests.emit();
}

export async function withPendingGrowth(
  babyId: string,
  rows: GrowthRow[],
): Promise<GrowthRow[]> {
  try {
    const entries = await localDb()
      .outbox.where("babyId")
      .equals(babyId)
      .toArray();
    return overlayPendingGrowth(rows, entries, new Date().toISOString());
  } catch {
    return rows;
  }
}

export type MilestoneChange = Pick<OutboxEntry, "babyId" | "userId"> & {
  op: "upsert" | "delete";
  code: string;
  marks?: { achieved_on: string; note: string | null; photo_id: string | null };
};

export const milestonesKey = (babyId: string) =>
  ["milestones", babyId] as const;

export async function enqueueMilestoneChange(
  queryClient: QueryClient,
  change: MilestoneChange,
): Promise<void> {
  const entry: OutboxEntry = {
    id: crypto.randomUUID(),
    table: "milestones_achieved",
    op: change.op,
    rowId: change.code,
    babyId: change.babyId,
    userId: change.userId,
    row: { milestone_code: change.code, ...change.marks },
    createdAt: await nextCreatedAt(),
    attempts: 0,
  };
  await localDb().outbox.add(entry);
  const key = milestonesKey(change.babyId);
  await queryClient.cancelQueries({ queryKey: key });
  const nowIso = new Date().toISOString();
  queryClient.setQueryData<MilestoneRow[]>(key, (rows) =>
    rows ? applyMilestoneChange(rows, entry, nowIso) : rows,
  );
  flushRequests.emit();
}

export async function withPendingMilestones(
  babyId: string,
  rows: MilestoneRow[],
): Promise<MilestoneRow[]> {
  try {
    const entries = await localDb()
      .outbox.where("babyId")
      .equals(babyId)
      .toArray();
    return overlayPendingMilestones(rows, entries, new Date().toISOString());
  } catch {
    return rows;
  }
}

// The caches refreshed after a flush that sent or dropped something: fresh
// server rows take the place of the optimistic ones. This is also what rolls
// back a change the server refused (spec §9) and drops temporary rows.
export const REFRESH_AFTER_FLUSH = [
  ["logs"],
  ["first-log"],
  ["vaccine-doses"],
  ["growth"],
  ["milestones"],
  ["illness-episodes"],
] as const;

// Spec 2026-11-26 §4.2: illness episodes, by row id like growth.
export type EpisodeChange = Pick<
  OutboxEntry,
  "rowId" | "babyId" | "userId" | "row"
> & { op: "insert" | "update" | "delete" };

export const episodesKey = (babyId: string) =>
  ["illness-episodes", babyId] as const;

export async function enqueueEpisodeChange(
  queryClient: QueryClient,
  change: EpisodeChange,
): Promise<void> {
  const entry: OutboxEntry = {
    ...change,
    id: crypto.randomUUID(),
    table: "illness_episodes",
    createdAt: await nextCreatedAt(),
    attempts: 0,
  };
  await localDb().outbox.add(entry);
  const key = episodesKey(change.babyId);
  await queryClient.cancelQueries({ queryKey: key });
  const nowIso = new Date().toISOString();
  queryClient.setQueryData<EpisodeRow[]>(key, (rows) =>
    rows ? applyEpisodeChange(rows, entry, nowIso) : rows,
  );
  flushRequests.emit();
}

export async function withPendingEpisodes(
  babyId: string,
  rows: EpisodeRow[],
): Promise<EpisodeRow[]> {
  try {
    const entries = await localDb()
      .outbox.where("babyId")
      .equals(babyId)
      .toArray();
    return overlayPendingEpisodes(rows, entries, new Date().toISOString());
  } catch {
    return rows;
  }
}
