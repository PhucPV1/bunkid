"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { FIELD_INPUT, FIELD_LABEL } from "@/components/quick/styles";
import { Button } from "@/components/ui/Button";
import { Segmented } from "@/components/ui/Segmented";
import { createBaby, updateBaby } from "@/lib/data/baby";
import { toVietnameseError } from "@/lib/data/errors";
import {
  babyToRaw,
  parseBabyForm,
  type BabyFormRaw,
  type BabyInput,
} from "@/lib/rules/babyInput";
import { vnDateString } from "@/lib/rules/time";
import type { Baby } from "@/lib/supabase/rows";

const EMPTY: BabyFormRaw = {
  name: "",
  dob: "",
  sex: "",
  birthWeightG: "",
  birthLengthCm: "",
  birthHeadCm: "",
};

const SEXES = [
  { value: "female", label: "Bé gái" },
  { value: "male", label: "Bé trai" },
];

export function BabyForm({
  familyId,
  baby,
  onCreated,
}: {
  familyId: string;
  baby?: Baby;
  onCreated?: (created: Baby) => void;
}) {
  const queryClient = useQueryClient();
  const [raw, setRaw] = useState<BabyFormRaw>(() =>
    baby ? babyToRaw(baby) : EMPTY,
  );
  const [errors, setErrors] = useState<
    Partial<Record<keyof BabyFormRaw, string>>
  >({});

  const save = useMutation({
    mutationFn: async (value: BabyInput): Promise<Baby | null> => {
      if (!baby) return createBaby(familyId, value);
      await updateBaby(baby.id, value);
      return null;
    },
    onSuccess: async (created) => {
      // Tell the page first, so it can hold the gate before the refetch sees the baby.
      if (created) onCreated?.(created);
      await queryClient.invalidateQueries({ queryKey: ["family-context"] });
    },
  });

  function set<K extends keyof BabyFormRaw>(key: K, value: string) {
    setRaw((prev) => ({ ...prev, [key]: value }));
    save.reset();
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    const result = parseBabyForm(raw, new Date());
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    setErrors({});
    save.mutate(result.value);
  }

  const error = (key: keyof BabyFormRaw) =>
    errors[key] ? (
      <span className="text-[13px] text-danger">{errors[key]}</span>
    ) : null;

  const text = (
    key: "name" | "birthWeightG" | "birthLengthCm" | "birthHeadCm",
    label: string,
    inputMode?: "numeric" | "decimal",
  ) => (
    <label className="flex flex-col gap-1.5">
      <span className={FIELD_LABEL}>{label}</span>
      <input
        inputMode={inputMode}
        className={inputMode ? `${FIELD_INPUT} tabular-nums` : FIELD_INPUT}
        value={raw[key]}
        onChange={(e) => set(key, e.target.value)}
      />
      {error(key)}
    </label>
  );

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      {text("name", "Tên bé")}
      <label className="flex flex-col gap-1.5">
        <span className={FIELD_LABEL}>Ngày sinh</span>
        <input
          type="date"
          className={FIELD_INPUT}
          max={vnDateString(new Date())}
          value={raw.dob}
          onChange={(e) => set("dob", e.target.value)}
        />
        {error("dob")}
      </label>
      <div className="flex flex-col gap-1.5">
        <span className={FIELD_LABEL}>Giới tính</span>
        <Segmented
          label="Giới tính"
          options={SEXES}
          value={raw.sex}
          onChange={(sex) => set("sex", sex)}
        />
        {error("sex")}
      </div>
      {text("birthWeightG", "Cân nặng lúc sinh (g, không bắt buộc)", "numeric")}
      {text(
        "birthLengthCm",
        "Chiều dài lúc sinh (cm, không bắt buộc)",
        "decimal",
      )}
      {text("birthHeadCm", "Vòng đầu lúc sinh (cm, không bắt buộc)", "decimal")}
      <Button type="submit" size="lg" block busy={save.isPending}>
        Lưu
      </Button>
      {save.isError && (
        <p role="alert" className="text-[15px] text-danger">
          {baby
            ? toVietnameseError(save.error)
            : "Không lưu được. Thử lại sau."}
        </p>
      )}
      {baby && save.isSuccess && (
        <p role="status" className="text-[15px] text-good-ink">
          Đã lưu.
        </p>
      )}
    </form>
  );
}
