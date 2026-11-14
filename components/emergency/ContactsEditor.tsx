"use client";

import { useState, type FormEvent } from "react";
import { OnlineOnly } from "@/components/OnlineOnly";
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

// Spec §5.2: every member adds, edits, reorders and deletes contacts.
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

  const input = "min-h-11 rounded-xl border px-3";
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-medium">Sửa danh bạ</h2>
      <OnlineOnly>
        <ul className="divide-y rounded-2xl border">
          {list.map((contact, index) => (
            <li key={contact.id} className="flex items-center gap-1 px-2 py-1">
              <span className="min-w-0 flex-1 px-2">
                <span className="block truncate font-medium">
                  {contact.label}
                </span>
                <span className="block text-sm text-muted">
                  {contact.phone}
                </span>
              </span>
              <button
                type="button"
                aria-label={`Đưa ${contact.label} lên`}
                disabled={busy || index === 0}
                onClick={() =>
                  actions.reorder.mutate(moveContact(list, contact.id, -1), {
                    onError,
                  })
                }
                className="min-h-11 min-w-11 rounded-xl disabled:opacity-30"
              >
                ↑
              </button>
              <button
                type="button"
                aria-label={`Đưa ${contact.label} xuống`}
                disabled={busy || index === list.length - 1}
                onClick={() =>
                  actions.reorder.mutate(moveContact(list, contact.id, 1), {
                    onError,
                  })
                }
                className="min-h-11 min-w-11 rounded-xl disabled:opacity-30"
              >
                ↓
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => startEdit(contact)}
                className="min-h-11 min-w-11 rounded-xl px-2"
              >
                Sửa
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  if (!window.confirm(`Xóa "${contact.label}" khỏi danh bạ?`))
                    return;
                  if (contact.id === editingId) startEdit(null);
                  setMessage(null);
                  actions.remove.mutate(contact.id, { onError });
                }}
                className="min-h-11 min-w-11 rounded-xl px-2 text-danger"
              >
                Xóa
              </button>
            </li>
          ))}
        </ul>
        <form onSubmit={submit} className="flex flex-col gap-3">
          <h3 className="font-medium">
            {editingId ? "Sửa số điện thoại" : "Thêm số điện thoại"}
          </h3>
          <label className="flex flex-col gap-1">
            Tên (ví dụ: Bác sĩ nhi, Bệnh viện Nhi Đồng 1)
            <input
              className={input}
              maxLength={60}
              value={draft.label}
              onChange={(e) => setDraft({ ...draft, label: e.target.value })}
            />
          </label>
          <label className="flex flex-col gap-1">
            Số điện thoại
            <input
              type="tel"
              inputMode="tel"
              className={input}
              value={draft.phone}
              onChange={(e) => setDraft({ ...draft, phone: e.target.value })}
            />
          </label>
          <div className="flex gap-3">
            {editingId && (
              <button
                type="button"
                onClick={() => startEdit(null)}
                className="min-h-12 flex-1 rounded-2xl border"
              >
                Hủy sửa
              </button>
            )}
            <button
              type="submit"
              disabled={busy}
              className="min-h-12 flex-1 rounded-2xl bg-accent text-on-accent disabled:opacity-50"
            >
              Lưu
            </button>
          </div>
        </form>
      </OnlineOnly>
      {message && (
        <p role="alert" className="text-danger">
          {message}
        </p>
      )}
      <button
        type="button"
        onClick={onClose}
        className="min-h-12 rounded-2xl border"
      >
        Xong
      </button>
    </section>
  );
}
