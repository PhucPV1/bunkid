"use client";

import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import { useThemePref } from "@/lib/hooks/useTheme";
import { roleLabel } from "@/lib/rules/familySettings";
import { supabase } from "@/lib/supabase/client";
import type { Baby, FamilyMember } from "@/lib/supabase/rows";
import { THEME_OPTIONS } from "@/lib/theme";
import { OnlineOnly } from "@/components/OnlineOnly";
import { BabyProfileSection } from "./BabyProfileSection";
import { FeedIntervalSection } from "./FeedIntervalSection";
import { MembersSection } from "./MembersSection";
import { NotificationsSection } from "./NotificationsSection";

export function SettingsScreen({
  member,
  baby,
  email,
  userId,
}: {
  member: FamilyMember;
  baby: Baby;
  email: string;
  userId: string;
}) {
  const queryClient = useQueryClient();
  const [theme, setTheme] = useThemePref();
  const [signingOut, setSigningOut] = useState(false);
  const isOwner = member.role === "owner";

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

      <OnlineOnly>
        <BabyProfileSection baby={baby} isOwner={isOwner} />
        <FeedIntervalSection baby={baby} isOwner={isOwner} />
        <MembersSection me={member} />
        <NotificationsSection userId={userId} />
      </OnlineOnly>

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
          Cài Kim Bun lên màn hình chính
          <span aria-hidden="true">›</span>
        </Link>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-medium">Tài khoản</h2>
        <p>
          {member.display_name} · {roleLabel(member.role)}
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
