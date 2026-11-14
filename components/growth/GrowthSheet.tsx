"use client";

import { useId, useState, type FormEvent } from "react";
import { FIELD_INPUT, FIELD_LABEL } from "@/components/quick/styles";
import { Button } from "@/components/ui/Button";
import { Sheet } from "@/components/ui/Sheet";
import { toVietnameseError } from "@/lib/data/errors";
import { useGrowthActions } from "@/lib/data/growth";
import {
  growthToRaw,
  parseGrowthForm,
  type GrowthFormRaw,
} from "@/lib/rules/growthForm";
import { vnDateString } from "@/lib/rules/time";
import type { GrowthRow } from "@/lib/supabase/rows";

const FIELDS: {
  key: Exclude<keyof GrowthFormRaw, "measuredOn">;
  label: string;
}[] = [
  { key: "weightKg", label: "Cân nặng (kg, ví dụ 5,2)" },
  { key: "lengthCm", label: "Chiều dài (cm)" },
  { key: "headCm", label: "Vòng đầu (cm)" },
];

export function GrowthSheet({
  babyId,
  userId,
  dob,
  row,
  canDelete,
  onClose,
}: {
  babyId: string;
  userId: string;
  dob: string;
  row: GrowthRow | null;
  canDelete: boolean;
  onClose: () => void;
}) {
  const actions = useGrowthActions(babyId, userId);
  const formId = useId();
  const today = vnDateString(new Date());
  const [opened] = useState<GrowthFormRaw>(() =>
    row
      ? growthToRaw(row)
      : { measuredOn: today, weightKg: "", lengthCm: "", headCm: "" },
  );
  const [raw, setRaw] = useState<GrowthFormRaw>(opened);
  const [errors, setErrors] = useState<
    Partial<Record<keyof GrowthFormRaw, string>>
  >({});
  const [message, setMessage] = useState<string | null>(null);
  const saving = actions.add.isPending || actions.update.isPending;
  const deleting = actions.remove.isPending;
  const done = {
    onSuccess: onClose,
    onError: (error: unknown) => setMessage(toVietnameseError(error)),
  };

  function submit(event: FormEvent) {
    event.preventDefault();
    const parsed = parseGrowthForm(raw, { dob, today });
    if (!parsed.ok) {
      setErrors(parsed.errors);
      return;
    }
    setErrors({});
    if (row) actions.update.mutate({ id: row.id, input: parsed.value }, done);
    else actions.add.mutate(parsed.value, done);
  }

  const error = (key: keyof GrowthFormRaw) =>
    errors[key] ? (
      <span className="text-[13px] text-danger">{errors[key]}</span>
    ) : null;

  return (
    <Sheet
      open
      onClose={onClose}
      title={row ? "Sửa lần đo" : "Thêm lần đo"}
      dirty={JSON.stringify(raw) !== JSON.stringify(opened)}
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
            busy={saving}
            disabled={deleting}
            className="min-h-14!"
          >
            Lưu
          </Button>
          {row && canDelete && (
            <Button
              variant="ghost"
              block
              disabled={saving || deleting}
              className="text-danger!"
              onClick={() => {
                if (window.confirm("Xóa lần đo này?"))
                  actions.remove.mutate(row.id, done);
              }}
            >
              Xóa lần đo
            </Button>
          )}
        </div>
      }
    >
      <form id={formId} onSubmit={submit} className="flex flex-col gap-4 pt-1">
        <label className="flex flex-col gap-1.5">
          <span className={FIELD_LABEL}>Ngày đo</span>
          <input
            type="date"
            className={FIELD_INPUT}
            min={dob}
            max={today}
            value={raw.measuredOn}
            onChange={(event) =>
              setRaw({ ...raw, measuredOn: event.target.value })
            }
          />
          {error("measuredOn")}
        </label>
        {FIELDS.map((field) => (
          <label key={field.key} className="flex flex-col gap-1.5">
            <span className={FIELD_LABEL}>{field.label}</span>
            <input
              inputMode="decimal"
              className={`${FIELD_INPUT} tabular-nums`}
              value={raw[field.key]}
              onChange={(event) =>
                setRaw({ ...raw, [field.key]: event.target.value })
              }
            />
            {error(field.key)}
          </label>
        ))}
      </form>
    </Sheet>
  );
}
