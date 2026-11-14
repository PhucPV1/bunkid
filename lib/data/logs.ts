"use client";

import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
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
import type { Json } from "@/lib/supabase/types";
import { PermissionDeniedError } from "./errors";

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
  return data;
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

export async function insertLog(row: {
  id: string;
  baby_id: string;
  type: LogType;
  started_at: string;
  ended_at: string | null;
  details: Record<string, unknown>;
  note?: string | null;
}): Promise<void> {
  const { error } = await supabase()
    .from("logs")
    .insert({ ...row, details: row.details as NonNullable<Json> });
  if (error) throw error;
}

export async function stopTimer(id: string, endedAt: string): Promise<void> {
  const { error } = await supabase().rpc("stop_timer", {
    p_log_id: id,
    p_ended_at: endedAt,
  });
  if (error) throw error;
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

export function useTimerPress(babyId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      running,
      button,
    }: {
      running: RunningLog[];
      button: TimerButton;
    }) => {
      const now = new Date().toISOString();
      for (const action of planTimerPress(running, button)) {
        if (action.kind === "stop") await stopTimer(action.id, now);
        else
          await insertLog({
            id: crypto.randomUUID(),
            baby_id: babyId,
            type: action.type,
            started_at: now,
            ended_at: null,
            details: action.details,
          });
      }
    },
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: logsKey(babyId) }),
  });
}

export function useStopTimer(babyId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => stopTimer(id, new Date().toISOString()),
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: logsKey(babyId) }),
  });
}

export function useAddInstant(babyId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      type,
      details,
      at,
    }: {
      type: LogType;
      details: Record<string, unknown>;
      at: Date;
    }) => {
      const iso = at.toISOString();
      return insertLog({
        id: crypto.randomUUID(),
        baby_id: babyId,
        type,
        started_at: iso,
        ended_at: iso,
        details,
      });
    },
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: logsKey(babyId) }),
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
  return data;
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

export async function updateLog(id: string, patch: LogPatch): Promise<void> {
  const { data, error } = await supabase()
    .from("logs")
    .update({ ...patch, details: patch.details as NonNullable<Json> })
    .eq("id", id)
    .select("id");
  if (error) throw error;
  if (data.length === 0) throw new PermissionDeniedError();
}

export async function deleteLog(id: string): Promise<void> {
  const sb = supabase();
  const { data, error } = await sb
    .from("logs")
    .delete()
    .eq("id", id)
    .select("id");
  if (error) throw error;
  if (data.length > 0) return;
  // 0 rows: either another device already deleted it, or RLS refused.
  const { data: left, error: checkError } = await sb
    .from("logs")
    .select("id")
    .eq("id", id);
  if (checkError) throw checkError;
  if (left.length > 0) throw new PermissionDeniedError();
}

function invalidateLogs(queryClient: QueryClient, babyId: string) {
  void queryClient.invalidateQueries({ queryKey: logsKey(babyId) });
  void queryClient.invalidateQueries({ queryKey: ["first-log", babyId] });
}

export function useSaveLog(babyId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      type,
      patch,
    }: {
      id: string | null;
      type: LogType;
      patch: LogPatch;
    }) =>
      id
        ? updateLog(id, patch)
        : insertLog({
            id: crypto.randomUUID(),
            baby_id: babyId,
            type,
            ...patch,
          }),
    onSettled: () => invalidateLogs(queryClient, babyId),
  });
}

export function useDeleteLog(babyId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteLog,
    onSettled: () => invalidateLogs(queryClient, babyId),
  });
}
