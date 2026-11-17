"use client";

import { useId, useState, type FormEvent } from "react";
import { FIELD_INPUT, FIELD_LABEL } from "@/components/quick/styles";
import { Button } from "@/components/ui/Button";
import { Segmented } from "@/components/ui/Segmented";
import { Sheet } from "@/components/ui/Sheet";
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
  userId,
  dob,
  onClose,
}: {
  item: ScheduleItem;
  row: VaccineDoseRow | null;
  babyId: string;
  userId: string;
  dob: string;
  onClose: () => void;
}) {
  const actions = useDoseActions(babyId, userId);
  const formId = useId();
  const today = vnDateString(new Date());
  const ref = { code: item.dose.code, doseNo: item.dose.doseNo };
  const [opened] = useState<DoseFormRaw>(() => {
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
  const [raw, setRaw] = useState<DoseFormRaw>(opened);
  const [message, setMessage] = useState<string | null>(null);
  const saving = actions.save.isPending;
  const clearing = actions.clear.isPending;

  function set<K extends keyof DoseFormRaw>(key: K, value: DoseFormRaw[K]) {
    setRaw((prev) => ({ ...prev, [key]: value }));
    setMessage(null);
  }

  function chooseAction(action: DoseAction) {
    // Segmented fires on every tap; the old radios only fired on a real change.
    // Tapping the option already chosen keeps the date and place as they are.
    if (action === raw.action) return;
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
      {
        onSuccess: onClose,
        onError: (error) => setMessage(toVietnameseError(error)),
      },
    );
  }

  function clear() {
    // It sits right under Lưu and removes the date, place and note in one tap.
    if (!window.confirm("Xóa đánh dấu mũi tiêm này?")) return;
    actions.clear.mutate(ref, {
      onSuccess: onClose,
      onError: (error) => setMessage(toVietnameseError(error)),
    });
  }

  return (
    <Sheet
      open
      onClose={onClose}
      title={item.dose.name}
      dirty={JSON.stringify(raw) !== JSON.stringify(opened)}
      footer={
        <div className="flex flex-col gap-2">
          {message && (
            <p role="alert" className="text-[15px] text-danger">
              {message}
            </p>
          )}
          <Button
            type="submit"
            form={formId}
            block
            busy={saving}
            disabled={clearing}
            className="min-h-14!"
          >
            Lưu
          </Button>
          {row && (
            <Button
              variant="ghost"
              block
              disabled={saving || clearing}
              className="text-danger!"
              onClick={clear}
            >
              Xóa đánh dấu
            </Button>
          )}
        </div>
      }
    >
      <form id={formId} onSubmit={submit} className="flex flex-col gap-4 pt-1">
        <p className="text-[15px] text-muted">
          Phòng: {item.dose.protects.join(", ")}. Hẹn {formatDueDate(item.due)}.
        </p>
        <Segmented
          label="Trạng thái mũi tiêm"
          options={ACTIONS}
          value={raw.action}
          onChange={chooseAction}
        />
        {raw.action !== "skipped" && (
          <label className="flex flex-col gap-1.5">
            <span className={FIELD_LABEL}>
              {raw.action === "done" ? "Ngày tiêm" : "Ngày hẹn mới"}
            </span>
            <input
              type="date"
              className={FIELD_INPUT}
              min={raw.action === "done" ? dob : today}
              max={raw.action === "done" ? today : undefined}
              value={raw.date}
              onChange={(event) => set("date", event.target.value)}
            />
          </label>
        )}
        {raw.action === "done" && (
          <label className="flex flex-col gap-1.5">
            <span className={FIELD_LABEL}>Nơi tiêm (không bắt buộc)</span>
            <input
              className={FIELD_INPUT}
              maxLength={120}
              value={raw.place}
              onChange={(event) => set("place", event.target.value)}
            />
          </label>
        )}
        <label className="flex flex-col gap-1.5">
          <span className={FIELD_LABEL}>Ghi chú (không bắt buộc)</span>
          <textarea
            className={`${FIELD_INPUT} min-h-20 py-2.5`}
            maxLength={500}
            value={raw.note}
            onChange={(event) => set("note", event.target.value)}
          />
        </label>
      </form>
    </Sheet>
  );
}
