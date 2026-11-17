"use client";

import { useState, type FormEvent } from "react";
import { FIELD_INPUT, FIELD_LABEL } from "@/components/quick/styles";
import { Button } from "@/components/ui/Button";
import { ErrorCard } from "@/components/ui/ErrorCard";
import { Icon } from "@/components/ui/Icon";
import { NeedsNetwork, waitingForNetwork } from "@/components/ui/NeedsNetwork";
import { Skeleton } from "@/components/ui/Skeleton";
import { Switch } from "@/components/ui/Switch";
import { toVietnameseError } from "@/lib/data/errors";
import {
  useMedicineSchedules,
  useScheduleActions,
} from "@/lib/data/medicineSchedules";
import {
  DEFAULT_REMIND_MIN,
  newScheduleError,
  scheduleRows,
  type ScheduleLike,
  type ScheduleRow,
} from "@/lib/rules/medicineSchedule";
import { minutesToTime, timeToMinutes } from "@/lib/rules/notifications";
import type { Baby } from "@/lib/supabase/rows";
import { cx } from "@/lib/ui/cx";

const INTRO =
  "Tới giờ mà hôm nay chưa ghi thuốc đó thì Kim Bun gửi một thông báo.";
const FOOTNOTE =
  "Lịch vừa bật hoặc vừa đổi sau giờ nhắc của hôm nay sẽ bắt đầu nhắc từ ngày mai.";

// Spec 2026-11-17 §4.2: every change is saved at once; there is no Lưu button.
export function MedicineScheduleView({
  rows,
  busy,
  onToggle,
  onTime,
  onRemove,
  onAdd,
}: {
  rows: ScheduleRow[];
  busy: boolean;
  onToggle: (row: ScheduleRow, enabled: boolean) => void;
  onTime: (schedule: ScheduleLike, minutes: number) => void;
  onRemove: (schedule: ScheduleLike) => void;
  // Returns why the name cannot be added, or null when it was accepted.
  onAdd: (name: string) => string | null;
}) {
  return (
    <div className="flex flex-col gap-3">
      <p className="px-1 text-[15px] leading-5 text-muted">{INTRO}</p>
      <ul className="glass overflow-hidden rounded-[22px]">
        {rows.map((row) => {
          const schedule = row.schedule;
          const on = schedule?.enabled ?? false;
          return (
            <li
              key={row.key}
              data-medicine={row.name}
              className="flex flex-wrap items-center gap-x-3 border-b border-line px-4 py-2 last:border-b-0"
            >
              <span
                className={cx(
                  "flex size-[30px] shrink-0 items-center justify-center rounded-[9px] text-bg",
                  on ? "bg-cat-med" : "bg-muted",
                )}
              >
                <Icon name="pill" size={17} strokeWidth={2.2} />
              </span>
              <span
                className={cx(
                  "min-w-0 flex-1 text-base font-semibold",
                  on ? "text-ink" : "text-muted",
                )}
              >
                {row.name}
              </span>
              {schedule && on && (
                <input
                  // Re-made when the saved time changes, so it always shows what is saved.
                  key={schedule.remind_at_min}
                  type="time"
                  aria-label={`Giờ nhắc ${row.name}`}
                  disabled={busy}
                  className={cx(
                    FIELD_INPUT,
                    "w-[112px] text-center tabular-nums",
                  )}
                  defaultValue={minutesToTime(schedule.remind_at_min)}
                  onChange={(event) => {
                    const minutes = timeToMinutes(event.target.value);
                    if (minutes !== null) onTime(schedule, minutes);
                  }}
                />
              )}
              <Switch
                checked={on}
                label={`Nhắc ${row.name}`}
                disabled={busy}
                onChange={(value) => onToggle(row, value)}
              />
              {schedule && !row.preset && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => onRemove(schedule)}
                  className="ml-[42px] min-h-11 basis-full text-left text-[15px] font-semibold text-danger disabled:opacity-50"
                >
                  Xóa
                </button>
              )}
            </li>
          );
        })}
      </ul>
      <p className="px-1 text-[13px] leading-[18px] text-muted">{FOOTNOTE}</p>
      <AddMedicineForm busy={busy} onAdd={onAdd} />
    </div>
  );
}

export function AddMedicineForm({
  busy,
  onAdd,
}: {
  busy: boolean;
  onAdd: (name: string) => string | null;
}) {
  const [name, setName] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  function submit(event: FormEvent) {
    event.preventDefault();
    const error = onAdd(name);
    setMessage(error);
    if (error === null) setName("");
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-2">
      <div className="flex items-end gap-2.5">
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <label htmlFor="medicine-name" className={cx(FIELD_LABEL, "px-1")}>
            Tên thuốc khác
          </label>
          <input
            id="medicine-name"
            type="text"
            maxLength={80}
            placeholder="Ví dụ: Canxi"
            className={FIELD_INPUT}
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              setMessage(null);
            }}
          />
        </div>
        <Button type="submit" variant="secondary" size="md" disabled={busy}>
          Thêm
        </Button>
      </div>
      {message && (
        <p role="alert" className="px-1 text-[15px] text-danger">
          {message}
        </p>
      )}
    </form>
  );
}

export function MedicineScheduleSection({ baby }: { baby: Baby }) {
  const schedules = useMedicineSchedules(baby.id);
  const actions = useScheduleActions(baby.id);
  const failed =
    actions.add.error ??
    actions.setEnabled.error ??
    actions.setTime.error ??
    actions.remove.error;

  if (waitingForNetwork(schedules))
    return <NeedsNetwork what="lịch nhắc thuốc" />;
  if (schedules.isPending)
    return (
      <div className="flex flex-col gap-2.5">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-[52px]" />
        ))}
      </div>
    );
  if (schedules.isError && !schedules.data)
    return (
      <ErrorCard
        message={toVietnameseError(schedules.error)}
        onRetry={() => void schedules.refetch()}
      />
    );

  const list = schedules.data ?? [];
  return (
    <>
      <MedicineScheduleView
        rows={scheduleRows(list)}
        busy={
          actions.add.isPending ||
          actions.setEnabled.isPending ||
          actions.setTime.isPending ||
          actions.remove.isPending
        }
        onToggle={(row, enabled) =>
          row.schedule
            ? actions.setEnabled.mutate({ id: row.schedule.id, enabled })
            : actions.add.mutate({
                name: row.name,
                remind_at_min: DEFAULT_REMIND_MIN,
              })
        }
        onTime={(schedule, minutes) =>
          actions.setTime.mutate({ id: schedule.id, remind_at_min: minutes })
        }
        onRemove={(schedule) => {
          if (window.confirm("Xóa nhắc thuốc này?"))
            actions.remove.mutate(schedule.id);
        }}
        onAdd={(name) => {
          const error = newScheduleError(name, list);
          if (error) return error;
          actions.add.mutate({
            name: name.trim(),
            remind_at_min: DEFAULT_REMIND_MIN,
          });
          return null;
        }}
      />
      {failed && (
        <p role="alert" className="px-1 text-[15px] text-danger">
          {toVietnameseError(failed)}
        </p>
      )}
    </>
  );
}
