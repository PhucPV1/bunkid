"use client";

import { useState, type FormEvent } from "react";
import { OnlineOnly } from "@/components/OnlineOnly";
import { FIELD_INPUT, FIELD_LABEL } from "@/components/quick/styles";
import { Button } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/IconButton";
import { ListGroup } from "@/components/ui/ListGroup";
import { useContactActions } from "@/lib/data/emergency";
import { toVietnameseError } from "@/lib/data/errors";
import {
  moveContact,
  nextSort,
  parseContactForm,
  sortContacts,
  type ContactInput,
} from "@/lib/rules/emergency";
import type { EmergencyContactRow } from "@/lib/supabase/rows";

const EMPTY: ContactInput = { label: "", phone: "" };

// Spec gốc §5.2: every member adds, edits, reorders and deletes contacts.
export function ContactsEditor({
  familyId,
  contacts,
  onClose,
}: {
  familyId: string;
  contacts: EmergencyContactRow[];
  onClose: () => void;
}) {
  const actions = useContactActions(familyId);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<ContactInput>(EMPTY);
  const [message, setMessage] = useState<string | null>(null);
  const list = sortContacts(contacts);
  const onError = (e: unknown) => setMessage(toVietnameseError(e));
  const busy =
    actions.add.isPending ||
    actions.edit.isPending ||
    actions.reorder.isPending ||
    actions.remove.isPending;

  function startEdit(contact: EmergencyContactRow | null) {
    setEditingId(contact?.id ?? null);
    setDraft(contact ? { label: contact.label, phone: contact.phone } : EMPTY);
    setMessage(null);
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    const parsed = parseContactForm(draft);
    if (!parsed.ok) {
      setMessage(parsed.message);
      return;
    }
    const done = { onSuccess: () => startEdit(null), onError };
    setMessage(null);
    if (editingId)
      actions.edit.mutate({ id: editingId, input: parsed.value }, done);
    else
      actions.add.mutate({ ...parsed.value, sort: nextSort(contacts) }, done);
  }

  return (
    <section className="flex flex-col gap-3">
      <h2 className="px-1 text-xl leading-[26px] font-bold text-ink">
        Sửa danh bạ
      </h2>
      <OnlineOnly>
        {list.length > 0 && (
          <ListGroup>
            {list.map((contact, index) => (
              <li
                key={contact.id}
                className="flex items-center gap-1 border-b border-line py-1 pr-2 pl-4 last:border-b-0"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-base font-medium text-ink">
                    {contact.label}
                  </span>
                  <span className="block text-[13px] text-muted tabular-nums">
                    {contact.phone}
                  </span>
                </span>
                <IconButton
                  label={`Đưa ${contact.label} lên`}
                  icon="chevronUp"
                  variant="plain"
                  disabled={busy || index === 0}
                  onClick={() =>
                    actions.reorder.mutate(moveContact(list, contact.id, -1), {
                      onError,
                    })
                  }
                />
                <IconButton
                  label={`Đưa ${contact.label} xuống`}
                  icon="chevronDown"
                  variant="plain"
                  disabled={busy || index === list.length - 1}
                  onClick={() =>
                    actions.reorder.mutate(moveContact(list, contact.id, 1), {
                      onError,
                    })
                  }
                />
                <Button
                  variant="ghost"
                  size="md"
                  disabled={busy}
                  onClick={() => startEdit(contact)}
                >
                  Sửa
                </Button>
                <Button
                  variant="ghost"
                  size="md"
                  disabled={busy}
                  className="text-danger!"
                  onClick={() => {
                    if (!window.confirm(`Xóa "${contact.label}" khỏi danh bạ?`))
                      return;
                    if (contact.id === editingId) startEdit(null);
                    setMessage(null);
                    actions.remove.mutate(contact.id, { onError });
                  }}
                >
                  Xóa
                </Button>
              </li>
            ))}
          </ListGroup>
        )}
        <form onSubmit={submit} className="flex flex-col gap-3">
          <h3 className="px-1 text-[17px] font-semibold text-ink">
            {editingId ? "Sửa số điện thoại" : "Thêm số điện thoại"}
          </h3>
          <label className="flex flex-col gap-1.5">
            <span className={FIELD_LABEL}>
              Tên (ví dụ: Bác sĩ nhi, Bệnh viện Nhi Đồng 1)
            </span>
            <input
              className={FIELD_INPUT}
              maxLength={60}
              value={draft.label}
              onChange={(event) =>
                setDraft({ ...draft, label: event.target.value })
              }
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={FIELD_LABEL}>Số điện thoại</span>
            <input
              type="tel"
              inputMode="tel"
              className={`${FIELD_INPUT} tabular-nums`}
              value={draft.phone}
              onChange={(event) =>
                setDraft({ ...draft, phone: event.target.value })
              }
            />
          </label>
          <div className="flex gap-3">
            {editingId && (
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => startEdit(null)}
              >
                Hủy sửa
              </Button>
            )}
            <Button type="submit" busy={busy} className="flex-1">
              Lưu
            </Button>
          </div>
        </form>
      </OnlineOnly>
      {message && (
        <p role="alert" className="text-[15px] text-danger">
          {message}
        </p>
      )}
      <Button variant="secondary" block onClick={onClose}>
        Xong
      </Button>
    </section>
  );
}
