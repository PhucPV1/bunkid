import { QUICK_FIELDS, type QuickValues } from "@/lib/rules/quickEntry";
import { parseCodes } from "@/lib/rules/symptomForm";
import { FieldList } from "./FieldList";

// Spec 2026-11-26 §3.5: a hint that counts the picked chips, then the same two
// fields the edit sheet draws (the chips and the note).
export function SymptomFields({
  values,
  onChange,
  ageDays,
}: {
  values: QuickValues;
  onChange: (next: QuickValues) => void;
  ageDays: number | null;
}) {
  const count = parseCodes(values.codes).length;
  return (
    <>
      <p className="text-[15px] text-muted">
        {`Bấm những gì bé đang có.${count > 0 ? ` Đã chọn ${count}.` : ""}`}
      </p>
      <FieldList
        fields={QUICK_FIELDS.symptom}
        values={values}
        onChange={onChange}
        ageDays={ageDays}
      />
    </>
  );
}
