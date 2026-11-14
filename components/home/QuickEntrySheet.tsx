"use client";

import { useState, type FormEvent } from "react";
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
      className="fixed inset-0 z-10 flex items-end bg-black/40"
      onClick={onClose}
    >
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="flex w-full flex-col gap-3 rounded-t-3xl bg-white p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))]"
      >
        <h2 className="text-xl font-semibold">{TITLES[type]}</h2>
        {QUICK_FIELDS[type]
          .filter((field) => !field.showIf || field.showIf(values))
          .map((field) => {
            const value = values[field.key];
            const set = (next: string | boolean) =>
              setValues((prev) => ({ ...prev, [field.key]: next }));
            if (field.kind === "checkbox") {
              return (
                <label
                  key={field.key}
                  className="flex min-h-11 items-center gap-3"
                >
                  <input
                    type="checkbox"
                    className="size-5"
                    checked={value === true}
                    onChange={(e) => set(e.target.checked)}
                  />
                  {field.label}
                </label>
              );
            }
            if (field.kind === "select") {
              return (
                <label key={field.key} className="flex flex-col gap-1">
                  {field.label}
                  <select
                    className={input}
                    value={String(value)}
                    onChange={(e) => set(e.target.value)}
                  >
                    {field.options?.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </label>
              );
            }
            return (
              <label key={field.key} className="flex flex-col gap-1">
                {field.label}
                <input
                  className={input}
                  inputMode={field.kind === "number" ? "decimal" : "text"}
                  value={String(value)}
                  onChange={(e) => set(e.target.value)}
                />
              </label>
            );
          })}
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
            className="rounded-xl bg-amber-50 p-3 text-amber-900"
          >
            {warning}
          </p>
        ))}
        {message && (
          <p role="alert" className="text-red-600">
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
            className="min-h-12 flex-1 rounded-2xl bg-pink-500 text-white disabled:opacity-50"
          >
            Lưu
          </button>
        </div>
      </form>
    </div>
  );
}
