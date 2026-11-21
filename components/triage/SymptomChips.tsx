import { Icon } from "@/components/ui/Icon";
import type { TriageSymptom } from "@/lib/content/triage";
import { FEVER_SYMPTOM, pickedSymptomCount } from "@/lib/rules/symptoms";
import { cx } from "@/lib/ui/cx";

// Spec 2026-11-19 §6: one glass list of groups; a group's chips show only
// while it is open. Each header is a button inside a heading, the usual
// accordion shape for screen readers. The chips are glass inside glass, so
// globals.css drops their own blur.
export function SymptomChips({
  groups,
  symptoms,
  selected,
  feverLocked,
  openGroups,
  onToggle,
  onToggleGroup,
}: {
  groups: { code: string; name: string }[];
  symptoms: TriageSymptom[];
  selected: ReadonlySet<string>;
  feverLocked: boolean;
  openGroups: ReadonlySet<string>;
  onToggle: (code: string) => void;
  onToggleGroup: (code: string) => void;
}) {
  return (
    <ul className="glass overflow-hidden rounded-[22px]">
      {groups.map((group) => {
        const list = symptoms.filter((symptom) => symptom.group === group.code);
        if (list.length === 0) return null;
        const open = openGroups.has(group.code);
        const panelId = `symptom-group-${group.code}`;
        const picked = pickedSymptomCount(list, selected, feverLocked);
        const hasLockedFever =
          feverLocked && list.some((symptom) => symptom.code === FEVER_SYMPTOM);
        return (
          <li key={group.code} className="border-b border-line last:border-b-0">
            <h3>
              <button
                type="button"
                aria-expanded={open}
                aria-controls={open ? panelId : undefined}
                onClick={() => onToggleGroup(group.code)}
                className="flex min-h-[52px] w-full items-center gap-3 px-4 py-1.5 text-left"
              >
                <span className="min-w-0 flex-1 text-base text-ink">
                  {group.name}
                </span>
                {picked > 0 && (
                  <span className="rounded-full bg-accent-tint px-2 py-0.5 text-xs font-bold whitespace-nowrap text-accent-text">
                    {picked} đã chọn
                  </span>
                )}
                <Icon
                  name={open ? "chevronUp" : "chevronDown"}
                  size={18}
                  className="shrink-0 text-muted"
                />
              </button>
            </h3>
            {open && (
              <div id={panelId} className="flex flex-col gap-2 px-4 pb-4">
                <div
                  role="group"
                  aria-label={group.name}
                  className="flex flex-wrap gap-2"
                >
                  {list.map((symptom) => {
                    const locked =
                      feverLocked && symptom.code === FEVER_SYMPTOM;
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
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
