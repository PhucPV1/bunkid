"use client";

import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import { OnlineOnly } from "@/components/OnlineOnly";
import { Icon } from "@/components/ui/Icon";
import { ListGroup, ListRow } from "@/components/ui/ListGroup";
import { PageHeader } from "@/components/ui/PageHeader";
import { LOGO_GRADIENT, LOGO_INK } from "@/lib/brand/logo";
import { useMembers } from "@/lib/data/family";
import { formatInterval, roleLabel } from "@/lib/rules/familySettings";
import { babySubtitle, memberCountText } from "@/lib/rules/settingsText";
import { supabase } from "@/lib/supabase/client";
import type { Baby, FamilyMember } from "@/lib/supabase/rows";
import { AppearanceGroup } from "./AppearanceGroup";
import { NotificationsGroup } from "./NotificationsGroup";

const PROFILE_CARD =
  "glass flex items-center gap-3.5 rounded-[26px] p-4 text-ink";

export function SettingsScreen({
  member,
  baby,
  userId,
}: {
  member: FamilyMember;
  baby: Baby;
  userId: string;
}) {
  const queryClient = useQueryClient();
  const members = useMembers(baby.family_id);
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

  const profile = (
    <>
      <span
        aria-hidden="true"
        className="flex size-[60px] shrink-0 items-center justify-center rounded-full text-2xl font-bold in-data-[theme=night]:opacity-60"
        style={{
          backgroundImage: `linear-gradient(140deg, ${LOGO_GRADIENT.from}, ${LOGO_GRADIENT.to})`,
          color: LOGO_INK,
        }}
      >
        {baby.name.trim().charAt(0).toUpperCase()}
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate text-xl font-bold">{baby.name}</span>
        <span className="text-sm text-muted">{babySubtitle(baby)}</span>
      </span>
    </>
  );

  return (
    <main className="mx-auto flex max-w-md flex-col gap-[22px] px-4 pt-2">
      <PageHeader title="Cài đặt" back={{ href: "/", label: "Hôm nay" }} />

      {isOwner ? (
        <Link href="/cai-dat/ho-so" className={PROFILE_CARD}>
          {profile}
          <Icon name="chevronRight" size={16} className="text-muted" />
        </Link>
      ) : (
        <div className={PROFILE_CARD}>{profile}</div>
      )}

      <OnlineOnly>
        <ListGroup title="Gia đình">
          <ListRow
            label="Thành viên"
            icon="users"
            iconColor="cat-sleep"
            value={
              members.data ? memberCountText(members.data.length) : undefined
            }
            href="/cai-dat/thanh-vien"
          />
          <ListRow
            label="Khoảng cách cữ bú"
            icon="clock"
            iconColor="cat-feed"
            value={formatInterval(baby.feed_interval_min)}
            href={isOwner ? "/cai-dat/cu-bu" : undefined}
          />
        </ListGroup>
        <NotificationsGroup userId={userId} />
      </OnlineOnly>

      <AppearanceGroup />

      <ListGroup title="Ứng dụng">
        <ListRow
          label="Cài Kim Bun lên màn hình chính"
          icon="phoneApp"
          iconColor="cat-temp"
          href="/cai-app"
        />
      </ListGroup>

      <ListGroup title="Tài khoản">
        <ListRow
          label={`${member.display_name} · ${roleLabel(member.role)}`}
          detail="Đăng nhập bằng Google"
        />
        <li>
          <button
            type="button"
            disabled={signingOut}
            onClick={signOut}
            className="flex min-h-[52px] w-full items-center justify-center text-base font-semibold text-danger disabled:opacity-50"
          >
            Đăng xuất
          </button>
        </li>
      </ListGroup>
    </main>
  );
}
