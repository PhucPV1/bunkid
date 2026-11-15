"use client";

import { useId, useState, type FormEvent } from "react";
import { BottleFields } from "@/components/quick/BottleFields";
import { DiaperFields } from "@/components/quick/DiaperFields";
import { MedicineFields } from "@/components/quick/MedicineFields";
import { TemperatureFields } from "@/components/quick/TemperatureFields";
import { TimeChips } from "@/components/quick/TimeChips";
import { Button } from "@/components/ui/Button";
import { Sheet } from "@/components/ui/Sheet";
import { toVietnameseError } from "@/lib/data/errors";
import { useAddInstant } from "@/lib/data/logs";
import { medicineWarnings } from "@/lib/rules/alerts";
import {
  buildDetails,
  defaultQuickValues,
  MEDICINE_PRESETS,
  medicinePrefill,
  recentBottleAmounts,
  recentMedicineNames,
  type InstantType,
  type QuickValues,
} from "@/lib/rules/quickEntry";
import { timeChipToDate, type TimeChip } from "@/lib/rules/timeChips";
import { toVnLocalInput } from "@/lib/rules/time";
import type { LogRow } from "@/lib/supabase/rows";
import { CATEGORIES } from "@/lib/ui/categories";

const TITLES: Record<InstantType, string> = {
  bottle: "Bú bình",
  diaper: "Thay tã",
  medicine: "Cho uống thuốc",
  temperature: "Đo nhiệt độ",
};

export function QuickEntrySheet({
  type,
  babyId,
  userId,
  onClose,
  onSaved,
  initial,
  recentLogs = [],
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
}) {
  const add = useAddInstant(babyId, userId);
  const formId = useId();
  const [start] = useState<QuickValues>(() => ({
    ...defaultQuickValues(type),
    ...initial,
  }));
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
    const when = timeChipToDate(chip, new Date(), custom);
    if (Number.isNaN(when.getTime())) {
      setMessage("Chọn giờ hợp lệ");
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
  }[type];

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
