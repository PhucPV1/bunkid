"use client";

import { useState } from "react";
import { PendingMark } from "@/components/sync/PendingMark";
import { MILESTONES } from "@/lib/content/milestones";
import { useMilestones } from "@/lib/data/milestones";
import { entriesFor, pendingRowIds } from "@/lib/data/outboxCore";
import { useOutboxEntries } from "@/lib/hooks/useOutboxEntries";
import {
  ageInMonths,
  motorStatus,
  visibleGroups,
  type MotorState,
} from "@/lib/rules/milestones";
import { ageDays } from "@/lib/rules/time";
import type { Baby, MilestoneRow } from "@/lib/supabase/rows";
import { MilestoneSheet } from "./MilestoneSheet";

const STATE_CLASS: Record<MotorState, string> = {
  done: "bg-good-soft text-good-ink",
  early: "bg-soft text-muted",
  window: "bg-accent-soft text-accent-ink",
  late: "bg-warn-soft text-warn-ink",
};

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
  const months = ageInMonths(ageDays(baby.dob, new Date()));
  const [showAll, setShowAll] = useState(false);
  const [open, setOpen] = useState<{ code: string; title: string } | null>(
    null,
  );
  const byCode = new Map((marks.data ?? []).map((m) => [m.milestone_code, m]));
  const groups = showAll
    ? MILESTONES.groups
    : visibleGroups(MILESTONES.groups, months);
  const canEdit = (row: MilestoneRow | undefined) =>
    !row || isOwner || row.created_by === userId;

  const item = (code: string, title: string, extra?: React.ReactNode) => {
    const row = byCode.get(code);
    return (
      <li key={code}>
        <button
          type="button"
          disabled={!canEdit(row)}
          onClick={() => setOpen({ code, title })}
          className="flex min-h-12 w-full items-start gap-3 px-4 py-2 text-left disabled:opacity-100"
        >
          <span
            aria-hidden="true"
            className={`mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md border ${row ? "border-accent bg-accent text-on-accent" : ""}`}
          >
            {row ? "✓" : ""}
          </span>
          <span className="flex flex-col">
            <span>
              {title} <PendingMark pending={pending.has(code)} />
            </span>
            {row && (
              <span className="text-sm text-muted">
                Đạt ngày {row.achieved_on.split("-").reverse().join("/")}
                {row.note ? ` · ${row.note}` : ""}
                {row.photo_id ? " · có ảnh" : ""}
              </span>
            )}
            {extra}
          </span>
        </button>
      </li>
    );
  };

  return (
    <main className="mx-auto flex max-w-md flex-col gap-4 p-4">
      <h1 className="text-2xl font-semibold">{MILESTONES.title}</h1>
      <p className="text-sm text-muted">{MILESTONES.intro}</p>
      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-medium">Mốc vận động lớn</h2>
        <ul className="divide-y rounded-2xl border">
          {MILESTONES.motor.map((m) => {
            const status = motorStatus(m, months, byCode.has(m.code));
            return item(
              m.code,
              m.name,
              status.state === "done" ? null : (
                <span
                  className={`mt-1 self-start rounded-full px-2 text-sm ${STATE_CLASS[status.state]}`}
                >
                  {status.text}
                </span>
              ),
            );
          })}
        </ul>
      </section>
      {groups.map((group) => (
        <section key={group.months} className="flex flex-col gap-2">
          <h2 className="text-lg font-medium">Mốc {group.months} tháng</h2>
          {(["social", "language", "cognitive", "movement"] as const).map(
            (domain) => {
              const list = group.items.filter((i) => i.domain === domain);
              if (list.length === 0) return null;
              return (
                <div key={domain} className="flex flex-col gap-1">
                  <h3 className="text-sm font-medium text-muted">
                    {MILESTONES.domains[domain]}
                  </h3>
                  <ul className="divide-y rounded-2xl border">
                    {list.map((i) => item(i.code, i.text))}
                  </ul>
                </div>
              );
            },
          )}
          <div className="rounded-xl bg-warn-soft p-3 text-sm text-warn-ink">
            <p className="font-medium">Khi nào nên hỏi bác sĩ</p>
            <ul className="list-disc pl-5">
              {group.askDoctor.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </div>
          <a
            href={group.source}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-11 items-center text-sm text-muted underline"
          >
            Nguồn: CDC
          </a>
        </section>
      ))}
      <button
        type="button"
        onClick={() => setShowAll(!showAll)}
        className="min-h-11 rounded-xl border px-4"
      >
        {showAll ? "Chỉ xem tháng hiện tại và kế tiếp" : "Xem tất cả các mốc"}
      </button>
      {open && (
        <MilestoneSheet
          code={open.code}
          title={open.title}
          row={byCode.get(open.code) ?? null}
          baby={baby}
          userId={userId}
          onClose={() => setOpen(null)}
        />
      )}
    </main>
  );
}
