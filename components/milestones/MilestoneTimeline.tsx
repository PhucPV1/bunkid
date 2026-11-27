import { Icon } from "@/components/ui/Icon";
import type { Domain } from "@/lib/content/milestones";
import type { StepKind, TimelineStep } from "@/lib/rules/milestones";
import type { MilestoneRow } from "@/lib/supabase/rows";
import { cx } from "@/lib/ui/cx";
import { MilestoneItem } from "./MilestoneItem";

const DOMAINS: Domain[] = ["social", "language", "cognitive", "movement"];

const DOT: Record<Domain, string> = {
  social: "bg-cat-feed",
  language: "bg-cat-temp",
  cognitive: "bg-cat-sleep",
  movement: "bg-cat-diaper",
};

const NODE: Record<StepKind, string> = {
  "past-done": "bg-good text-bg",
  "past-missing": "bg-warn text-bg",
  current: "bg-accent text-on-accent ring-5 ring-accent-tint",
  next: "border-2 border-muted/50 bg-glass-solid text-muted",
  later: "border-2 border-muted/50 bg-glass-solid text-muted",
};

export const timelineListId = (months: number) => `ms-${months}`;

function Node({ kind, months }: { kind: StepKind; months: number }) {
  return (
    <span
      aria-hidden="true"
      className={cx(
        "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold",
        NODE[kind],
      )}
    >
      {kind === "past-done" ? (
        <Icon name="check" size={14} strokeWidth={3} />
      ) : kind === "past-missing" ? (
        "!"
      ) : (
        months
      )}
    </span>
  );
}

// Spec 2026-11-27 §4.3: the month groups as a vertical timeline. Hook-free, so
// tests can walk the tree.
export function MilestoneTimeline({
  steps,
  openMonths,
  domains,
  byCode,
  pending,
  canEdit,
  onToggle,
  onOpenItem,
}: {
  steps: TimelineStep[];
  openMonths: number | null;
  domains: Record<Domain, string>;
  byCode: ReadonlyMap<string, MilestoneRow>;
  pending: ReadonlySet<string>;
  canEdit: (row: MilestoneRow | undefined) => boolean;
  onToggle: (months: number) => void;
  onOpenItem: (code: string, title: string) => void;
}) {
  return (
    <ol className="flex flex-col">
      {steps.map(({ group, kind, summary, summaryTone }) => {
        const open = group.months === openMonths;
        const id = timelineListId(group.months);
        return (
          <li key={group.months} className="flex gap-3">
            <div className="flex w-7 shrink-0 flex-col items-center">
              <Node kind={kind} months={group.months} />
              <span aria-hidden="true" className="w-0.5 flex-1 bg-ink/15" />
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-2 pb-3.5">
              <button
                type="button"
                aria-expanded={open}
                aria-controls={id}
                onClick={() => onToggle(group.months)}
                className="flex min-h-11 w-full items-center gap-2 text-left"
              >
                <span className="flex min-w-0 flex-1 flex-col">
                  <span
                    className={cx(
                      "text-base font-bold",
                      kind === "later" ? "text-muted" : "text-ink",
                    )}
                  >
                    Mốc {group.months} tháng
                  </span>
                  {summary !== null && (
                    <span
                      className={cx(
                        "text-[13px]",
                        summaryTone === "warn"
                          ? "font-semibold text-warn"
                          : "text-muted",
                      )}
                    >
                      {summary}
                    </span>
                  )}
                </span>
                <Icon
                  name={open ? "chevronUp" : "chevronDown"}
                  size={18}
                  className="shrink-0 text-muted"
                />
              </button>
              {open && (
                <ul id={id} className="glass overflow-hidden rounded-[22px]">
                  {DOMAINS.filter((d) =>
                    group.items.some((i) => i.domain === d),
                  ).map((domain, index) => (
                    <li
                      key={domain}
                      className={cx(index > 0 && "border-t border-line")}
                    >
                      <h3 className="flex items-center gap-2 px-4 pt-3 pb-1 text-[13px] font-semibold tracking-[0.04em] text-muted uppercase">
                        <span
                          aria-hidden="true"
                          className={cx("size-2 rounded-full", DOT[domain])}
                        />
                        {domains[domain]}
                      </h3>
                      <ul>
                        {group.items
                          .filter((i) => i.domain === domain)
                          .map((i) => {
                            const row = byCode.get(i.code);
                            return (
                              <MilestoneItem
                                key={i.code}
                                title={i.text}
                                row={row}
                                pending={pending.has(i.code)}
                                disabled={!canEdit(row)}
                                onOpen={() => onOpenItem(i.code, i.text)}
                              />
                            );
                          })}
                      </ul>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
