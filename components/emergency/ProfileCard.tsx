"use client";

import { useState } from "react";
import { OnlineOnly } from "@/components/OnlineOnly";
import { useSaveMedicalInfo } from "@/lib/data/emergency";
import { toVietnameseError } from "@/lib/data/errors";
import {
  ALLERGIES_MAX,
  BLOOD_TYPES,
  profileLines,
} from "@/lib/rules/emergency";
import type { Baby } from "@/lib/supabase/rows";

export function ProfileCard({
  baby,
  isOwner,
  latestWeightG,
}: {
  baby: Baby;
  isOwner: boolean;
  latestWeightG: number | null;
}) {
  const [editing, setEditing] = useState(false);
  return (
    <section className="flex flex-col gap-3 rounded-2xl bg-soft p-4">
      <h2 className="text-lg font-medium">Hồ sơ của bé</h2>
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
        {profileLines(baby, latestWeightG, new Date()).map((line) => (
          <div key={line.label} className="contents">
            <dt className="text-muted">{line.label}</dt>
            <dd className="font-medium">{line.value}</dd>
          </div>
        ))}
      </dl>
      {isOwner &&
        (editing ? (
          <MedicalInfoForm baby={baby} onClose={() => setEditing(false)} />
        ) : (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="min-h-11 rounded-xl border px-4"
          >
            Sửa nhóm máu, dị ứng
          </button>
        ))}
    </section>
  );
}

function MedicalInfoForm({
  baby,
  onClose,
}: {
  baby: Baby;
  onClose: () => void;
}) {
  const save = useSaveMedicalInfo(baby.id);
  const [bloodType, setBloodType] = useState(baby.blood_type ?? "");
  const [allergies, setAllergies] = useState(baby.allergies ?? "");
  return (
    <div className="flex flex-col gap-3">
      <OnlineOnly>
        <label className="flex flex-col gap-1">
          Nhóm máu
          <select
            className="min-h-11 rounded-xl border px-3"
            value={bloodType}
            onChange={(e) => setBloodType(e.target.value)}
          >
            <option value="">Chưa biết</option>
            {BLOOD_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          Dị ứng (thuốc, thức ăn…)
          <textarea
            className="min-h-20 rounded-xl border p-3"
            maxLength={ALLERGIES_MAX}
            value={allergies}
            onChange={(e) => setAllergies(e.target.value)}
          />
        </label>
        <button
          type="button"
          disabled={save.isPending}
          onClick={() =>
            save.mutate(
              {
                blood_type: bloodType || null,
                allergies: allergies.trim() || null,
              },
              { onSuccess: onClose },
            )
          }
          className="min-h-12 rounded-2xl bg-accent text-on-accent disabled:opacity-50"
        >
          Lưu
        </button>
      </OnlineOnly>
      {save.isError && (
        <p role="alert" className="text-danger">
          {toVietnameseError(save.error)}
        </p>
      )}
      <button
        type="button"
        onClick={onClose}
        className="min-h-11 rounded-xl border"
      >
        Đóng
      </button>
    </div>
  );
}
