"use client";

import { useState, type FormEvent } from "react";
import { FIELD_INPUT, FIELD_LABEL } from "@/components/quick/styles";
import { Button } from "@/components/ui/Button";
import { ErrorCard } from "@/components/ui/ErrorCard";
import { ListGroup } from "@/components/ui/ListGroup";
import { Segmented } from "@/components/ui/Segmented";
import { Skeleton } from "@/components/ui/Skeleton";
import { memberErrorText } from "@/lib/data/errors";
import { useMemberActions, useMembers } from "@/lib/data/family";
import {
  parseMemberForm,
  roleLabel,
  type MemberFormRaw,
} from "@/lib/rules/familySettings";
import type { FamilyMember } from "@/lib/supabase/rows";

const EMPTY: MemberFormRaw = { email: "", displayName: "", role: "member" };

const ROLES = [
  { value: "member", label: "Thành viên" },
  { value: "owner", label: "Chủ gia đình" },
];

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
    <div className="flex flex-col gap-6">
      {members.isPending && (
        <div aria-busy="true" className="flex flex-col gap-2">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-[60px]" />
          ))}
        </div>
      )}
      {members.isError && (
        <ErrorCard
          message={memberErrorText(members.error)}
          onRetry={() => void members.refetch()}
        />
      )}
      {members.data && (
        <ListGroup>
          {members.data.map((member) => {
            const self = member.id === me.id;
            return (
              <li
                key={member.id}
                className="flex flex-col gap-2 border-b border-line px-4 py-3 last:border-b-0"
              >
                <div className="flex flex-col">
                  <span className="text-base font-medium text-ink">
                    {member.display_name}
                    {self && " (bạn)"} · {roleLabel(member.role)}
                  </span>
                  <span className="text-[13px] text-muted">
                    {member.email}
                    {member.user_id === null && " · chưa đăng nhập lần nào"}
                  </span>
                </div>
                {isOwner && !self && (
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      size="md"
                      className="flex-1"
                      disabled={busy}
                      onClick={() => {
                        clearErrors();
                        setRole.mutate({
                          id: member.id,
                          role: member.role === "owner" ? "member" : "owner",
                        });
                      }}
                    >
                      {member.role === "owner"
                        ? "Đổi thành Thành viên"
                        : "Đổi thành Chủ gia đình"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="md"
                      className="text-danger!"
                      disabled={busy}
                      onClick={() => confirmRemove(member)}
                    >
                      Xóa
                    </Button>
                  </div>
                )}
              </li>
            );
          })}
        </ListGroup>
      )}
      {failure && (
        <p role="alert" className="px-1 text-[15px] text-danger">
          {memberErrorText(failure)}
        </p>
      )}
      {isOwner ? (
        // Glass's prop type has no noValidate, so the form carries the glass class itself.
        <form
          noValidate
          onSubmit={submit}
          className="glass flex flex-col gap-3 rounded-[22px] p-4"
        >
          <h2 className="text-[17px] font-semibold text-ink">
            Thêm người vào gia đình
          </h2>
          <label className="flex flex-col gap-1.5">
            <span className={FIELD_LABEL}>Gmail</span>
            <input
              type="email"
              autoCapitalize="none"
              className={FIELD_INPUT}
              value={raw.email}
              onChange={(e) => setRaw({ ...raw, email: e.target.value })}
            />
            {errors.email && (
              <span className="text-[13px] text-danger">{errors.email}</span>
            )}
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={FIELD_LABEL}>Tên hiển thị (ví dụ Bà nội)</span>
            <input
              className={FIELD_INPUT}
              maxLength={40}
              value={raw.displayName}
              onChange={(e) => setRaw({ ...raw, displayName: e.target.value })}
            />
            {errors.displayName && (
              <span className="text-[13px] text-danger">
                {errors.displayName}
              </span>
            )}
          </label>
          <div className="flex flex-col gap-1.5">
            <span className={FIELD_LABEL}>Vai trò</span>
            <Segmented
              label="Vai trò"
              options={ROLES}
              value={raw.role}
              onChange={(role) => setRaw({ ...raw, role })}
            />
          </div>
          <Button type="submit" size="lg" block busy={busy}>
            Thêm
          </Button>
          <p className="text-[13px] text-muted">
            Người được thêm chỉ cần mở Kim Bun và đăng nhập Google bằng đúng
            Gmail này.
          </p>
        </form>
      ) : (
        <p className="px-4 text-[13px] text-muted">
          Chỉ chủ gia đình mới thêm, xóa hoặc đổi vai trò thành viên.
        </p>
      )}
    </div>
  );
}
