"use client";

import { useState, type FormEvent } from "react";
import { QuickFields } from "@/components/form/QuickFields";
import { useAddInstant } from "@/lib/data/logs";
import { toVietnameseError } from "@/lib/data/errors";
import {
  buildDetails,
  defaultQuickValues,
  QUICK_FIELDS,
  type InstantType,
  type QuickValues,
} from "@/lib/rules/quickEntry";
import { fromVnLocalInput, toVnLocalInput } from "@/lib/rules/time";
import { medicineWarnings } from "@/lib/rules/alerts";
import type { LogRow } from "@/lib/supabase/rows";

const TITLES: Record<InstantType, string> = {
  bottle: "Bú bình",
  diaper: "Thay tã",
  medicine: "Cho uống thuốc",
  temperature: "Đo nhiệt độ",
};

export function QuickEntrySheet({
  type,
  babyId,
  onClose,
  initial,
  recentLogs = [],
}: {
  type: InstantType;
  babyId: string;
  onClose: () => void;
  initial?: QuickValues;
  recentLogs?: LogRow[];
}) {
  const add = useAddInstant(babyId);
  const [values, setValues] = useState<QuickValues>(() => ({
    ...defaultQuickValues(type),
    ...initial,
  }));
  const [at, setAt] = useState(() => toVnLocalInput(new Date()));
  const [message, setMessage] = useState<string | null>(null);
  const warnings =
    type === "medicine" && values.antipyretic === true
      ? medicineWarnings({ logs: recentLogs, at: fromVnLocalInput(at) })
      : [];

  function submit(event: FormEvent) {
    event.preventDefault();
    const built = buildDetails(type, values);
    if (!built.ok) {
      setMessage(built.message);
      return;
    }
    add.mutate(
      { type, details: built.details, at: fromVnLocalInput(at) },
      { onSuccess: onClose, onError: (e) => setMessage(toVietnameseError(e)) },
    );
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
        className="flex w-full flex-col gap-3 rounded-t-3xl bg-surface p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))]"
      >
        <h2 className="text-xl font-semibold">{TITLES[type]}</h2>
        <QuickFields
          fields={QUICK_FIELDS[type]}
          values={values}
          onChange={setValues}
        />
        <label className="flex flex-col gap-1">
          Thời điểm
          <input
            type="datetime-local"
            className={input}
            value={at}
            onChange={(e) => setAt(e.target.value)}
          />
        </label>
        {warnings.map((warning) => (
          <p
            key={warning}
            role="status"
            className="rounded-xl bg-warn-soft p-3 text-warn-ink"
          >
            {warning}
          </p>
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
            disabled={add.isPending}
            className="min-h-12 flex-1 rounded-2xl bg-accent text-on-accent disabled:opacity-50"
          >
            Lưu
          </button>
        </div>
      </form>
    </div>
  );
}
