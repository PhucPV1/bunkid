"use client";

import { useState } from "react";
import { OnlineOnly } from "@/components/OnlineOnly";
import { Button } from "@/components/ui/Button";
import { Switch } from "@/components/ui/Switch";
import { VACCINES } from "@/lib/content/vaccines";
import { toVietnameseError } from "@/lib/data/errors";
import { useVaccineSetup } from "@/lib/data/vaccines";
import { vnDateString } from "@/lib/rules/time";
import {
  cleanChoices,
  DEFAULT_TICKED,
  doseKey,
  formatDueDate,
  quickTickCandidates,
} from "@/lib/rules/vaccineForm";
import { buildSchedule, type DoseRecord } from "@/lib/rules/vaccines";
import type { Baby } from "@/lib/supabase/rows";
import { ChoiceFields } from "./ChoiceFields";

// Spec gốc §6.1: pick a series per group, then tick the doses already given.
export function VaccineSetup({
  baby,
  userId,
  records,
  initialChoices,
  onDone,
  onLater,
}: {
  baby: Baby;
  userId: string;
  records: DoseRecord[];
  initialChoices: Record<string, string>;
  onDone: () => void;
  onLater: () => void;
}) {
  const setup = useVaccineSetup(baby.id, userId);
  const [draft, setDraft] = useState(initialChoices);
  const [ticked, setTicked] = useState(() => new Set(DEFAULT_TICKED));
  const candidates = quickTickCandidates(
    buildSchedule({
      doses: VACCINES.doses,
      choices: cleanChoices(VACCINES.groups, draft),
      dob: baby.dob,
      records,
      today: vnDateString(new Date()),
    }),
  );

  function toggle(key: string, on: boolean) {
    setTicked((prev) => {
      const next = new Set(prev);
      if (on) next.add(key);
      else next.delete(key);
      return next;
    });
  }

  function save() {
    setup.mutate(
      {
        choices: cleanChoices(VACCINES.groups, draft),
        ticked: candidates
          .filter((item) =>
            ticked.has(doseKey(item.dose.code, item.dose.doseNo)),
          )
          .map((item) => ({ code: item.dose.code, doseNo: item.dose.doseNo })),
      },
      { onSuccess: onDone },
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <OnlineOnly>
        <p className="text-[15px] text-muted">
          Chọn loại vaccine gia đình định tiêm cho từng nhóm. Chọn "Không tiêm"
          nếu không tiêm nhóm đó; để "Chưa chọn" nếu chưa quyết định.
        </p>
        <ChoiceFields
          groups={VACCINES.groups}
          value={draft}
          onChange={setDraft}
        />
        {candidates.length > 0 && (
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 px-1 text-[13px] font-semibold text-muted">
              Mũi đã đến hạn trước hôm nay, đánh dấu mũi bé đã tiêm
            </legend>
            {candidates.map((item) => {
              const key = doseKey(item.dose.code, item.dose.doseNo);
              return (
                <div
                  key={key}
                  className="glass flex min-h-[52px] items-center justify-between gap-3 rounded-[22px] px-4 py-2"
                >
                  <span className="flex min-w-0 flex-col">
                    <span className="text-base text-ink">{item.dose.name}</span>
                    <span className="text-[13px] text-muted tabular-nums">
                      Hẹn {formatDueDate(item.due)}
                    </span>
                  </span>
                  <Switch
                    checked={ticked.has(key)}
                    label={item.dose.name}
                    onChange={(on) => toggle(key, on)}
                  />
                </div>
              );
            })}
          </fieldset>
        )}
        <Button block busy={setup.isPending} onClick={save}>
          Lưu
        </Button>
      </OnlineOnly>
      {setup.isError && (
        <p role="alert" className="text-[15px] text-danger">
          {toVietnameseError(setup.error)}
        </p>
      )}
      <Button variant="secondary" block onClick={onLater}>
        Để sau
      </Button>
    </div>
  );
}
