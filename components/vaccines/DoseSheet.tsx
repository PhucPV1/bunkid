"use client";

import { useState, type FormEvent } from "react";
import { OnlineOnly } from "@/components/OnlineOnly";
import { toVietnameseError } from "@/lib/data/errors";
import { useDoseActions } from "@/lib/data/vaccines";
import { vnDateString } from "@/lib/rules/time";
import {
  formatDueDate,
  parseDoseForm,
  type DoseAction,
  type DoseFormRaw,
} from "@/lib/rules/vaccineForm";
import type { ScheduleItem } from "@/lib/rules/vaccines";
import type { VaccineDoseRow } from "@/lib/supabase/rows";

const ACTIONS: { value: DoseAction; label: string }[] = [
  { value: "done", label: "Đã tiêm" },
  { value: "skipped", label: "Bỏ qua" },
  { value: "rescheduled", label: "Đổi ngày hẹn" },
];

export function DoseSheet({
  item,
  row,
  babyId,
  dob,
  onClose,
}: {
  item: ScheduleItem;
  row: VaccineDoseRow | null;
  babyId: string;
  dob: string;
  onClose: () => void;
}) {
  const actions = useDoseActions(babyId);
  const today = vnDateString(new Date());
  const ref = { code: item.dose.code, doseNo: item.dose.doseNo };
  const [raw, setRaw] = useState<DoseFormRaw>(() => {
    const action: DoseAction =
      row?.status === "skipped" || row?.status === "rescheduled"
        ? row.status
        : "done";
    return {
      action,
      date:
        action === "rescheduled"
          ? (row?.due_on_override ?? "")
          : (row?.given_on ?? today),
      place: row?.place ?? "",
      note: row?.note ?? "",
    };
  });
  const [message, setMessage] = useState<string | null>(null);
  const busy = actions.save.isPending || actions.clear.isPending;

  function set<K extends keyof DoseFormRaw>(key: K, value: DoseFormRaw[K]) {
    setRaw((prev) => ({ ...prev, [key]: value }));
    setMessage(null);
  }

  function chooseAction(action: DoseAction) {
    setRaw((prev) => ({
      ...prev,
      action,
      date:
        action === "done" ? today : action === "rescheduled" ? item.due : "",
      // The place field is only shown for "done"; never save a hidden value.
      place: action === "done" ? prev.place : "",
    }));
    setMessage(null);
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    const parsed = parseDoseForm(raw, { dob, today });
    if (!parsed.ok) {
      setMessage(parsed.message);
      return;
    }
    actions.save.mutate(
      { ref, patch: parsed.value },
      { onSuccess: onClose, onError: (e) => setMessage(toVietnameseError(e)) },
    );
  }

  function clear() {
    actions.clear.mutate(ref, {
      onSuccess: onClose,
      onError: (e) => setMessage(toVietnameseError(e)),
    });
  }

  const input = "min-h-11 rounded-xl border px-3";
  return (
    <div
      className="fixed inset-0 z-20 flex items-end bg-black/40"
      onClick={onClose}
    >
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[90dvh] w-full flex-col gap-3 overflow-y-auto rounded-t-3xl bg-surface p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))]"
      >
        <h2 className="text-xl font-semibold">{item.dose.name}</h2>
        <p className="text-muted">
          Phòng: {item.dose.protects.join(", ")}. Hẹn {formatDueDate(item.due)}.
        </p>
        <OnlineOnly>
          <div className="flex flex-col gap-3">
            <div role="radiogroup" className="flex gap-2">
              {ACTIONS.map((action) => (
                <label
                  key={action.value}
                  className="flex min-h-11 flex-1 items-center justify-center gap-1 rounded-xl border px-2 text-center has-[:checked]:border-accent has-[:checked]:bg-accent-soft"
                >
                  <input
                    type="radio"
                    name="dose-action"
                    className="sr-only"
                    checked={raw.action === action.value}
                    onChange={() => chooseAction(action.value)}
                  />
                  {action.label}
                </label>
              ))}
            </div>
            {raw.action !== "skipped" && (
              <label className="flex flex-col gap-1">
                {raw.action === "done" ? "Ngày tiêm" : "Ngày hẹn mới"}
                <input
                  type="date"
                  className={input}
                  min={raw.action === "done" ? dob : today}
                  max={raw.action === "done" ? today : undefined}
                  value={raw.date}
                  onChange={(e) => set("date", e.target.value)}
                />
              </label>
            )}
            {raw.action === "done" && (
              <label className="flex flex-col gap-1">
                Nơi tiêm (không bắt buộc)
                <input
                  className={input}
                  maxLength={120}
                  value={raw.place}
                  onChange={(e) => set("place", e.target.value)}
                />
              </label>
            )}
            <label className="flex flex-col gap-1">
              Ghi chú (không bắt buộc)
              <textarea
                className="min-h-20 rounded-xl border p-3"
                maxLength={500}
                value={raw.note}
                onChange={(e) => set("note", e.target.value)}
              />
            </label>
            <button
              type="submit"
              disabled={busy}
              className="min-h-12 rounded-2xl bg-accent text-on-accent disabled:opacity-50"
            >
              Lưu
            </button>
            {row && (
              <button
                type="button"
                disabled={busy}
                onClick={clear}
                className="min-h-11 rounded-2xl text-danger disabled:opacity-50"
              >
                Xóa đánh dấu
              </button>
            )}
          </div>
        </OnlineOnly>
        {message && (
          <p role="alert" className="text-danger">
            {message}
          </p>
        )}
        <button
          type="button"
          onClick={onClose}
          className="min-h-12 rounded-2xl border"
        >
          Đóng
        </button>
      </form>
    </div>
  );
}
