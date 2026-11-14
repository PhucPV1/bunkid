"use client";

import { useState } from "react";
import { OnlineOnly } from "@/components/OnlineOnly";
import { FIELD_INPUT, FIELD_LABEL } from "@/components/quick/styles";
import { Button } from "@/components/ui/Button";
import { Glass } from "@/components/ui/Glass";
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
    <Glass as="section" className="flex flex-col gap-3 p-4">
      <h2 className="text-xl leading-[26px] font-bold text-ink">
        Hồ sơ của bé
      </h2>
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-[15px]">
        {profileLines(baby, latestWeightG, new Date()).map((line) => (
          <div key={line.label} className="contents">
            <dt className="text-muted">{line.label}</dt>
            <dd className="font-semibold text-ink tabular-nums">
              {line.value}
            </dd>
          </div>
        ))}
      </dl>
      {isOwner &&
        (editing ? (
          <MedicalInfoForm baby={baby} onClose={() => setEditing(false)} />
        ) : (
          <Button
            variant="secondary"
            size="md"
            onClick={() => setEditing(true)}
          >
            Sửa nhóm máu, dị ứng
          </Button>
        ))}
    </Glass>
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
        <label className="flex flex-col gap-1.5">
          <span className={FIELD_LABEL}>Nhóm máu</span>
          <select
            className={`${FIELD_INPUT} accent-accent`}
            value={bloodType}
            onChange={(event) => setBloodType(event.target.value)}
          >
            <option value="">Chưa biết</option>
            {BLOOD_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className={FIELD_LABEL}>Dị ứng (thuốc, thức ăn…)</span>
          <textarea
            className={`${FIELD_INPUT} min-h-20 py-2.5`}
            maxLength={ALLERGIES_MAX}
            value={allergies}
            onChange={(event) => setAllergies(event.target.value)}
          />
        </label>
        <Button
          block
          busy={save.isPending}
          onClick={() =>
            save.mutate(
              {
                blood_type: bloodType || null,
                allergies: allergies.trim() || null,
              },
              { onSuccess: onClose },
            )
          }
        >
          Lưu
        </Button>
      </OnlineOnly>
      {save.isError && (
        <p role="alert" className="text-[15px] text-danger">
          {toVietnameseError(save.error)}
        </p>
      )}
      <Button variant="secondary" size="md" block onClick={onClose}>
        Đóng
      </Button>
    </div>
  );
}
