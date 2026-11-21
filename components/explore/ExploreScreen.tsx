"use client";

import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { ListGroup, ListRow } from "@/components/ui/ListGroup";
import { PageHeader } from "@/components/ui/PageHeader";
import { VACCINES } from "@/lib/content/vaccines";
import { useGrowth } from "@/lib/data/growth";
import { useVaccineDoses } from "@/lib/data/vaccines";
import {
  EXPLORE_EMERGENCY,
  EXPLORE_GUIDES,
  EXPLORE_REPORT,
  EXPLORE_SOOTHE,
  EXPLORE_TRACK,
} from "@/lib/nav";
import { growthCardText, vaccineCardText } from "@/lib/rules/exploreCards";
import { vnDateString } from "@/lib/rules/time";
import { parseChoices, toDoseRecords } from "@/lib/rules/vaccineForm";
import { buildSchedule, nextDose } from "@/lib/rules/vaccines";
import type { Baby } from "@/lib/supabase/rows";
import type { CategoryToken } from "@/lib/ui/categories";
import { cx } from "@/lib/ui/cx";

const TINT: Record<CategoryToken, string> = {
  "cat-feed": "bg-cat-feed/15 text-cat-feed",
  "cat-bottle": "bg-cat-bottle/15 text-cat-bottle",
  "cat-sleep": "bg-cat-sleep/15 text-cat-sleep",
  "cat-diaper": "bg-cat-diaper/15 text-cat-diaper",
  "cat-pump": "bg-cat-pump/15 text-cat-pump",
  "cat-tummy": "bg-cat-tummy/15 text-cat-tummy",
  "cat-med": "bg-cat-med/15 text-cat-med",
  "cat-temp": "bg-cat-temp/15 text-cat-temp",
};

const TEXT: Record<CategoryToken, string> = {
  "cat-feed": "text-cat-feed",
  "cat-bottle": "text-cat-bottle",
  "cat-sleep": "text-cat-sleep",
  "cat-diaper": "text-cat-diaper",
  "cat-pump": "text-cat-pump",
  "cat-tummy": "text-cat-tummy",
  "cat-med": "text-cat-med",
  "cat-temp": "text-cat-temp",
};

function SectionTitle({ children }: { children: string }) {
  return <h2 className="mx-1 text-xl font-bold text-ink">{children}</h2>;
}

type LiveLine = { text: string | null; warn: boolean };

// Spec 2026-11-19 §9: a card with a live line shows it in at most two lines
// and falls back to the static description; the other cards stay as they were.
function TrackDetail({ detail, live }: { detail?: string; live?: LiveLine }) {
  if (!live)
    return (
      <span className="text-[13px] leading-[18px] text-muted">{detail}</span>
    );
  return (
    <span
      className={cx(
        "line-clamp-2 text-[13px] leading-[18px]",
        live.warn ? "font-semibold text-warn" : "text-muted",
      )}
    >
      {live.text ?? detail}
    </span>
  );
}

export function ExploreScreen({ baby }: { baby: Baby }) {
  const growth = useGrowth(baby.id);
  const doses = useVaccineDoses(baby.id);
  // No data yet (loading, offline, error) leaves the static descriptions.
  const next = doses.data
    ? nextDose(
        buildSchedule({
          doses: VACCINES.doses,
          choices: parseChoices(baby.vaccine_choices),
          dob: baby.dob,
          records: toDoseRecords(doses.data),
          today: vnDateString(new Date()),
        }),
      )
    : null;
  const live: Partial<Record<string, LiveLine>> = {
    "/tang-truong": {
      text: growth.data ? growthCardText(growth.data) : null,
      warn: false,
    },
    "/tiem-chung": {
      text: vaccineCardText(next),
      warn: next?.state === "overdue",
    },
  };

  return (
    <main className="mx-auto flex max-w-md flex-col gap-[22px] px-4 pt-2">
      <PageHeader title="Khám phá" />

      <Link
        href={EXPLORE_EMERGENCY.href}
        className="flex items-center gap-3.5 rounded-[26px] border border-danger/30 bg-danger-soft/75 p-4 text-danger-ink backdrop-blur-xl"
      >
        <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-danger-solid text-on-danger">
          <Icon name="phone" size={22} />
        </span>
        <span className="flex flex-1 flex-col gap-0.5">
          <span className="text-[17px] font-bold">
            {EXPLORE_EMERGENCY.label}
          </span>
          <span className="text-[13px]">{EXPLORE_EMERGENCY.detail}</span>
        </span>
        <Icon name="chevronRight" size={18} />
      </Link>

      <section className="flex flex-col gap-2.5">
        <SectionTitle>Theo dõi</SectionTitle>
        <div className="grid grid-cols-2 gap-2.5">
          {EXPLORE_TRACK.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="glass flex min-h-32 flex-col gap-1.5 rounded-[26px] p-4 text-ink"
            >
              <span
                className={cx(
                  "flex size-9 items-center justify-center rounded-full",
                  TINT[item.color],
                )}
              >
                <Icon name={item.icon} size={18} strokeWidth={2.2} />
              </span>
              <span className="text-base font-bold">{item.label}</span>
              <TrackDetail detail={item.detail} live={live[item.href]} />
            </Link>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-2.5">
        <SectionTitle>Cẩm nang</SectionTitle>
        <ListGroup>
          {EXPLORE_GUIDES.map((item) => (
            <ListRow
              key={item.href}
              label={item.label}
              detail={item.detail}
              icon={item.icon}
              iconColor={item.color}
              href={item.href}
            />
          ))}
        </ListGroup>
      </section>

      <section className="flex flex-col gap-2.5">
        <SectionTitle>Dỗ bé và kỷ niệm</SectionTitle>
        <div className="grid grid-cols-3 gap-2">
          {EXPLORE_SOOTHE.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center gap-1.5 text-ink"
            >
              <span
                className={cx(
                  "glass flex size-16 items-center justify-center rounded-[22px]",
                  TEXT[item.color],
                )}
              >
                <Icon name={item.icon} size={24} />
              </span>
              <span className="text-[13px] font-medium">{item.label}</span>
            </Link>
          ))}
        </div>
      </section>

      <ListGroup>
        <ListRow
          label={EXPLORE_REPORT.label}
          detail={EXPLORE_REPORT.detail}
          icon={EXPLORE_REPORT.icon}
          iconColor={EXPLORE_REPORT.color}
          href={EXPLORE_REPORT.href}
        />
      </ListGroup>
    </main>
  );
}
