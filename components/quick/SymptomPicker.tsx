"use client";

import { useState } from "react";
import { TRIAGE, type TriageSymptom } from "@/lib/content/triage";
import { parseCodes, pickerLayout, toggleCode } from "@/lib/rules/symptomForm";
import { cx } from "@/lib/ui/cx";
import { FIELD_LABEL } from "./styles";

const ROW = "flex flex-wrap gap-2";

// Spec 2026-11-26 §3.5: the common chips first; one button opens the rest by
// group. `value` is the picked codes joined with ",". A picked chip is filled
// and ticked, so it reads without colour (theme night). Spec 2026-11-27 §5.3:
// a `locked` code was logged by someone the viewer may not overrule; its chip
// stays on, faded, and a tap does nothing.
export function SymptomPickerView({
  value,
  onChange,
  ageDays,
  expanded,
  onExpanded,
  locked = [],
}: {
  value: string;
  onChange: (next: string) => void;
  // null: no age filter.
  ageDays: number | null;
  expanded: boolean;
  onExpanded: (next: boolean) => void;
  locked?: readonly string[];
}) {
  const selected = parseCodes(value);
  const layout = pickerLayout({
    symptoms: TRIAGE.symptoms,
    groups: TRIAGE.groups,
    ageDays,
    selected,
  });
  const chip = (symptom: TriageSymptom) => {
    const on = selected.includes(symptom.code);
    const fixed = locked.includes(symptom.code);
    return (
      <button
        key={symptom.code}
        type="button"
        aria-pressed={on}
        aria-disabled={fixed || undefined}
        onClick={() => {
          if (!fixed)
            onChange(toggleCode(value, symptom.code, TRIAGE.symptoms));
        }}
        className={cx(
          "min-h-11 rounded-full px-4 text-[15px]",
          on ? "bg-ink font-semibold text-bg" : "glass font-medium text-ink",
          fixed && "opacity-50",
        )}
      >
        {on ? `✓ ${symptom.short}` : symptom.short}
      </button>
    );
  };
  return (
    <div className="flex flex-col gap-2">
      <span className={FIELD_LABEL}>Hay gặp</span>
      <div role="group" aria-label="Hay gặp" className={ROW}>
        {layout.common.map(chip)}
        {!expanded && layout.picked.map(chip)}
      </div>
      {layout.groups.length > 0 && (
        <button
          type="button"
          aria-expanded={expanded}
          onClick={() => onExpanded(!expanded)}
          className="min-h-11 self-start rounded-full bg-accent-tint px-4 text-[15px] font-semibold text-accent-text"
        >
          {expanded ? "Thu gọn" : `Xem tất cả ${layout.total} triệu chứng`}
        </button>
      )}
      {expanded &&
        layout.groups.map((group) => (
          <div key={group.code} className="flex flex-col gap-2">
            <span className={FIELD_LABEL}>{group.name}</span>
            <div role="group" aria-label={group.name} className={ROW}>
              {group.chips.map(chip)}
            </div>
          </div>
        ))}
    </div>
  );
}

export function SymptomPicker(props: {
  value: string;
  onChange: (next: string) => void;
  ageDays: number | null;
  locked?: readonly string[];
}) {
  const [expanded, setExpanded] = useState(false);
  return (
    <SymptomPickerView
      {...props}
      expanded={expanded}
      onExpanded={setExpanded}
    />
  );
}
