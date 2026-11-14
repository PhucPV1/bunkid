"use client";

import { useState } from "react";
import { useEmergencyContacts } from "@/lib/data/emergency";
import { toVietnameseError } from "@/lib/data/errors";
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
  const [editing, setEditing] = useState(false);
  const rows = contacts.data ?? [];

  return (
    <main className="mx-auto flex max-w-md flex-col gap-4 p-4">
      <h1 className="text-2xl font-semibold">Khẩn cấp</h1>
      <CallList contacts={rows} />
      {contacts.isError && !contacts.data && (
        <p role="alert" className="text-danger">
          Không tải được danh bạ: {toVietnameseError(contacts.error)}
        </p>
      )}
      {editing ? (
        <ContactsEditor
          familyId={baby.family_id}
          contacts={rows}
          onClose={() => setEditing(false)}
        />
      ) : (
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="min-h-11 rounded-xl border px-4"
        >
          {rows.length === 0 ? "Thêm số bác sĩ, người thân" : "Sửa danh bạ"}
        </button>
      )}
      <ProfileCard baby={baby} isOwner={isOwner} latestWeightG={null} />
    </main>
  );
}
