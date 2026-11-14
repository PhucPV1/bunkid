"use client";

import { useState } from "react";
import { OnlineOnly } from "@/components/OnlineOnly";
import { toVietnameseError } from "@/lib/data/errors";
import { useVaccineSetup } from "@/lib/data/vaccines";
import { VACCINES } from "@/lib/content/vaccines";
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

// Spec §6.1: pick a series per group, then tick the doses already given.
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
        <p className="text-muted">
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
            <legend className="mb-2 font-medium">
              Mũi đã đến hạn trước hôm nay, đánh dấu mũi bé đã tiêm
            </legend>
            {candidates.map((item) => {
              const key = doseKey(item.dose.code, item.dose.doseNo);
              return (
                <label key={key} className="flex min-h-11 items-center gap-3">
                  <input
                    type="checkbox"
                    className="size-5"
                    checked={ticked.has(key)}
                    onChange={(e) => toggle(key, e.target.checked)}
                  />
                  <span>
                    {item.dose.name}
                    <span className="block text-sm text-muted">
                      Hẹn {formatDueDate(item.due)}
                    </span>
                  </span>
                </label>
              );
            })}
          </fieldset>
        )}
        <button
          type="button"
          disabled={setup.isPending}
          onClick={save}
          className="min-h-12 rounded-2xl bg-accent text-on-accent disabled:opacity-50"
        >
          Lưu
        </button>
      </OnlineOnly>
      {setup.isError && (
        <p role="alert" className="text-danger">
          {toVietnameseError(setup.error)}
        </p>
      )}
      <button
        type="button"
        onClick={onLater}
        className="min-h-12 rounded-2xl border"
      >
        Để sau
      </button>
    </div>
  );
}
