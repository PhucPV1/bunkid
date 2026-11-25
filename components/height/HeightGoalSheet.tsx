"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useId, useState, type FormEvent } from "react";
import { FIELD_INPUT, FIELD_LABEL } from "@/components/quick/styles";
import { Button } from "@/components/ui/Button";
import { Sheet } from "@/components/ui/Sheet";
import { whoSex } from "@/lib/content/who";
import { updateBaby } from "@/lib/data/baby";
import { toVietnameseError } from "@/lib/data/errors";
import {
  type HeightGoalErrors,
  type HeightGoalInput,
  type HeightGoalRaw,
  heightGoalRaw,
  parseHeightGoal,
} from "@/lib/rules/heightGoal";
import { goalPreview } from "@/lib/rules/heightView";
import type { Baby } from "@/lib/supabase/rows";

const FIELDS: { key: keyof HeightGoalRaw; label: string; name: string }[] = [
  { key: "father", label: "Bố", name: "Chiều cao của bố, cm" },
  { key: "mother", label: "Mẹ", name: "Chiều cao của mẹ, cm" },
  { key: "target", label: "Mục tiêu của con", name: "Mục tiêu của con, cm" },
];
const NOTE = "text-[13px] leading-[18px] text-muted";

// Spec 2026-11-25 §6.5: the parents' heights and the target, entered by the
// owner of the family. Saved straight to the baby's profile, not through the
// outbox.
export function HeightGoalSheet({
  baby,
  onClose,
}: {
  baby: Baby;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const formId = useId();
  const [opened] = useState<HeightGoalRaw>(() => heightGoalRaw(baby));
  const [raw, setRaw] = useState<HeightGoalRaw>(opened);
  const [errors, setErrors] = useState<HeightGoalErrors>({});
  const save = useMutation({
    mutationFn: (value: HeightGoalInput) => updateBaby(baby.id, value),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["family-context"] });
      onClose();
    },
  });
  const preview = goalPreview(raw, whoSex(baby.sex));

  function submit(event: FormEvent) {
    event.preventDefault();
    const parsed = parseHeightGoal(raw);
    if (!parsed.ok) {
      setErrors(parsed.errors);
      return;
    }
    setErrors({});
    save.mutate(parsed.value);
  }

  return (
    <Sheet
      open
      onClose={onClose}
      title="Mục tiêu và chiều cao bố mẹ"
      dirty={JSON.stringify(raw) !== JSON.stringify(opened)}
      footer={
        <div className="flex flex-col gap-2">
          {save.isError && (
            <p role="alert" className="text-[15px] text-danger">
              {toVietnameseError(save.error)}
            </p>
          )}
          <Button
            type="submit"
            form={formId}
            block
            busy={save.isPending}
            className="min-h-14!"
          >
            Lưu
          </Button>
        </div>
      }
    >
      <form id={formId} onSubmit={submit} className="flex flex-col gap-4 pt-1">
        <p className={NOTE}>
          Nhập một lần. App dùng để tính khoảng chiều cao dự kiến của{" "}
          {baby.name}.
        </p>
        {FIELDS.map((field) => (
          <label key={field.key} className="flex flex-col gap-1.5">
            <span className={FIELD_LABEL}>{field.label}</span>
            <span className="flex items-center gap-2">
              <input
                inputMode="decimal"
                aria-label={field.name}
                className={`${FIELD_INPUT} tabular-nums`}
                value={raw[field.key]}
                onChange={(event) => {
                  setRaw({ ...raw, [field.key]: event.target.value });
                  save.reset();
                }}
              />
              <span className="text-[15px] text-muted">cm</span>
            </span>
            {errors[field.key] && (
              <span className="text-[13px] text-danger">
                {errors[field.key]}
              </span>
            )}
          </label>
        ))}
        {preview && (
          <div className="flex flex-col gap-1 rounded-[18px] bg-good-soft px-4 py-3 text-good-ink">
            <span className="text-base font-bold">{preview.range}</span>
            {preview.target && (
              <span className="text-[13px] leading-[18px]">
                {preview.target}
              </span>
            )}
          </div>
        )}
        <p className={NOTE}>
          Nếu mục tiêu nằm ngoài khoảng dự kiến, app vẫn theo dõi nhưng sẽ nói
          rõ là khó đạt.
        </p>
      </form>
    </Sheet>
  );
}
