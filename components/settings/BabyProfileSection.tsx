"use client";

import { BabyForm } from "@/components/baby/BabyForm";
import { Glass } from "@/components/ui/Glass";
import { ListGroup, ListRow } from "@/components/ui/ListGroup";
import { formatAgeVi } from "@/lib/rules/time";
import type { Baby } from "@/lib/supabase/rows";

export function BabyProfileSection({
  baby,
  isOwner,
}: {
  baby: Baby;
  isOwner: boolean;
}) {
  if (isOwner)
    return (
      <Glass className="p-4">
        <BabyForm familyId={baby.family_id} baby={baby} />
      </Glass>
    );
  const [y, m, d] = baby.dob.split("-");
  return (
    <ListGroup>
      <ListRow label="Tên" value={baby.name} />
      <ListRow
        label="Ngày sinh"
        detail={formatAgeVi(baby.dob, new Date())}
        value={`${d}/${m}/${y}`}
      />
      <ListRow
        label="Giới tính"
        value={baby.sex === "female" ? "Bé gái" : "Bé trai"}
      />
    </ListGroup>
  );
}
