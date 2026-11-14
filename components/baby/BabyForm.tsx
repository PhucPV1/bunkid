"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { createBaby } from "@/lib/data/baby";
import { parseBabyForm, type BabyFormRaw } from "@/lib/rules/babyInput";
import { vnDateString } from "@/lib/rules/time";

const EMPTY: BabyFormRaw = {
  name: "",
  dob: "",
  sex: "",
  birthWeightG: "",
  birthLengthCm: "",
  birthHeadCm: "",
};

export function BabyForm({ familyId }: { familyId: string }) {
  const queryClient = useQueryClient();
  const [raw, setRaw] = useState<BabyFormRaw>(EMPTY);
  const [errors, setErrors] = useState<
    Partial<Record<keyof BabyFormRaw, string>>
  >({});

  const save = useMutation({
    mutationFn: createBaby.bind(null, familyId),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["family-context"] }),
  });

  function set<K extends keyof BabyFormRaw>(key: K, value: string) {
    setRaw((prev) => ({ ...prev, [key]: value }));
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

  const field = "min-h-11 rounded-xl border px-3";
  const error = (key: keyof BabyFormRaw) =>
    errors[key] ? (
      <span className="text-sm text-danger">{errors[key]}</span>
    ) : null;

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1">
        Tên bé
        <input
          className={field}
          value={raw.name}
          onChange={(e) => set("name", e.target.value)}
        />
        {error("name")}
      </label>
      <label className="flex flex-col gap-1">
        Ngày sinh
        <input
          type="date"
          className={field}
          max={vnDateString(new Date())}
          value={raw.dob}
          onChange={(e) => set("dob", e.target.value)}
        />
        {error("dob")}
      </label>
      <fieldset className="flex flex-col gap-1">
        <legend>Giới tính</legend>
        <div className="flex gap-3">
          {(["female", "male"] as const).map((sex) => (
            <label
              key={sex}
              className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border"
            >
              <input
                type="radio"
                name="sex"
                value={sex}
                checked={raw.sex === sex}
                onChange={() => set("sex", sex)}
              />
              {sex === "female" ? "Bé gái" : "Bé trai"}
            </label>
          ))}
        </div>
        {error("sex")}
      </fieldset>
      <label className="flex flex-col gap-1">
        Cân nặng lúc sinh (g, không bắt buộc)
        <input
          inputMode="numeric"
          className={field}
          value={raw.birthWeightG}
          onChange={(e) => set("birthWeightG", e.target.value)}
        />
        {error("birthWeightG")}
      </label>
      <label className="flex flex-col gap-1">
        Chiều dài lúc sinh (cm, không bắt buộc)
        <input
          inputMode="decimal"
          className={field}
          value={raw.birthLengthCm}
          onChange={(e) => set("birthLengthCm", e.target.value)}
        />
        {error("birthLengthCm")}
      </label>
      <label className="flex flex-col gap-1">
        Vòng đầu lúc sinh (cm, không bắt buộc)
        <input
          inputMode="decimal"
          className={field}
          value={raw.birthHeadCm}
          onChange={(e) => set("birthHeadCm", e.target.value)}
        />
        {error("birthHeadCm")}
      </label>
      <button
        type="submit"
        disabled={save.isPending}
        className="min-h-12 rounded-2xl bg-accent text-lg text-on-accent disabled:opacity-50"
      >
        Lưu
      </button>
      {save.isError && (
        <p role="alert" className="text-danger">
          Không lưu được. Thử lại sau.
        </p>
      )}
    </form>
  );
}
