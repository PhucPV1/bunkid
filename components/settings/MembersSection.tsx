"use client";

import { useState, type FormEvent } from "react";
import { memberErrorText } from "@/lib/data/errors";
import { useMemberActions, useMembers } from "@/lib/data/family";
import {
  parseMemberForm,
  roleLabel,
  type MemberFormRaw,
} from "@/lib/rules/familySettings";
import type { FamilyMember } from "@/lib/supabase/rows";

const EMPTY: MemberFormRaw = { email: "", displayName: "", role: "member" };
const FIELD = "min-h-11 rounded-xl border px-3";

export function MembersSection({ me }: { me: FamilyMember }) {
  const members = useMembers(me.family_id);
  const { add, setRole, remove } = useMemberActions(me.family_id);
  const [raw, setRaw] = useState<MemberFormRaw>(EMPTY);
  const [errors, setErrors] = useState<
    Partial<Record<keyof MemberFormRaw, string>>
  >({});
  const isOwner = me.role === "owner";
  const failure = add.error ?? setRole.error ?? remove.error;
  const busy = add.isPending || setRole.isPending || remove.isPending;

  function clearErrors() {
    add.reset();
    setRole.reset();
    remove.reset();
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    clearErrors();
    const result = parseMemberForm(raw);
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    setErrors({});
    add.mutate(result.value, { onSuccess: () => setRaw(EMPTY) });
  }

  function confirmRemove(member: FamilyMember) {
    if (
      window.confirm(
        `Xóa ${member.display_name} (${member.email}) khỏi gia đình?`,
      )
    ) {
      clearErrors();
      remove.mutate(member.id);
    }
  }

  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-lg font-medium">Thành viên</h2>
      {members.isPending && <p className="text-muted">Đang tải…</p>}
      {members.isError && (
        <p role="alert" className="text-danger">
          {memberErrorText(members.error)}
        </p>
      )}
      <ul className="divide-y rounded-2xl border">
        {(members.data ?? []).map((member) => {
          const self = member.id === me.id;
          return (
            <li key={member.id} className="flex flex-col gap-2 p-3">
              <div>
                <p className="font-medium">
                  {member.display_name}
                  {self && " (bạn)"} · {roleLabel(member.role)}
                </p>
                <p className="text-sm text-muted">
                  {member.email}
                  {member.user_id === null && " · chưa đăng nhập lần nào"}
                </p>
              </div>
              {isOwner && !self && (
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => {
                      clearErrors();
                      setRole.mutate({
                        id: member.id,
                        role: member.role === "owner" ? "member" : "owner",
                      });
                    }}
                    className="min-h-11 flex-1 rounded-xl border disabled:opacity-50"
                  >
                    {member.role === "owner"
                      ? "Đổi thành Thành viên"
                      : "Đổi thành Chủ gia đình"}
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => confirmRemove(member)}
                    className="min-h-11 rounded-xl px-4 text-danger disabled:opacity-50"
                  >
                    Xóa
                  </button>
                </div>
              )}
            </li>
          );
        })}
      </ul>
      {failure && (
        <p role="alert" className="text-danger">
          {memberErrorText(failure)}
        </p>
      )}
      {isOwner ? (
        <form
          noValidate
          onSubmit={submit}
          className="flex flex-col gap-3 rounded-2xl border border-accent-line p-4"
        >
          <h3 className="font-medium">Thêm người vào gia đình</h3>
          <label className="flex flex-col gap-1">
            Gmail
            <input
              type="email"
              autoCapitalize="none"
              className={FIELD}
              value={raw.email}
              onChange={(e) => setRaw({ ...raw, email: e.target.value })}
            />
            {errors.email && (
              <span className="text-sm text-danger">{errors.email}</span>
            )}
          </label>
          <label className="flex flex-col gap-1">
            Tên hiển thị (ví dụ Bà nội)
            <input
              className={FIELD}
              maxLength={40}
              value={raw.displayName}
              onChange={(e) => setRaw({ ...raw, displayName: e.target.value })}
            />
            {errors.displayName && (
              <span className="text-sm text-danger">{errors.displayName}</span>
            )}
          </label>
          <label className="flex flex-col gap-1">
            Vai trò
            <select
              className={FIELD}
              value={raw.role}
              onChange={(e) => setRaw({ ...raw, role: e.target.value })}
            >
              <option value="member">Thành viên</option>
              <option value="owner">Chủ gia đình</option>
            </select>
          </label>
          <button
            type="submit"
            disabled={busy}
            className="min-h-11 rounded-xl bg-accent text-on-accent disabled:opacity-50"
          >
            Thêm
          </button>
          <p className="text-sm text-muted">
            Người được thêm chỉ cần mở Bé Yêu và đăng nhập Google bằng đúng
            Gmail này.
          </p>
        </form>
      ) : (
        <p className="text-sm text-muted">
          Chỉ chủ gia đình mới thêm, xóa hoặc đổi vai trò thành viên.
        </p>
      )}
    </section>
  );
}
