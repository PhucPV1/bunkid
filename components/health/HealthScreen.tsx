"use client";

import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { ListGroup, ListRow } from "@/components/ui/ListGroup";
import { type LiveLine, NavCard } from "@/components/ui/NavCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusChip } from "@/components/ui/StatusChip";
import { VACCINES } from "@/lib/content/vaccines";
import { type LmsRow, whoSex } from "@/lib/content/who";
import { useGrowth, useWhoTable } from "@/lib/data/growth";
import { useStatsLogs } from "@/lib/data/logs";
import { useVaccineDoses } from "@/lib/data/vaccines";
import {
  HEALTH_CARDS,
  HEALTH_EMERGENCY,
  HEALTH_GROWTH,
  HEALTH_SICK,
  HEALTH_STATS,
} from "@/lib/nav";
import { type AttentionItem, attentionItems } from "@/lib/rules/attention";
import { statsFetchSince } from "@/lib/rules/dailyStats";
import { formatDayShort, vnDayRange } from "@/lib/rules/days";
import {
  growthAlerts,
  growthStatus,
  type GrowthTone,
} from "@/lib/rules/growthAlerts";
import { vaccineCardText } from "@/lib/rules/exploreCards";
import {
  formatGrowthValue,
  type LatestGrowth,
  latestGrowth,
} from "@/lib/rules/growthForm";
import { indicatorSummaries } from "@/lib/rules/growthView";
import { habitStats } from "@/lib/rules/habits";
import { goalLine } from "@/lib/rules/heightView";
import { latestDay, nextMeasureDue } from "@/lib/rules/measureSchedule";
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

// Exported for the temporary fixture pages of the browser checks.
export function GrowthCard({
  latest,
  status,
  goal = null,
}: {
  latest: LatestGrowth | null;
  // null: the alerts are not worked out yet, so there is no chip.
  status: { text: string; tone: GrowthTone } | null;
  // Spec §3.4: "Mục tiêu {t} cm: {trạng thái}"; null without a target, and
  // until the status can be worked out.
  goal?: string | null;
}) {
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
        {/* The chip takes the place of the arrow: at 375 px "Gần ranh chuẩn"
            and the arrow together leave the name less room than it needs. */}
        {latest && status ? (
          <StatusChip tone={status.tone}>{status.text}</StatusChip>
        ) : (
          <Icon name="chevronRight" size={18} className="text-muted" />
        )}
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
      {latest && goal && (
        <span className="flex items-start gap-2 border-t border-line pt-3 text-[13px] leading-[18px] text-ink">
          <Icon
            name="flag"
            size={16}
            strokeWidth={2.2}
            // 16 px in an 18 px line: level with the first line when the
            // text wraps onto two.
            className="mt-px shrink-0 text-accent-text"
          />
          <span>{goal}</span>
        </span>
      )}
    </Link>
  );
}

// Spec 2026-11-25 §4. Exported for the temporary fixture pages of the browser
// checks.
export function AttentionList({ items }: { items: AttentionItem[] }) {
  return (
    <section className="flex flex-col gap-2.5">
      <SectionTitle>Cần chú ý</SectionTitle>
      <ListGroup>
        {items.map((item) => (
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
  );
}

export function HealthScreen({ baby }: { baby: Baby }) {
  const growth = useGrowth(baby.id);
  const doses = useVaccineDoses(baby.id);
  const now = new Date();
  const today = vnDateString(now);
  // Spec §7.2: the 14-day query of the Thống kê page, shared through its
  // cache. Until it has loaded there is no habit row.
  const logs = useStatsLogs(baby.id, statsFetchSince(vnDayRange(now, 14)));
  const habits = logs.data
    ? habitStats(logs.data, baby.dob, now).attention
    : null;
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
  const sex = whoSex(baby.sex);
  const wfa = useWhoTable("wfa", sex);
  const lhfa = useWhoTable("lhfa", sex);
  const hcfa = useWhoTable("hcfa", sex);
  // Spec 2026-11-25 §3.4: the alerts wait for the measurements and all three
  // tables, so the chip never shows a verdict that a late table would change.
  const measured =
    growth.data && wfa.data && lhfa.data && hcfa.data
      ? {
          rows: growth.data,
          tables: {
            wfa: wfa.data.rows as LmsRow[],
            lhfa: lhfa.data.rows as LmsRow[],
            hcfa: hcfa.data.rows as LmsRow[],
          },
          dob: baby.dob,
          sex,
        }
      : null;
  const alerts = measured
    ? growthAlerts({ ...measured, babyName: baby.name })
    : null;
  // Spec §5.6: with no alert, the chip says when the newest value of an
  // indicator is near the edge of the norm.
  const status =
    measured && alerts
      ? growthStatus(
          alerts,
          indicatorSummaries({ ...measured, alerts }).map((item) => item.near),
        )
      : null;
  const goal = measured
    ? goalLine({
        baby: {
          name: baby.name,
          dob: baby.dob,
          sex,
          father_height_cm: baby.father_height_cm,
          mother_height_cm: baby.mother_height_cm,
          target_height_cm: baby.target_height_cm,
        },
        rows: measured.rows,
        table: measured.tables.lhfa,
      })
    : null;
  // Spec §4, row 4: until the measurements have loaded there is no row.
  const lastMeasuredOn = latestDay(
    (growth.data ?? []).map((row) => row.measured_on),
  );
  const measure = growth.data
    ? {
        measureDue: nextMeasureDue({ dob: baby.dob, lastMeasuredOn, today })
          .measureDue,
        lastMeasuredOn,
      }
    : null;
  const attention = attentionItems({
    growth: alerts,
    vaccine: next,
    measure,
    habits,
    today,
  });
  const live: Partial<Record<string, LiveLine>> = {
    "/tiem-chung": {
      text: vaccineCardText(next),
      warn: next?.state === "overdue",
    },
  };

  return (
    <main className="mx-auto flex max-w-md flex-col gap-[22px] px-4 pt-2">
      <PageHeader title="Sức khỏe" />

      {attention.length > 0 && <AttentionList items={attention} />}

      <section className="flex flex-col gap-2.5">
        <SectionTitle>Theo dõi</SectionTitle>
        <GrowthCard
          latest={growth.data ? latestGrowth(growth.data) : null}
          status={status}
          goal={goal}
        />
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
