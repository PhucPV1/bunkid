"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { ErrorCard } from "@/components/ui/ErrorCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { useEmergencyContacts } from "@/lib/data/emergency";
import { toVietnameseError } from "@/lib/data/errors";
import { useGrowth } from "@/lib/data/growth";
import { latestWeightG } from "@/lib/rules/growthForm";
import type { Baby } from "@/lib/supabase/rows";
import { CallList } from "./CallList";
import { ContactsEditor } from "./ContactsEditor";
import { ProfileCard } from "./ProfileCard";

export function EmergencyScreen({
  baby,
  isOwner,
}: {
  baby: Baby;
  isOwner: boolean;
}) {
  const contacts = useEmergencyContacts(baby.family_id);
  const growth = useGrowth(baby.id);
  const [editing, setEditing] = useState(false);
  const rows = contacts.data ?? [];

  return (
    <main className="mx-auto flex max-w-md flex-col gap-[18px] px-4 pt-2 pb-4">
      <PageHeader
        title="Khẩn cấp"
        back={{ href: "/suc-khoe", label: "Sức khỏe" }}
      />
      <CallList contacts={rows} />
      {contacts.isError && !contacts.data && (
        <ErrorCard
          message={`Không tải được danh bạ: ${toVietnameseError(contacts.error)}`}
          onRetry={() => void contacts.refetch()}
        />
      )}
      {editing ? (
        <ContactsEditor
          familyId={baby.family_id}
          contacts={rows}
          onClose={() => setEditing(false)}
        />
      ) : (
        <Button variant="secondary" block onClick={() => setEditing(true)}>
          {rows.length === 0 ? "Thêm số bác sĩ, người thân" : "Sửa danh bạ"}
        </Button>
      )}
      <ProfileCard
        baby={baby}
        isOwner={isOwner}
        latestWeightG={latestWeightG(growth.data ?? [])}
      />
    </main>
  );
}
