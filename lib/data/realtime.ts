"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import type { LogRow } from "@/lib/supabase/rows";
import { logsKey } from "./logs";

export function useLogsRealtime(babyId: string): void {
  const queryClient = useQueryClient();

  useEffect(() => {
    const sb = supabase();
    const invalidate = () => {
      void queryClient.invalidateQueries({ queryKey: logsKey(babyId) });
      void queryClient.invalidateQueries({ queryKey: ["first-log", babyId] });
    };
    const filter = `baby_id=eq.${babyId}`;
    const channel = sb
      // Unique topic per mount: re-adding callbacks to an already-subscribed topic throws.
      .channel(`logs:${babyId}:${crypto.randomUUID()}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "logs", filter },
        invalidate,
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "logs", filter },
        invalidate,
      )
      // DELETE events cannot be filtered by column; only react to rows we have on screen.
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "logs" },
        (payload) => {
          const id = (payload.old as { id?: string }).id;
          const cached = queryClient.getQueryData<LogRow[]>(logsKey(babyId));
          if (id && cached?.some((row) => row.id === id)) invalidate();
        },
      )
      .subscribe();
    return () => {
      void sb.removeChannel(channel);
    };
  }, [babyId, queryClient]);
}
