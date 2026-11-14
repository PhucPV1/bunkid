"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
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
    <main className="mx-auto flex max-w-md flex-col gap-4 p-6">
      <h1 className="text-2xl font-semibold">Bạn chưa được mời</h1>
      <p>
        Đang đăng nhập: <strong>{email}</strong>
      </p>
      <p className="text-muted">
        Nhờ ba/mẹ của bé thêm Gmail này vào gia đình.
      </p>

      {canCreate.data === true && (
        <form
          onSubmit={submit}
          className="flex flex-col gap-3 rounded-2xl border border-accent-line p-4"
        >
          <h2 className="font-medium">Tạo gia đình</h2>
          <label className="flex flex-col gap-1">
            Tên gia đình
            <input
              className="min-h-11 rounded-xl border px-3"
              maxLength={80}
              value={familyName}
              onChange={(e) => setFamilyName(e.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1">
            Bạn là (ví dụ Mẹ, Ba)
            <input
              className="min-h-11 rounded-xl border px-3"
              maxLength={40}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </label>
          <button
            type="submit"
            disabled={create.isPending}
            className="min-h-11 rounded-xl bg-accent text-on-accent disabled:opacity-50"
          >
            Tạo gia đình
          </button>
          {create.isError && (
            <p role="alert" className="text-danger">
              Không tạo được gia đình. Thử lại sau.
            </p>
          )}
        </form>
      )}

      <button
        type="button"
        onClick={() => supabase().auth.signOut()}
        className="min-h-11 rounded-xl border"
      >
        Đăng xuất
      </button>
    </main>
  );
}
