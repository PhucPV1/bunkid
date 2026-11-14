"use client";

import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { historyPageRange, nextHistoryPage } from "@/lib/rules/history";
import type { LogType } from "@/lib/rules/logDetails";
import type { LogPatch } from "@/lib/rules/logForm";
import {
  planTimerPress,
  type RunningLog,
  type TimerButton,
} from "@/lib/rules/timer";
import { supabase } from "@/lib/supabase/client";
import type { LogRow } from "@/lib/supabase/rows";
import { enqueueLogChange, withPending } from "./outbox";

export const logsKey = (babyId: string) => ["logs", babyId] as const;

export async function fetchLogsSince(
  babyId: string,
  since: string,
): Promise<LogRow[]> {
  const { data, error } = await supabase()
    .from("logs")
    .select("*")
    .eq("baby_id", babyId)
    .or(`started_at.gte.${since},ended_at.is.null`)
    .order("started_at", { ascending: false });
  if (error) throw error;
  const from = Date.parse(since);
  return withPending(
    babyId,
    data,
    (row) => row.ended_at === null || Date.parse(row.started_at) >= from,
  );
}

export async function fetchRecentLogs(
  babyId: string,
  now: Date = new Date(),
  hours = 72,
): Promise<LogRow[]> {
  return fetchLogsSince(
    babyId,
    new Date(now.getTime() - hours * 3_600_000).toISOString(),
  );
}

export function useRecentLogs(babyId: string) {
  return useQuery({
    queryKey: logsKey(babyId),
    queryFn: () => fetchRecentLogs(babyId),
    refetchInterval: 30_000,
  });
}

export async function fetchFirstLogAt(babyId: string): Promise<string | null> {
  const { data, error } = await supabase()
    .from("logs")
    .select("started_at")
    .eq("baby_id", babyId)
    .order("started_at", { ascending: true })
    .limit(1);
  if (error) throw error;
  return data[0]?.started_at ?? null;
}

export function useFirstLogAt(babyId: string) {
  return useQuery({
    queryKey: ["first-log", babyId],
    queryFn: () => fetchFirstLogAt(babyId),
    staleTime: 10 * 60_000,
  });
}

export function toRunning(rows: LogRow[]): RunningLog[] {
  return rows
    .filter((row) => row.ended_at === null)
    .map((row) => ({
      id: row.id,
      type: row.type as LogType,
      details: (row.details ?? {}) as Record<string, unknown>,
    }));
}

// Every write goes through the outbox (spec §9): saved on the device first,
// shown at once, sent to Supabase by the outbox runner when online.
// networkMode "always" lets these run offline.
export function useTimerPress(babyId: string, userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    networkMode: "always",
    mutationFn: async ({
      running,
      button,
    }: {
      running: RunningLog[];
      button: TimerButton;
    }) => {
      const now = new Date().toISOString();
      for (const action of planTimerPress(running, button)) {
        if (action.kind === "stop")
          await enqueueLogChange(queryClient, {
            op: "stop",
            rowId: action.id,
            babyId,
            userId,
            row: { ended_at: now },
          });
        else
          await enqueueLogChange(queryClient, {
            op: "insert",
            rowId: crypto.randomUUID(),
            babyId,
            userId,
            row: {
              type: action.type,
              started_at: now,
              ended_at: null,
              details: action.details,
            },
          });
      }
    },
  });
}

export function useStopTimer(babyId: string, userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    networkMode: "always",
    mutationFn: (id: string) =>
      enqueueLogChange(queryClient, {
        op: "stop",
        rowId: id,
        babyId,
        userId,
        row: { ended_at: new Date().toISOString() },
      }),
  });
}

export function useAddInstant(babyId: string, userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    networkMode: "always",
    // Resolves to the new row's id so the Undo toast can delete exactly that row.
    mutationFn: async ({
      type,
      details,
      at,
    }: {
      type: LogType;
      details: Record<string, unknown>;
      at: Date;
    }): Promise<string> => {
      const iso = at.toISOString();
      const rowId = crypto.randomUUID();
      await enqueueLogChange(queryClient, {
        op: "insert",
        rowId,
        babyId,
        userId,
        row: { type, started_at: iso, ended_at: iso, details },
      });
      return rowId;
    },
  });
}

export async function fetchHistoryPage(
  babyId: string,
  page: number,
  now: Date,
): Promise<LogRow[]> {
  const range = historyPageRange(now, page);
  const { data, error } = await supabase()
    .from("logs")
    .select("*")
    .eq("baby_id", babyId)
    .gte("started_at", range.from)
    .lt("started_at", range.to)
    .order("started_at", { ascending: false });
  if (error) throw error;
  const from = Date.parse(range.from);
  const to = Date.parse(range.to);
  return withPending(babyId, data, (row) => {
    const at = Date.parse(row.started_at);
    return at >= from && at < to;
  });
}

export function useHistoryLogs(babyId: string, dob: string) {
  return useInfiniteQuery({
    queryKey: [...logsKey(babyId), "history"],
    initialPageParam: 0,
    queryFn: ({ pageParam }) => fetchHistoryPage(babyId, pageParam, new Date()),
    getNextPageParam: (_last, pages) =>
      nextHistoryPage(dob, new Date(), pages.length),
  });
}

export function useStatsLogs(babyId: string, since: string) {
  return useQuery({
    queryKey: [...logsKey(babyId), "stats", since],
    queryFn: () => fetchLogsSince(babyId, since),
  });
}

export function useSaveLog(babyId: string, userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    networkMode: "always",
    mutationFn: ({
      id,
      type,
      patch,
    }: {
      id: string | null;
      type: LogType;
      patch: LogPatch;
    }) =>
      enqueueLogChange(
        queryClient,
        id
          ? { op: "update", rowId: id, babyId, userId, row: patch }
          : {
              op: "insert",
              rowId: crypto.randomUUID(),
              babyId,
              userId,
              row: { type, ...patch },
            },
      ),
  });
}

export function useDeleteLog(babyId: string, userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    networkMode: "always",
    mutationFn: (id: string) =>
      enqueueLogChange(queryClient, {
        op: "delete",
        rowId: id,
        babyId,
        userId,
        row: null,
      }),
  });
}

// Spec §6.13: ml per side, asked after a pumping timer has been stopped.
export function useSetPumpAmounts(babyId: string, userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    networkMode: "always",
    mutationFn: ({
      id,
      details,
    }: {
      id: string;
      details: { mlLeft?: number; mlRight?: number };
    }) =>
      enqueueLogChange(queryClient, {
        op: "update",
        rowId: id,
        babyId,
        userId,
        row: { details },
      }),
  });
}
