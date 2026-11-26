"use client";

import { useId, useState, type FormEvent } from "react";
import { BottleFields } from "@/components/quick/BottleFields";
import { DiaperFields } from "@/components/quick/DiaperFields";
import { MedicineFields } from "@/components/quick/MedicineFields";
import { NoteFields } from "@/components/quick/NoteFields";
import { SolidsFields } from "@/components/quick/SolidsFields";
import { SymptomFields } from "@/components/quick/SymptomFields";
import { TemperatureFields } from "@/components/quick/TemperatureFields";
import { TimeChips } from "@/components/quick/TimeChips";
import { WaterFields } from "@/components/quick/WaterFields";
import { Button } from "@/components/ui/Button";
import { Sheet } from "@/components/ui/Sheet";
import { toVietnameseError } from "@/lib/data/errors";
import { useAddInstant } from "@/lib/data/logs";
import { medicineWarnings } from "@/lib/rules/alerts";
import {
  buildDetails,
  initialQuickValues,
  MEDICINE_PRESETS,
  medicinePrefill,
  recentBottleAmounts,
  recentFoodNames,
  recentMedicineNames,
  type InstantType,
  type QuickValues,
} from "@/lib/rules/quickEntry";
import { parseCodes } from "@/lib/rules/symptomForm";
import {
  timeChipError,
  timeChipToDate,
  type TimeChip,
} from "@/lib/rules/timeChips";
import { toVnLocalInput } from "@/lib/rules/time";
import type { LogRow } from "@/lib/supabase/rows";
import { CATEGORIES } from "@/lib/ui/categories";

const TITLES: Record<InstantType, string> = {
  bottle: "Bú bình",
  diaper: "Thay tã",
  medicine: "Cho uống thuốc",
  temperature: "Đo nhiệt độ",
  solids: "Ăn dặm",
  water: "Uống nước",
  bath: "Tắm",
  note: "Ghi chú",
  symptom: "Triệu chứng",
};

export function QuickEntrySheet({
  type,
  babyId,
  userId,
  onClose,
  onSaved,
  initial,
  recentLogs = [],
  ageDays = null,
}: {
  type: InstantType;
  babyId: string;
  userId: string;
  onClose: () => void;
  onSaved?: (saved: {
    id: string;
    type: InstantType;
    details: Record<string, unknown>;
    at: Date;
  }) => void;
  initial?: QuickValues;
  recentLogs?: LogRow[];
  // Spec 2026-11-26 §3.5: filters the symptom chips; null shows them all.
  ageDays?: number | null;
}) {
  const add = useAddInstant(babyId, userId);
  const formId = useId();
  const [start] = useState<QuickValues>(() =>
    initialQuickValues(type, initial, recentLogs),
  );
  const [values, setValues] = useState<QuickValues>(start);
  const [chip, setChip] = useState<TimeChip>("now");
  const [custom, setCustom] = useState(() => toVnLocalInput(new Date()));
  const [message, setMessage] = useState<string | null>(null);

  const dirty =
    chip !== "now" || JSON.stringify(values) !== JSON.stringify(start);
  const warnings =
    type === "medicine" && values.antipyretic === true
      ? medicineWarnings({
          logs: recentLogs,
          at: timeChipToDate(chip, new Date(), custom),
        })
      : [];

  function submit(event: FormEvent) {
    event.preventDefault();
    const built = buildDetails(type, values);
    if (!built.ok) {
      setMessage(built.message);
      return;
    }
    const now = new Date();
    const when = timeChipToDate(chip, now, custom);
    const timeError = timeChipError(when, now);
    if (timeError) {
      setMessage(timeError);
      return;
    }
    setMessage(null);
    add.mutate(
      { type, details: built.details, at: when },
      {
        onSuccess: (id) => {
          onSaved?.({ id, type, details: built.details, at: when });
          onClose();
        },
        onError: (error) => setMessage(toVietnameseError(error)),
      },
    );
  }

  const fields = {
    bottle: (
      <BottleFields
        values={values}
        onChange={setValues}
        recent={recentBottleAmounts(recentLogs)}
      />
    ),
    diaper: <DiaperFields values={values} onChange={setValues} />,
    medicine: (
      <MedicineFields
        values={values}
        onChange={setValues}
        names={recentMedicineNames(recentLogs, MEDICINE_PRESETS)}
        onPick={(name) =>
          setValues((current) => ({
            ...current,
            ...medicinePrefill(name, recentLogs),
          }))
        }
        warnings={warnings}
      />
    ),
    temperature: <TemperatureFields values={values} onChange={setValues} />,
    solids: (
      <SolidsFields
        values={values}
        onChange={setValues}
        recent={recentFoodNames(recentLogs)}
      />
    ),
    water: <WaterFields values={values} onChange={setValues} />,
    // Tắm has no fields: the sheet is just the time chips and Lưu.
    bath: null,
    note: <NoteFields values={values} onChange={setValues} />,
    symptom: (
      <SymptomFields values={values} onChange={setValues} ageDays={ageDays} />
    ),
  }[type];
  // Spec 2026-11-26 §3.5: a symptom log needs at least one chip.
  const nothingPicked =
    type === "symptom" && parseCodes(values.codes).length === 0;

  return (
    <Sheet
      open
      onClose={onClose}
      title={TITLES[type]}
      icon={CATEGORIES[type].icon}
      iconColor={CATEGORIES[type].token}
      dirty={dirty}
      footer={
        <div className="flex flex-col gap-2">
          {message && (
            <p role="alert" className="text-[15px] text-danger">
              {message}
            </p>
          )}
          <Button
            type="submit"
            form={formId}
            block
            busy={add.isPending}
            disabled={nothingPicked}
            className="min-h-14!"
          >
            Lưu
          </Button>
        </div>
      }
    >
      <form id={formId} onSubmit={submit} className="flex flex-col gap-5 pt-1">
        {fields}
        <TimeChips
          chip={chip}
          custom={custom}
          onChip={setChip}
          onCustom={setCustom}
        />
      </form>
    </Sheet>
  );
}
