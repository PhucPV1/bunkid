"use client";

import { useState } from "react";
import { OnlineOnly } from "@/components/OnlineOnly";
import { VACCINES } from "@/lib/content/vaccines";
import { toVietnameseError } from "@/lib/data/errors";
import { entriesFor, pendingRowIds } from "@/lib/data/outboxCore";
import { useUpdateChoices, useVaccineDoses } from "@/lib/data/vaccines";
import { useOutboxEntries } from "@/lib/hooks/useOutboxEntries";
import { vnDateString } from "@/lib/rules/time";
import {
  cleanChoices,
  doseKey,
  parseChoices,
  toDoseRecords,
} from "@/lib/rules/vaccineForm";
import {
  buildSchedule,
  STATE_SECTIONS,
  type ScheduleItem,
} from "@/lib/rules/vaccines";
import type { Baby } from "@/lib/supabase/rows";
import { ChoiceFields } from "./ChoiceFields";
import { DoseLine } from "./DoseLine";
import { DoseSheet } from "./DoseSheet";
import { VaccineSetup } from "./VaccineSetup";

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

  if (doses.data === undefined) {
    if (doses.isError)
      return (
        <main className="p-6 text-center">
          <p className="mb-4">{toVietnameseError(doses.error)}</p>
          <button
            type="button"
            className="min-h-11 rounded-xl bg-accent px-4 text-on-accent"
            onClick={() => doses.refetch()}
          >
            Thử lại
          </button>
        </main>
      );
    return <main className="p-6 text-center text-muted">Đang tải…</main>;
  }

  const rows = doses.data;
  const records = toDoseRecords(rows);
  const items = buildSchedule({
    doses: VACCINES.doses,
    choices,
    dob: baby.dob,
    records,
    today: vnDateString(new Date()),
  });
  const unchosen = VACCINES.groups.filter(
    (group) => cleanChoices([group], choices)[group.code] === undefined,
  ).length;
  const needsSetup =
    isOwner && Object.keys(choices).length === 0 && !setupLater;
  const rowFor = (item: ScheduleItem) =>
    rows.find(
      (row) =>
        row.vaccine_code === item.dose.code && row.dose_no === item.dose.doseNo,
    ) ?? null;

  return (
    <main className="mx-auto flex max-w-md flex-col gap-4 p-4">
      <h1 className="text-2xl font-semibold">Tiêm chủng</h1>
      <p className="rounded-xl bg-warn-soft p-3 text-sm text-warn-ink">
        {VACCINES.disclaimer}
      </p>
      {needsSetup ? (
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-medium">Thiết lập lịch tiêm</h2>
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
      {STATE_SECTIONS.map((section) => {
        const list = items.filter((item) => item.state === section.state);
        if (list.length === 0) return null;
        return (
          <section key={section.state} className="flex flex-col gap-2">
            <h2 className="text-lg font-medium">
              {section.title} ({list.length})
            </h2>
            <ul className="divide-y rounded-2xl border">
              {list.map((item) => (
                <li key={doseKey(item.dose.code, item.dose.doseNo)}>
                  <button
                    type="button"
                    onClick={() => setOpen(item)}
                    className="flex min-h-12 w-full flex-col items-start gap-0.5 px-4 py-2 text-left"
                  >
                    <DoseLine
                      item={item}
                      pending={pending.has(
                        doseKey(item.dose.code, item.dose.doseNo),
                      )}
                    />
                  </button>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
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
  const update = useUpdateChoices(baby.id);
  const [draft, setDraft] = useState(choices);

  if (!editing)
    return (
      <section className="flex flex-col gap-2">
        {unchosen > 0 && (
          <p className="text-muted">
            Còn {unchosen} nhóm chưa chọn loại vaccine. Mũi của các nhóm này
            hiện nhãn "Chưa chọn loại" và không có nhắc lịch.
          </p>
        )}
        {isOwner ? (
          <button
            type="button"
            onClick={() => {
              setDraft(choices);
              setEditing(true);
            }}
            className="min-h-11 rounded-xl border px-4"
          >
            Chọn loại vaccine
          </button>
        ) : (
          unchosen > 0 && (
            <p className="text-muted">
              Chỉ chủ gia đình đổi được loại vaccine.
            </p>
          )
        )}
      </section>
    );

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-medium">Loại vaccine</h2>
      <OnlineOnly>
        <ChoiceFields
          groups={VACCINES.groups}
          value={draft}
          onChange={setDraft}
        />
        <button
          type="button"
          disabled={update.isPending}
          onClick={() =>
            update.mutate(cleanChoices(VACCINES.groups, draft), {
              onSuccess: () => setEditing(false),
            })
          }
          className="min-h-12 rounded-2xl bg-accent text-on-accent disabled:opacity-50"
        >
          Lưu
        </button>
      </OnlineOnly>
      {update.isError && (
        <p role="alert" className="text-danger">
          {toVietnameseError(update.error)}
        </p>
      )}
      <button
        type="button"
        onClick={() => setEditing(false)}
        className="min-h-12 rounded-2xl border"
      >
        Đóng
      </button>
    </section>
  );
}
