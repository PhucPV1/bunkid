"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { updateBaby } from "@/lib/data/baby";
import { toVietnameseError } from "@/lib/data/errors";
import {
  FEED_INTERVAL_OPTIONS,
  formatInterval,
} from "@/lib/rules/familySettings";
import type { Baby } from "@/lib/supabase/rows";

export function FeedIntervalSection({
  baby,
  isOwner,
}: {
  baby: Baby;
  isOwner: boolean;
}) {
  const queryClient = useQueryClient();
  const [minutes, setMinutes] = useState(baby.feed_interval_min);
  const save = useMutation({
    mutationFn: () => updateBaby(baby.id, { feed_interval_min: minutes }),
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: ["family-context"] }),
  });

  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-lg font-medium">Khoảng cách cữ bú</h2>
      <p className="text-muted">
        Dùng để tính "Cữ bú tiếp theo khoảng …" ở trang chủ.
      </p>
      {isOwner ? (
        <div className="flex gap-3">
          <select
            aria-label="Khoảng cách cữ bú"
            className="min-h-11 flex-1 rounded-xl border px-3"
            value={minutes}
            onChange={(e) => {
              setMinutes(Number(e.target.value));
              save.reset();
            }}
          >
            {FEED_INTERVAL_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {formatInterval(option)}
              </option>
            ))}
          </select>
          <button
            type="button"
            disabled={save.isPending || minutes === baby.feed_interval_min}
            onClick={() => save.mutate()}
            className="min-h-11 rounded-xl bg-accent px-4 text-on-accent disabled:opacity-50"
          >
            Lưu
          </button>
        </div>
      ) : (
        <p>{formatInterval(baby.feed_interval_min)}</p>
      )}
      {save.isSuccess && (
        <p role="status" className="text-good-ink">
          Đã lưu.
        </p>
      )}
      {save.isError && (
        <p role="alert" className="text-danger">
          {toVietnameseError(save.error)}
        </p>
      )}
    </section>
  );
}
