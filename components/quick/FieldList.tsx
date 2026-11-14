import { Segmented } from "@/components/ui/Segmented";
import { Switch } from "@/components/ui/Switch";
import type { QuickField, QuickValues } from "@/lib/rules/quickEntry";
import { FIELD_INPUT, FIELD_LABEL } from "./styles";

// Spec §8.3: same fields as before, drawn with ui components. A checkbox becomes a
// Switch, a select with 2–4 options a Segmented, a longer select stays native.
export function FieldList({
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

          if (field.kind === "checkbox")
            return (
              <div
                key={field.key}
                className="glass flex min-h-[52px] items-center justify-between gap-3 rounded-[22px] px-4"
              >
                <span className="text-base text-ink">{field.label}</span>
                <Switch
                  checked={value === true}
                  label={field.label}
                  onChange={set}
                />
              </div>
            );

          if (field.kind === "select") {
            const options = field.options ?? [];
            if (options.length >= 2 && options.length <= 4)
              return (
                <div key={field.key} className="flex flex-col gap-1.5">
                  <span className={FIELD_LABEL}>{field.label}</span>
                  <Segmented
                    label={field.label}
                    options={options}
                    value={String(value)}
                    onChange={set}
                  />
                </div>
              );
            return (
              <label key={field.key} className="flex flex-col gap-1.5">
                <span className={FIELD_LABEL}>{field.label}</span>
                <select
                  className={`${FIELD_INPUT} accent-accent`}
                  value={String(value)}
                  onChange={(event) => set(event.target.value)}
                >
                  {options.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            );
          }

          return (
            <label key={field.key} className="flex flex-col gap-1.5">
              <span className={FIELD_LABEL}>{field.label}</span>
              <input
                className={
                  field.kind === "number"
                    ? `${FIELD_INPUT} tabular-nums`
                    : FIELD_INPUT
                }
                inputMode={field.kind === "number" ? "decimal" : "text"}
                value={String(value ?? "")}
                onChange={(event) => set(event.target.value)}
              />
            </label>
          );
        })}
    </>
  );
}
