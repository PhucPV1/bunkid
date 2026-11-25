"use client";

import { useState } from "react";
import { OnlineOnly } from "@/components/OnlineOnly";
import { Button } from "@/components/ui/Button";
import { ErrorCard } from "@/components/ui/ErrorCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { NeedsNetwork, waitingForNetwork } from "@/components/ui/NeedsNetwork";
import { Skeleton } from "@/components/ui/Skeleton";
import { VACCINES } from "@/lib/content/vaccines";
import { toVietnameseError } from "@/lib/data/errors";
import { entriesFor, pendingRowIds } from "@/lib/data/outboxCore";
import { useUpdateChoices, useVaccineDoses } from "@/lib/data/vaccines";
import { useOutboxEntries } from "@/lib/hooks/useOutboxEntries";
import { vnDateString } from "@/lib/rules/time";
import {
  cleanChoices,
  parseChoices,
  toDoseRecords,
} from "@/lib/rules/vaccineForm";
import {
  buildSchedule,
  nextDose,
  type ScheduleItem,
} from "@/lib/rules/vaccines";
import type { Baby } from "@/lib/supabase/rows";
import { ChoiceFields } from "./ChoiceFields";
import { DoseGrid } from "./DoseGrid";
import { DoseSheet } from "./DoseSheet";
import { NextDoseCard } from "./NextDoseCard";
import { VaccineSetup } from "./VaccineSetup";
import { VaccineSourceRow } from "./VaccineSourceRow";

const SECTION_TITLE = "px-1 text-xl leading-[26px] font-bold text-ink";

export function VaccineScreen({
  baby,
  userId,
  isOwner,
}: {
  baby: Baby;
  userId: string;
  isOwner: boolean;
}) {
  const doses = useVaccineDoses(baby.id);
  const pending = pendingRowIds(
    entriesFor(useOutboxEntries(userId), "vaccine_doses"),
  );
  const choices = parseChoices(baby.vaccine_choices);
  const [setupLater, setSetupLater] = useState(false);
  const [editing, setEditing] = useState(false);
  const [open, setOpen] = useState<ScheduleItem | null>(null);

  const header = (
    <PageHeader
      title="Tiêm chủng"
      back={{ href: "/suc-khoe", label: "Sức khỏe" }}
    />
  );

  if (doses.data === undefined)
    return (
      <main className="mx-auto flex max-w-md flex-col gap-[18px] px-4 pt-2 pb-4">
        {header}
        {doses.isError ? (
          <ErrorCard
            message={toVietnameseError(doses.error)}
            onRetry={() => void doses.refetch()}
          />
        ) : waitingForNetwork(doses) ? (
          <NeedsNetwork what="lịch tiêm" />
        ) : (
          <div className="flex flex-col gap-2.5">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-[60px]" />
            ))}
          </div>
        )}
      </main>
    );

  const rows = doses.data;
  const records = toDoseRecords(rows);
  const today = vnDateString(new Date());
  const items = buildSchedule({
    doses: VACCINES.doses,
    choices,
    dob: baby.dob,
    records,
    today,
  });
  const unchosen = VACCINES.groups.filter(
    (group) => cleanChoices([group], choices)[group.code] === undefined,
  ).length;
  const needsSetup =
    isOwner && Object.keys(choices).length === 0 && !setupLater;
  // Spec 2026-11-19 §7: nothing to do first while the setup step is showing.
  const next = needsSetup ? null : nextDose(items);
  // Spec 2026-11-19 §7.2: an unchosen row opens "Loại vaccine" at the top of
  // the page; during setup the setup step up there is where to choose.
  const choose = () => {
    if (!needsSetup) setEditing(true);
    window.scrollTo({ top: 0 });
  };
  const rowFor = (item: ScheduleItem) =>
    rows.find(
      (row) =>
        row.vaccine_code === item.dose.code && row.dose_no === item.dose.doseNo,
    ) ?? null;

  return (
    <main className="mx-auto flex max-w-md flex-col gap-[18px] px-4 pt-2 pb-4">
      {header}
      {next && <NextDoseCard item={next} today={today} onOpen={setOpen} />}
      <VaccineSourceRow text={VACCINES.disclaimer} />
      {needsSetup ? (
        <section className="flex flex-col gap-3">
          <h2 className={SECTION_TITLE}>Thiết lập lịch tiêm</h2>
          <VaccineSetup
            baby={baby}
            userId={userId}
            records={records}
            initialChoices={choices}
            onDone={() => setSetupLater(true)}
            onLater={() => setSetupLater(true)}
          />
        </section>
      ) : (
        <ChoicesSection
          baby={baby}
          choices={choices}
          isOwner={isOwner}
          unchosen={unchosen}
          editing={editing}
          setEditing={setEditing}
        />
      )}
      <DoseGrid
        items={items}
        groups={VACCINES.groups}
        pending={pending}
        onOpen={(item) => setOpen(item)}
        onChoose={isOwner ? choose : undefined}
      />
      {open && (
        <DoseSheet
          item={open}
          row={rowFor(open)}
          babyId={baby.id}
          userId={userId}
          dob={baby.dob}
          onClose={() => setOpen(null)}
        />
      )}
    </main>
  );
}

function ChoicesSection({
  baby,
  choices,
  isOwner,
  unchosen,
  editing,
  setEditing,
}: {
  baby: Baby;
  choices: Record<string, string>;
  isOwner: boolean;
  unchosen: number;
  editing: boolean;
  setEditing: (on: boolean) => void;
}) {
  if (!editing)
    return (
      <section className="flex flex-col gap-2.5">
        {unchosen > 0 && (
          <p className="px-1 text-[15px] text-muted">
            Còn {unchosen} nhóm chưa chọn loại vaccine. Mỗi nhóm này hiện một
            hàng "Chưa chọn loại" trong bảng và không có nhắc lịch.
          </p>
        )}
        {isOwner ? (
          <Button variant="secondary" block onClick={() => setEditing(true)}>
            Chọn loại vaccine
          </Button>
        ) : (
          unchosen > 0 && (
            <p className="px-1 text-[15px] text-muted">
              Chỉ chủ gia đình đổi được loại vaccine.
            </p>
          )
        )}
      </section>
    );

  return (
    <ChoicesEditor
      baby={baby}
      choices={choices}
      onClose={() => setEditing(false)}
    />
  );
}

// Mounted each time it opens (from the button or from a row of the table), so
// the draft always starts from the saved choices.
function ChoicesEditor({
  baby,
  choices,
  onClose,
}: {
  baby: Baby;
  choices: Record<string, string>;
  onClose: () => void;
}) {
  const update = useUpdateChoices(baby.id);
  const [draft, setDraft] = useState(choices);

  return (
    <section className="flex flex-col gap-3">
      <h2 className={SECTION_TITLE}>Loại vaccine</h2>
      <OnlineOnly>
        <ChoiceFields
          groups={VACCINES.groups}
          value={draft}
          onChange={setDraft}
        />
        <Button
          block
          busy={update.isPending}
          onClick={() =>
            update.mutate(cleanChoices(VACCINES.groups, draft), {
              onSuccess: onClose,
            })
          }
        >
          Lưu
        </Button>
      </OnlineOnly>
      {update.isError && (
        <p role="alert" className="text-[15px] text-danger">
          {toVietnameseError(update.error)}
        </p>
      )}
      <Button variant="secondary" block onClick={onClose}>
        Đóng
      </Button>
    </section>
  );
}
