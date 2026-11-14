"use client";

import { useState, type FormEvent } from "react";
import { toVietnameseError } from "@/lib/data/errors";
import { useGrowthActions } from "@/lib/data/growth";
import {
  growthToRaw,
  parseGrowthForm,
  type GrowthFormRaw,
} from "@/lib/rules/growthForm";
import { vnDateString } from "@/lib/rules/time";
import type { GrowthRow } from "@/lib/supabase/rows";

const FIELDS: {
  key: Exclude<keyof GrowthFormRaw, "measuredOn">;
  label: string;
}[] = [
  { key: "weightKg", label: "Cân nặng (kg, ví dụ 5,2)" },
  { key: "lengthCm", label: "Chiều dài (cm)" },
  { key: "headCm", label: "Vòng đầu (cm)" },
];

export function GrowthSheet({
  babyId,
  userId,
  dob,
  row,
  canDelete,
  onClose,
}: {
  babyId: string;
  userId: string;
  dob: string;
  row: GrowthRow | null;
  canDelete: boolean;
  onClose: () => void;
}) {
  const actions = useGrowthActions(babyId, userId);
  const today = vnDateString(new Date());
  const [raw, setRaw] = useState<GrowthFormRaw>(() =>
    row
      ? growthToRaw(row)
      : { measuredOn: today, weightKg: "", lengthCm: "", headCm: "" },
  );
  const [errors, setErrors] = useState<
    Partial<Record<keyof GrowthFormRaw, string>>
  >({});
  const [message, setMessage] = useState<string | null>(null);
  const done = {
    onSuccess: onClose,
    onError: (e: unknown) => setMessage(toVietnameseError(e)),
  };

  function submit(event: FormEvent) {
    event.preventDefault();
    const parsed = parseGrowthForm(raw, { dob, today });
    if (!parsed.ok) {
      setErrors(parsed.errors);
      return;
    }
    setErrors({});
    if (row) actions.update.mutate({ id: row.id, input: parsed.value }, done);
    else actions.add.mutate(parsed.value, done);
  }

  const input = "min-h-11 rounded-xl border px-3";
  const error = (key: keyof GrowthFormRaw) =>
    errors[key] ? (
      <span className="text-sm text-danger">{errors[key]}</span>
    ) : null;
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
        <h2 className="text-xl font-semibold">
          {row ? "Sửa lần đo" : "Thêm lần đo"}
        </h2>
        <label className="flex flex-col gap-1">
          Ngày đo
          <input
            type="date"
            className={input}
            min={dob}
            max={today}
            value={raw.measuredOn}
            onChange={(e) => setRaw({ ...raw, measuredOn: e.target.value })}
          />
          {error("measuredOn")}
        </label>
        {FIELDS.map((field) => (
          <label key={field.key} className="flex flex-col gap-1">
            {field.label}
            <input
              inputMode="decimal"
              className={input}
              value={raw[field.key]}
              onChange={(e) => setRaw({ ...raw, [field.key]: e.target.value })}
            />
            {error(field.key)}
          </label>
        ))}
        {message && (
          <p role="alert" className="text-danger">
            {message}
          </p>
        )}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="min-h-12 flex-1 rounded-2xl border"
          >
            Hủy
          </button>
          <button
            type="submit"
            className="min-h-12 flex-1 rounded-2xl bg-accent text-on-accent"
          >
            Lưu
          </button>
        </div>
        {row && canDelete && (
          <button
            type="button"
            onClick={() => {
              if (window.confirm("Xóa lần đo này?"))
                actions.remove.mutate(row.id, done);
            }}
            className="min-h-11 rounded-2xl text-danger"
          >
            Xóa lần đo
          </button>
        )}
      </form>
    </div>
  );
}
