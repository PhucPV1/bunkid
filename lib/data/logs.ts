"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { LogType } from "@/lib/rules/logDetails";
import {
  planTimerPress,
  type RunningLog,
  type TimerButton,
} from "@/lib/rules/timer";
import { supabase } from "@/lib/supabase/client";
import type { LogRow } from "@/lib/supabase/rows";
import type { Json } from "@/lib/supabase/types";

export const logsKey = (babyId: string) => ["logs", babyId] as const;

export async function fetchRecentLogs(
  babyId: string,
  now: Date = new Date(),
): Promise<LogRow[]> {
  const since = new Date(now.getTime() - 24 * 3_600_000).toISOString();
  const { data, error } = await supabase()
    .from("logs")
    .select("*")
    .eq("baby_id", babyId)
    .or(`started_at.gte.${since},ended_at.is.null`)
    .order("started_at", { ascending: false });
  if (error) throw error;
  return data;
}

export function useRecentLogs(babyId: string) {
  return useQuery({
    queryKey: logsKey(babyId),
    queryFn: () => fetchRecentLogs(babyId),
    refetchInterval: 30_000,
  });
}

export async function insertLog(row: {
  id: string;
  baby_id: string;
  type: LogType;
  started_at: string;
  ended_at: string | null;
  details: Record<string, unknown>;
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
