"use client";

import { useState } from "react";
import { ErrorCard } from "@/components/ui/ErrorCard";
import { Icon } from "@/components/ui/Icon";
import { PageHeader } from "@/components/ui/PageHeader";
import { MILESTONES } from "@/lib/content/milestones";
import { toVietnameseError } from "@/lib/data/errors";
import { useMilestones } from "@/lib/data/milestones";
import { entriesFor, pendingRowIds } from "@/lib/data/outboxCore";
import { useOutboxEntries } from "@/lib/hooks/useOutboxEntries";
import {
  ageInMonths,
  defaultOpenMonths,
  motorSummary,
  timelineSteps,
} from "@/lib/rules/milestones";
import { ageDays, formatAgeVi } from "@/lib/rules/time";
import type { Baby, MilestoneRow } from "@/lib/supabase/rows";
import { cx } from "@/lib/ui/cx";
import { AskDoctorSheet } from "./AskDoctorSheet";
import { MilestoneSheet } from "./MilestoneSheet";
import { MilestoneTimeline } from "./MilestoneTimeline";
import { MotorSheet } from "./MotorSheet";

// Spec 2026-11-27 §4.4: one sheet at a time. An item opened from the motor
// sheet goes back to it when it closes.
type OpenSheet =
  | { kind: "motor" }
  | { kind: "askDoctor" }
  | { kind: "item"; code: string; title: string; fromMotor: boolean };

const WHO_SOURCE = MILESTONES.motor.find((m) => m.code === "ngoi")!.source;

export function MilestonesScreen({
  baby,
  userId,
  isOwner,
}: {
  baby: Baby;
  userId: string;
  isOwner: boolean;
}) {
  const marks = useMilestones(baby.id);
  const pending = pendingRowIds(
    entriesFor(useOutboxEntries(userId), "milestones_achieved"),
  );
  const now = new Date();
  const months = ageInMonths(ageDays(baby.dob, now));
  const groups = MILESTONES.groups;
  const [openMonths, setOpenMonths] = useState<number | null>(() =>
    defaultOpenMonths(groups, months),
  );
  const [sheet, setSheet] = useState<OpenSheet | null>(null);
  const byCode = new Map((marks.data ?? []).map((m) => [m.milestone_code, m]));
  const loaded = marks.data !== undefined;
  const achieved = new Set(byCode.keys());
  const steps = timelineSteps(groups, months, achieved, loaded, baby.name);
  const motor = motorSummary(MILESTONES.motor, months, achieved);
  const canEdit = (row: MilestoneRow | undefined) =>
    !row || isOwner || row.created_by === userId;
  // §4.5, §4.6: the baby's current group, or the first one for a newborn.
  const current = groups.find(
    (g) => g.months === defaultOpenMonths(groups, months),
  )!;
  const cdcGroup = groups.find((g) => g.months === openMonths) ?? current;

  return (
    <main className="mx-auto flex max-w-md flex-col gap-[18px] px-4 pt-2 pb-4">
      <PageHeader
        title={MILESTONES.title}
        back={{ href: "/suc-khoe", label: "Sức khỏe" }}
      />
      {marks.isError && !marks.data && (
        <ErrorCard
          message={toVietnameseError(marks.error)}
          onRetry={() => void marks.refetch()}
        />
      )}
      <ul className="glass overflow-hidden rounded-[22px]">
        <li>
          <button
            type="button"
            aria-haspopup="dialog"
            onClick={() => setSheet({ kind: "motor" })}
            className="flex min-h-14 w-full items-center gap-3 px-4 py-2.5 text-left"
          >
            <span className="flex size-[34px] shrink-0 items-center justify-center rounded-full bg-accent-tint text-accent-text">
              <Icon name="star" size={18} />
            </span>
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="text-base font-semibold text-ink">
                Vận động lớn
              </span>
              {loaded && (
                <span
                  className={cx(
                    "text-[13px]",
                    motor.tone === "warn"
                      ? "font-semibold text-warn"
                      : "text-muted",
                  )}
                >
                  {motor.text}
                </span>
              )}
            </span>
            <Icon name="chevronRight" size={16} className="text-muted" />
          </button>
        </li>
      </ul>
      <MilestoneTimeline
        steps={steps}
        openMonths={openMonths}
        domains={MILESTONES.domains}
        byCode={byCode}
        pending={pending}
        canEdit={canEdit}
        onToggle={(m) => setOpenMonths(openMonths === m ? null : m)}
        onOpenItem={(code, title) =>
          setSheet({ kind: "item", code, title, fromMotor: false })
        }
      />
      <button
        type="button"
        aria-haspopup="dialog"
        onClick={() => setSheet({ kind: "askDoctor" })}
        className="flex min-h-[52px] w-full items-center gap-3 rounded-[22px] bg-warn-soft px-4 py-2.5 text-warn-ink"
      >
        <Icon name="alert" size={20} />
        <span className="flex-1 text-left font-semibold">
          Khi nào nên hỏi bác sĩ
        </span>
        <Icon name="chevronRight" size={16} />
      </button>
      <div className="flex flex-col">
        <p className="px-1 text-[13px] text-muted">
          Theo CDC và WHO, không thay cho khám sàng lọc.
        </p>
        <div className="flex gap-4 px-1">
          <a
            href={cdcGroup.source}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-11 items-center text-[13px] text-muted underline"
          >
            Nguồn CDC
          </a>
          <a
            href={WHO_SOURCE}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-11 items-center text-[13px] text-muted underline"
          >
            Nguồn WHO
          </a>
        </div>
      </div>
      {sheet?.kind === "motor" && (
        <MotorSheet
          motor={MILESTONES.motor}
          ageMonths={months}
          ageText={formatAgeVi(baby.dob, now)}
          babyName={baby.name}
          byCode={byCode}
          pending={pending}
          canEdit={canEdit}
          onPick={(code, title) =>
            setSheet({ kind: "item", code, title, fromMotor: true })
          }
          onClose={() => setSheet(null)}
        />
      )}
      {sheet?.kind === "askDoctor" && (
        <AskDoctorSheet
          lines={current.askDoctor}
          onClose={() => setSheet(null)}
        />
      )}
      {sheet?.kind === "item" && (
        <MilestoneSheet
          code={sheet.code}
          title={sheet.title}
          row={byCode.get(sheet.code) ?? null}
          baby={baby}
          userId={userId}
          onClose={() => setSheet(sheet.fromMotor ? { kind: "motor" } : null)}
        />
      )}
    </main>
  );
}
