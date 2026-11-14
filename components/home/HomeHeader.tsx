"use client";

import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { IconButton } from "@/components/ui/IconButton";
import { LOGO_GRADIENT, LOGO_INK } from "@/lib/brand/logo";
import { useNightMode } from "@/lib/hooks/useTheme";

export function HomeHeaderView({
  name,
  age,
  night,
  onToggleNight,
}: {
  name: string;
  age: string;
  night: boolean;
  onToggleNight: () => void;
}) {
  const initial = name.trim().charAt(0).toUpperCase();
  return (
    <header className="flex items-center justify-between gap-3">
      <Link
        href="/cai-dat"
        className="flex min-h-11 min-w-0 items-center gap-2.5 text-ink"
      >
        <span
          aria-hidden="true"
          className="flex size-11 shrink-0 items-center justify-center rounded-full text-lg font-bold in-data-[theme=night]:opacity-60"
          style={{
            backgroundImage: `linear-gradient(140deg, ${LOGO_GRADIENT.from}, ${LOGO_GRADIENT.to})`,
            color: LOGO_INK,
          }}
        >
          {initial}
        </span>
        <span className="flex min-w-0 flex-col">
          <span className="truncate text-xl leading-6 font-bold">{name}</span>
          <span className="text-[13px] text-muted">{age}</span>
        </span>
      </Link>
      <div className="flex shrink-0 gap-2">
        <IconButton
          label={night ? "Tắt chế độ ban đêm" : "Bật chế độ ban đêm"}
          icon="moon"
          filled={night}
          aria-pressed={night}
          onClick={onToggleNight}
        />
        <Link
          href="/khan-cap"
          aria-label="Khẩn cấp"
          className="glass inline-flex size-11 items-center justify-center rounded-full text-danger"
        >
          <Icon name="phone" size={20} />
        </Link>
      </div>
    </header>
  );
}

export function HomeHeader({ name, age }: { name: string; age: string }) {
  const { night, toggle } = useNightMode();
  return (
    <HomeHeaderView
      name={name}
      age={age}
      night={night}
      onToggleNight={toggle}
    />
  );
}
