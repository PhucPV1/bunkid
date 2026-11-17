import type { TriageSymptom } from "@/lib/content/triage";
import { FEVER_SYMPTOM } from "@/lib/rules/symptoms";
import { cx } from "@/lib/ui/cx";

// Spec 2026-11-17 §6.1 (phương án A): wrapped multi-select chips, one block per group.
export function SymptomChips({
  groups,
  symptoms,
  selected,
  feverLocked,
  onToggle,
}: {
  groups: { code: string; name: string }[];
  symptoms: TriageSymptom[];
  selected: ReadonlySet<string>;
  feverLocked: boolean;
  onToggle: (code: string) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      {groups.map((group) => {
        const list = symptoms.filter((symptom) => symptom.group === group.code);
        if (list.length === 0) return null;
        const hasLockedFever =
          feverLocked && list.some((symptom) => symptom.code === FEVER_SYMPTOM);
        return (
          <section key={group.code} className="flex flex-col gap-2">
            <h3 className="px-1 text-[13px] leading-[18px] font-semibold text-muted">
              {group.name}
            </h3>
            <div
              role="group"
              aria-label={group.name}
              className="flex flex-wrap gap-2"
            >
              {list.map((symptom) => {
                const locked = feverLocked && symptom.code === FEVER_SYMPTOM;
                const on = locked || selected.has(symptom.code);
                return (
                  <button
                    key={symptom.code}
                    type="button"
                    aria-pressed={on}
                    aria-disabled={locked || undefined}
                    onClick={() => {
                      if (!locked) onToggle(symptom.code);
                    }}
                    className={cx(
                      "min-h-11 rounded-full px-4 text-left text-[15px]",
                      on
                        ? "bg-ink text-bg font-semibold"
                        : "glass font-medium text-ink",
                    )}
                  >
                    {on ? `✓ ${symptom.text}` : symptom.text}
                  </button>
                );
              })}
            </div>
            {hasLockedFever && (
              <p className="px-1 text-[13px] text-muted">
                Bật theo nhiệt độ đã nhập.
              </p>
            )}
          </section>
        );
      })}
    </div>
  );
}
