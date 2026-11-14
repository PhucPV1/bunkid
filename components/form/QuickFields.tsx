"use client";

import type { QuickField, QuickValues } from "@/lib/rules/quickEntry";

const INPUT = "min-h-11 rounded-xl border px-3";

export function QuickFields({
  fields,
  values,
  onChange,
}: {
  fields: QuickField[];
  values: QuickValues;
  onChange: (next: QuickValues) => void;
}) {
  return (
    <>
      {fields
        .filter((field) => !field.showIf || field.showIf(values))
        .map((field) => {
          const value = values[field.key];
          const set = (next: string | boolean) =>
            onChange({ ...values, [field.key]: next });
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
                  className={INPUT}
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
                className={INPUT}
                inputMode={field.kind === "number" ? "decimal" : "text"}
                value={String(value)}
                onChange={(e) => set(e.target.value)}
              />
            </label>
          );
        })}
    </>
  );
}
