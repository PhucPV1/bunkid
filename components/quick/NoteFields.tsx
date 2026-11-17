import type { QuickValues } from "@/lib/rules/quickEntry";
import { FIELD_INPUT, FIELD_LABEL } from "./styles";

// Spec 2026-11-17 §3.3: the note itself, three lines tall, at most 500 characters.
export function NoteFields({
  values,
  onChange,
}: {
  values: QuickValues;
  onChange: (next: QuickValues) => void;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className={FIELD_LABEL}>Nội dung</span>
      <textarea
        rows={3}
        maxLength={500}
        className={`${FIELD_INPUT} py-2.5`}
        value={String(values.text ?? "")}
        onChange={(event) => onChange({ ...values, text: event.target.value })}
      />
    </label>
  );
}
