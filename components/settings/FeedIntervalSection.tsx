"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { FIELD_INPUT, FIELD_LABEL } from "@/components/quick/styles";
import { Button } from "@/components/ui/Button";
import { Glass } from "@/components/ui/Glass";
import { ListGroup, ListRow } from "@/components/ui/ListGroup";
import { updateBaby } from "@/lib/data/baby";
import { toVietnameseError } from "@/lib/data/errors";
import {
  FEED_INTERVAL_OPTIONS,
  formatInterval,
} from "@/lib/rules/familySettings";
import type { Baby } from "@/lib/supabase/rows";

const HINT = 'Dùng để tính "Cữ bú tiếp theo khoảng …" ở trang chủ.';

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
    <div className="flex flex-col gap-3">
      {isOwner ? (
        <Glass className="flex flex-col gap-3 p-4">
          <label className="flex flex-col gap-1.5">
            <span className={FIELD_LABEL}>Khoảng cách cữ bú</span>
            <select
              className={`${FIELD_INPUT} tabular-nums accent-accent`}
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
          </label>
          <p className="text-[13px] text-muted">{HINT}</p>
          <Button
            size="lg"
            block
            busy={save.isPending}
            disabled={minutes === baby.feed_interval_min}
            onClick={() => save.mutate()}
          >
            Lưu
          </Button>
        </Glass>
      ) : (
        <>
          <ListGroup>
            <ListRow
              icon="clock"
              iconColor="cat-feed"
              label="Khoảng cách cữ bú"
              value={formatInterval(baby.feed_interval_min)}
            />
          </ListGroup>
          <p className="px-4 text-[13px] text-muted">{HINT}</p>
        </>
      )}
      {save.isSuccess && (
        <p role="status" className="px-1 text-[15px] text-good-ink">
          Đã lưu.
        </p>
      )}
      {save.isError && (
        <p role="alert" className="px-1 text-[15px] text-danger">
          {toVietnameseError(save.error)}
        </p>
      )}
    </div>
  );
}
