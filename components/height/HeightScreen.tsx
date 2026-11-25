"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { ErrorCard } from "@/components/ui/ErrorCard";
import { IconButton } from "@/components/ui/IconButton";
import { NeedsNetwork, waitingForNetwork } from "@/components/ui/NeedsNetwork";
import { PageHeader } from "@/components/ui/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { whoSex, type LmsRow } from "@/lib/content/who";
import { toVietnameseError } from "@/lib/data/errors";
import { useGrowth, useWhoTable } from "@/lib/data/growth";
import { useStatsLogs } from "@/lib/data/logs";
import { statsFetchSince } from "@/lib/rules/dailyStats";
import { vnDayRange } from "@/lib/rules/days";
import { habitStats } from "@/lib/rules/habits";
import { heightView } from "@/lib/rules/heightView";
import { latestDay, measureReminder } from "@/lib/rules/measureSchedule";
import { vnDateString } from "@/lib/rules/time";
import type { Baby } from "@/lib/supabase/rows";
import {
  HeightGoalCard,
  ParentalRangeCard,
  TargetPathCard,
  VelocityCard,
} from "./HeightCards";
import { HabitsCard } from "./HabitsCard";
import { HeightGoalSheet } from "./HeightGoalSheet";
import { MeasureReminderRow } from "./MeasureReminderRow";

const NOTE = "px-1 text-[13px] leading-[18px] text-muted";

function ChartUnavailable() {
  return <p className="h-72 text-muted">Biểu đồ cần mạng để tải lần đầu.</p>;
}

const GrowthChart = dynamic(
  () =>
    import("@/components/growth/GrowthChart")
      .then((m) => m.GrowthChart)
      .catch(() => ChartUnavailable),
  { ssr: false, loading: () => <div className="h-72" /> },
);

// Spec 2026-11-25 §6.3: the target height, the range the parents' heights
// give, the path to the target and how fast the baby is growing.
export function HeightScreen({
  baby,
  isOwner,
  userId,
}: {
  baby: Baby;
  isOwner: boolean;
  // Spec §8.3: whose "Nhắc đo định kỳ" switch the reminder row shows.
  userId: string;
}) {
  const growth = useGrowth(baby.id);
  // Spec §6.5: only the owner of the family may open the sheet.
  const [editing, setEditing] = useState(false);
  const edit = isOwner ? () => setEditing(true) : undefined;
  const sex = whoSex(baby.sex);
  const table = useWhoTable("lhfa", sex);
  // Spec §7.2: the 14-day query of the Thống kê page, shared through its
  // cache; the habits read the seven full days before today from it.
  const now = new Date();
  const logs = useStatsLogs(baby.id, statsFetchSince(vnDayRange(now, 14)));
  const habits = logs.data ? habitStats(logs.data, baby.dob, now) : null;
  // Spec §8.3: counted from the newest measurement of any indicator.
  const reminder = growth.data
    ? measureReminder({
        dob: baby.dob,
        lastMeasuredOn: latestDay(growth.data.map((row) => row.measured_on)),
        today: vnDateString(now),
      })
    : null;
  const view =
    growth.data && table.data
      ? heightView({
          baby: {
            name: baby.name,
            dob: baby.dob,
            sex,
            father_height_cm: baby.father_height_cm,
            mother_height_cm: baby.mother_height_cm,
            target_height_cm: baby.target_height_cm,
          },
          rows: growth.data,
          table: table.data.rows as LmsRow[],
          today: now,
        })
      : null;

  return (
    <main className="mx-auto flex max-w-md flex-col gap-[18px] px-4 pt-2 pb-4">
      <PageHeader
        title="Chiều cao"
        back={{ href: "/tang-truong", label: "Tăng trưởng" }}
        action={
          edit && (
            <IconButton
              label="Sửa mục tiêu và chiều cao bố mẹ"
              icon="pencil"
              onClick={edit}
            />
          )
        }
      />
      {view ? (
        <>
          <HeightGoalCard goal={view.goal} isOwner={isOwner} onSet={edit} />
          <ParentalRangeCard parents={view.parents} />
          {view.beyondTable ? (
            <p className={NOTE}>Bảng WHO trong app tới 5 tuổi.</p>
          ) : (
            <>
              {view.path && (
                <TargetPathCard
                  title={view.path.title}
                  babyName={baby.name}
                  note={view.path.note}
                >
                  <GrowthChart
                    band={view.path.band}
                    points={view.path.points}
                    last={view.path.last}
                    to={view.path.to}
                    unit="cm"
                    label={view.path.ariaLabel}
                    target={view.path.target}
                  />
                </TargetPathCard>
              )}
              <VelocityCard velocity={view.velocity} />
            </>
          )}
          {habits && <HabitsCard rows={habits.rows} />}
          {reminder && (
            <MeasureReminderRow userId={userId} reminder={reminder} />
          )}
          <p className={NOTE}>
            Chiều cao lúc lớn phần lớn do di truyền. Kim Bun giúp theo dõi và
            nhắc việc, không thay lời khuyên của bác sĩ.
          </p>
        </>
      ) : waitingForNetwork(growth) ? (
        <NeedsNetwork what="các lần đo" />
      ) : growth.isError && !growth.data ? (
        <ErrorCard
          message={toVietnameseError(growth.error)}
          onRetry={() => void growth.refetch()}
        />
      ) : table.isError ? (
        <ErrorCard
          message={toVietnameseError(table.error)}
          onRetry={() => void table.refetch()}
        />
      ) : (
        <div className="flex flex-col gap-[18px]">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-[120px]" />
          ))}
        </div>
      )}
      {editing && (
        <HeightGoalSheet baby={baby} onClose={() => setEditing(false)} />
      )}
    </main>
  );
}
