"use client";

import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import { useThemePref } from "@/lib/hooks/useTheme";
import { supabase } from "@/lib/supabase/client";
import type { FamilyMember } from "@/lib/supabase/rows";
import { THEME_OPTIONS } from "@/lib/theme";

const ROLE_LABEL: Record<string, string> = {
  owner: "Chủ gia đình",
  member: "Thành viên",
};

export function SettingsScreen({
  member,
  email,
}: {
  member: FamilyMember;
  email: string;
}) {
  const queryClient = useQueryClient();
  const [theme, setTheme] = useThemePref();
  const [signingOut, setSigningOut] = useState(false);

  async function signOut() {
    setSigningOut(true);
    try {
      await supabase().auth.signOut();
      queryClient.clear();
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <main className="mx-auto flex max-w-md flex-col gap-6 p-4">
      <h1 className="text-2xl font-semibold">Cài đặt</h1>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-medium">Giao diện</h2>
        <div className="grid grid-cols-2 gap-2">
          {THEME_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={theme === option.value}
              onClick={() => setTheme(option.value)}
              className={`min-h-11 rounded-xl px-3 ${theme === option.value ? "bg-accent text-on-accent" : "bg-soft"}`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-medium">Ứng dụng</h2>
        <Link
          href="/cai-app"
          className="flex min-h-11 items-center justify-between rounded-xl border px-4"
        >
          Cài Bé Yêu lên màn hình chính
          <span aria-hidden="true">›</span>
        </Link>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-medium">Tài khoản</h2>
        <p>
          {member.display_name} · {ROLE_LABEL[member.role] ?? member.role}
        </p>
        <p className="text-muted">{email}</p>
        <button
          type="button"
          disabled={signingOut}
          onClick={signOut}
          className="min-h-11 rounded-xl border disabled:opacity-50"
        >
          Đăng xuất
        </button>
      </section>
    </main>
  );
}
