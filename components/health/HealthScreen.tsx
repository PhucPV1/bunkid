"use client";

import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { ListGroup, ListRow } from "@/components/ui/ListGroup";
import { type LiveLine, NavCard } from "@/components/ui/NavCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { VACCINES } from "@/lib/content/vaccines";
import { useGrowth } from "@/lib/data/growth";
import { useVaccineDoses } from "@/lib/data/vaccines";
import {
  HEALTH_CARDS,
  HEALTH_EMERGENCY,
  HEALTH_GROWTH,
  HEALTH_SICK,
  HEALTH_STATS,
} from "@/lib/nav";
import { attentionItems } from "@/lib/rules/attention";
import { formatDayShort } from "@/lib/rules/days";
import { vaccineCardText } from "@/lib/rules/exploreCards";
import {
  formatGrowthValue,
  type LatestGrowth,
  latestGrowth,
} from "@/lib/rules/growthForm";
import { vnDateString } from "@/lib/rules/time";
import { parseChoices, toDoseRecords } from "@/lib/rules/vaccineForm";
import { buildSchedule, nextDose } from "@/lib/rules/vaccines";
import type { Baby } from "@/lib/supabase/rows";
import { CATEGORY_CHIP } from "@/lib/ui/categories";
import { cx } from "@/lib/ui/cx";

function SectionTitle({ children }: { children: string }) {
  return <h2 className="mx-1 text-xl font-bold text-ink">{children}</h2>;
}

// Spec 2026-11-25 §3.4: the newest value of each indicator, "—" when the
// indicator was never measured.
function growthCells(latest: LatestGrowth): [title: string, value: string][] {
  return [
    [
      "Cân nặng",
      latest.weightG === null
        ? "—"
        : formatGrowthValue("wfa", latest.weightG / 1000),
    ],
    [
      "Chiều dài",
      latest.lengthCm === null
        ? "—"
        : formatGrowthValue("lhfa", latest.lengthCm),
    ],
    [
      "Vòng đầu",
      latest.headCm === null ? "—" : formatGrowthValue("hcfa", latest.headCm),
    ],
  ];
}

function GrowthCard({ latest }: { latest: LatestGrowth | null }) {
  return (
    <Link
      href={HEALTH_GROWTH.href}
      className="glass flex flex-col gap-3.5 rounded-[26px] p-4 text-ink"
    >
      <span className="flex items-center gap-3">
        <span
          className={cx(
            "flex size-9 shrink-0 items-center justify-center rounded-full",
            CATEGORY_CHIP[HEALTH_GROWTH.color],
          )}
        >
          <Icon name={HEALTH_GROWTH.icon} size={18} strokeWidth={2.2} />
        </span>
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="text-base font-bold">{HEALTH_GROWTH.label}</span>
          <span className="text-[13px] leading-[18px] text-muted">
            {latest
              ? `Đo gần nhất ${formatDayShort(latest.measuredOn)}`
              : HEALTH_GROWTH.detail}
          </span>
        </span>
        <Icon name="chevronRight" size={18} className="text-muted" />
      </span>
      {latest && (
        <span className="grid grid-cols-3 gap-2">
          {growthCells(latest).map(([title, value]) => (
            <span key={title} className="flex flex-col">
              <span className="text-xs text-muted">{title}</span>
              <span className="text-xl leading-[26px] font-bold tabular-nums">
                {value}
              </span>
            </span>
          ))}
        </span>
      )}
    </Link>
  );
}

export function HealthScreen({ baby }: { baby: Baby }) {
  const growth = useGrowth(baby.id);
  const doses = useVaccineDoses(baby.id);
  const today = vnDateString(new Date());
  // No data yet (loading, offline, error): no row and the static description.
  const next = doses.data
    ? nextDose(
        buildSchedule({
          doses: VACCINES.doses,
          choices: parseChoices(baby.vaccine_choices),
          dob: baby.dob,
          records: toDoseRecords(doses.data),
          today,
        }),
      )
    : null;
  const attention = attentionItems({ vaccine: next, today });
  const live: Partial<Record<string, LiveLine>> = {
    "/tiem-chung": {
      text: vaccineCardText(next),
      warn: next?.state === "overdue",
    },
  };

  return (
    <main className="mx-auto flex max-w-md flex-col gap-[22px] px-4 pt-2">
      <PageHeader title="Sức khỏe" />

      {attention.length > 0 && (
        <section className="flex flex-col gap-2.5">
          <SectionTitle>Cần chú ý</SectionTitle>
          <ListGroup>
            {attention.map((item) => (
              <ListRow
                key={item.key}
                label={item.title}
                detail={item.detail}
                detailTone={item.tone === "normal" ? "muted" : item.tone}
                icon={item.icon}
                iconColor={item.color}
                href={item.href}
              />
            ))}
          </ListGroup>
        </section>
      )}

      <section className="flex flex-col gap-2.5">
        <SectionTitle>Theo dõi</SectionTitle>
        <GrowthCard latest={growth.data ? latestGrowth(growth.data) : null} />
        <div className="grid grid-cols-2 gap-2.5">
          {HEALTH_CARDS.map((item) => (
            <NavCard key={item.href} item={item} live={live[item.href]} short />
          ))}
        </div>
        <ListGroup>
          <ListRow
            label={HEALTH_STATS.label}
            detail={HEALTH_STATS.detail}
            icon={HEALTH_STATS.icon}
            iconColor={HEALTH_STATS.color}
            href={HEALTH_STATS.href}
          />
        </ListGroup>
      </section>

      <section className="flex flex-col gap-2.5">
        <SectionTitle>Khi bé ốm</SectionTitle>
        <Link
          href={HEALTH_EMERGENCY.href}
          className="flex items-center gap-3.5 rounded-[26px] border border-danger/30 bg-danger-soft/75 p-4 text-danger-ink backdrop-blur-xl"
        >
          <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-danger-solid text-on-danger">
            <Icon name="phone" size={22} />
          </span>
          <span className="flex flex-1 flex-col gap-0.5">
            <span className="text-[17px] font-bold">
              {HEALTH_EMERGENCY.label}
            </span>
            <span className="text-[13px]">{HEALTH_EMERGENCY.detail}</span>
          </span>
          <Icon name="chevronRight" size={18} />
        </Link>
        <ListGroup>
          {HEALTH_SICK.map((item) => (
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
    </main>
  );
}
