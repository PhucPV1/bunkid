"use client";

import { BabyForm } from "@/components/baby/BabyForm";
import { formatAgeVi } from "@/lib/rules/time";
import type { Baby } from "@/lib/supabase/rows";

export function BabyProfileSection({
  baby,
  isOwner,
}: {
  baby: Baby;
  isOwner: boolean;
}) {
  const [y, m, d] = baby.dob.split("-");
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-lg font-medium">Hồ sơ bé</h2>
      {isOwner ? (
        <BabyForm familyId={baby.family_id} baby={baby} />
      ) : (
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
          <dt className="text-muted">Tên</dt>
          <dd>{baby.name}</dd>
          <dt className="text-muted">Ngày sinh</dt>
          <dd>
            {d}/{m}/{y} ({formatAgeVi(baby.dob, new Date())})
          </dd>
          <dt className="text-muted">Giới tính</dt>
          <dd>{baby.sex === "female" ? "Bé gái" : "Bé trai"}</dd>
        </dl>
      )}
    </section>
  );
}
