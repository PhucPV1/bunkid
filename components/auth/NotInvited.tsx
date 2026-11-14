"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { FIELD_INPUT, FIELD_LABEL } from "@/components/quick/styles";
import { Button } from "@/components/ui/Button";
import { Glass } from "@/components/ui/Glass";
import { supabase } from "@/lib/supabase/client";

export function NotInvited({ email }: { email: string }) {
  const queryClient = useQueryClient();
  const [familyName, setFamilyName] = useState("");
  const [displayName, setDisplayName] = useState("");

  const canCreate = useQuery({
    queryKey: ["can-create-family"],
    queryFn: async () => {
      const { data, error } = await supabase().rpc("can_create_family");
      if (error) throw error;
      return data;
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      const { error } = await supabase().rpc("create_family", {
        name: familyName.trim(),
        display_name: displayName.trim(),
      });
      if (error) throw error;
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["family-context"] }),
  });

  function submit(event: FormEvent) {
    event.preventDefault();
    if (familyName.trim() && displayName.trim()) create.mutate();
  }

  return (
    <main className="mx-auto flex max-w-md flex-col gap-[18px] px-4 pt-2 pb-4">
      <h1 className="px-1 text-[34px] leading-[41px] font-bold text-ink">
        Bạn chưa được mời
      </h1>
      <Glass className="flex flex-col gap-2 p-4 text-base text-ink">
        <p>
          Đang đăng nhập: <strong>{email}</strong>
        </p>
        <p className="text-muted">
          Nhờ ba/mẹ của bé thêm Gmail này vào gia đình.
        </p>
      </Glass>

      {canCreate.data === true && (
        <Glass as="form" onSubmit={submit} className="flex flex-col gap-3 p-4">
          <h2 className="text-[17px] font-semibold text-ink">Tạo gia đình</h2>
          <label className="flex flex-col gap-1.5">
            <span className={FIELD_LABEL}>Tên gia đình</span>
            <input
              className={FIELD_INPUT}
              maxLength={80}
              value={familyName}
              onChange={(e) => setFamilyName(e.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={FIELD_LABEL}>Bạn là (ví dụ Mẹ, Ba)</span>
            <input
              className={FIELD_INPUT}
              maxLength={40}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </label>
          <Button type="submit" block busy={create.isPending}>
            Tạo gia đình
          </Button>
          {create.isError && (
            <p role="alert" className="text-[15px] text-danger">
              Không tạo được gia đình. Thử lại sau.
            </p>
          )}
        </Glass>
      )}

      <Button
        variant="secondary"
        block
        onClick={() => void supabase().auth.signOut()}
      >
        Đăng xuất
      </Button>
    </main>
  );
}
