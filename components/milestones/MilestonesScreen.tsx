"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { ErrorCard } from "@/components/ui/ErrorCard";
import { ListGroup } from "@/components/ui/ListGroup";
import { PageHeader } from "@/components/ui/PageHeader";
import { MILESTONES } from "@/lib/content/milestones";
import { toVietnameseError } from "@/lib/data/errors";
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
import { MilestoneItem } from "./MilestoneItem";
import { MilestoneSheet } from "./MilestoneSheet";

const STATE_CLASS: Record<MotorState, string> = {
  done: "bg-good-soft text-good-ink",
  early: "bg-muted/15 text-ink",
  window: "bg-accent-tint text-accent-text",
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
      <MilestoneItem
        key={code}
        title={title}
        row={row}
        pending={pending.has(code)}
        disabled={!canEdit(row)}
        extra={extra}
        onOpen={() => setOpen({ code, title })}
      />
    );
  };

  return (
    <main className="mx-auto flex max-w-md flex-col gap-[18px] px-4 pt-2 pb-4">
      <PageHeader
        title={MILESTONES.title}
        back={{ href: "/suc-khoe", label: "Sức khỏe" }}
      />
      <p className="px-1 text-[15px] text-muted">{MILESTONES.intro}</p>
      {marks.isError && !marks.data && (
        <ErrorCard
          message={toVietnameseError(marks.error)}
          onRetry={() => void marks.refetch()}
        />
      )}
      <ListGroup title="Mốc vận động lớn">
        {MILESTONES.motor.map((m) => {
          const status = motorStatus(m, months, byCode.has(m.code));
          return item(
            m.code,
            m.name,
            status.state === "done" ? null : (
              <span
                className={`mt-1 self-start rounded-full px-2 text-[13px] font-semibold ${STATE_CLASS[status.state]}`}
              >
                {status.text}
              </span>
            ),
          );
        })}
      </ListGroup>
      {groups.map((group) => (
        <section key={group.months} className="flex flex-col gap-3">
          <h2 className="px-1 text-xl leading-[26px] font-bold text-ink">
            Mốc {group.months} tháng
          </h2>
          {(["social", "language", "cognitive", "movement"] as const).map(
            (domain) => {
              const list = group.items.filter((i) => i.domain === domain);
              if (list.length === 0) return null;
              return (
                <ListGroup key={domain} title={MILESTONES.domains[domain]}>
                  {list.map((i) => item(i.code, i.text))}
                </ListGroup>
              );
            },
          )}
          <div className="rounded-[22px] bg-warn-soft p-4 text-[15px] text-warn-ink">
            <p className="font-semibold">Khi nào nên hỏi bác sĩ</p>
            <ul className="mt-1 list-disc pl-5">
              {group.askDoctor.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </div>
          <a
            href={group.source}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-11 items-center px-1 text-[13px] text-muted underline"
          >
            Nguồn: CDC
          </a>
        </section>
      ))}
      <Button variant="secondary" block onClick={() => setShowAll(!showAll)}>
        {showAll ? "Chỉ xem tháng hiện tại và kế tiếp" : "Xem tất cả các mốc"}
      </Button>
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
