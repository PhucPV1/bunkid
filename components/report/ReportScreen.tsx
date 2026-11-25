"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { ErrorCard } from "@/components/ui/ErrorCard";
import { Icon } from "@/components/ui/Icon";
import { PageHeader } from "@/components/ui/PageHeader";
import { Segmented } from "@/components/ui/Segmented";
import { NeedsNetwork, waitingForNetwork } from "@/components/ui/NeedsNetwork";
import { Skeleton } from "@/components/ui/Skeleton";
import { VACCINES } from "@/lib/content/vaccines";
import { whoSex, type LmsRow } from "@/lib/content/who";
import { toVietnameseError } from "@/lib/data/errors";
import { useGrowth, useWhoTable } from "@/lib/data/growth";
import { useStatsLogs } from "@/lib/data/logs";
import { useNow } from "@/lib/hooks/useNow";
import { useVaccineDoses } from "@/lib/data/vaccines";
import {
  dailyStats,
  sleepHours,
  statsFetchSince,
} from "@/lib/rules/dailyStats";
import { formatDayShort, vnDayRange, vnDayStartMs } from "@/lib/rules/days";
import {
  growthSummary,
  medicineRows,
  REPORT_DAYS,
  temperatureRows,
  vaccineSummary,
} from "@/lib/rules/report";
import { formatAgeVi, vnDateString } from "@/lib/rules/time";
import { parseChoices, toDoseRecords } from "@/lib/rules/vaccineForm";
import { buildSchedule } from "@/lib/rules/vaccines";
import type { Baby } from "@/lib/supabase/rows";

const decimal = new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 1 });
const dmy = (day: string) => day.split("-").reverse().join("/");
const RANGES = REPORT_DAYS.map((n) => ({
  value: String(n),
  label: `${n} ngày`,
}));

export function ReportScreen({ baby }: { baby: Baby }) {
  const [range, setRange] = useState<(typeof REPORT_DAYS)[number]>(7);
  const now = useNow(60_000);
  const days = vnDayRange(now, range);
  const fromMs = vnDayStartMs(days[0]);
  const logs = useStatsLogs(baby.id, statsFetchSince(days));
  const growth = useGrowth(baby.id);
  const doses = useVaccineDoses(baby.id);
  const sex = whoSex(baby.sex);
  const wfa = useWhoTable("wfa", sex);
  const lhfa = useWhoTable("lhfa", sex);
  const hcfa = useWhoTable("hcfa", sex);

  const rows = logs.data ?? [];
  const stats = dailyStats(rows, days, now);
  const temperatures = temperatureRows(rows, fromMs);
  const medicines = medicineRows(rows, fromMs);
  const measures = growthSummary(
    growth.data ?? [],
    {
      wfa: wfa.data?.rows as LmsRow[] | undefined,
      lhfa: lhfa.data?.rows as LmsRow[] | undefined,
      hcfa: hcfa.data?.rows as LmsRow[] | undefined,
    },
    baby.dob,
  );
  const vaccines = vaccineSummary(
    buildSchedule({
      doses: VACCINES.doses,
      choices: parseChoices(baby.vaccine_choices),
      dob: baby.dob,
      records: toDoseRecords(doses.data ?? []),
      today: vnDateString(now),
    }),
  );
  const cell = "border border-line px-2 py-1 print:border-ink";
  // A report for a doctor must never print "nothing recorded" while data is
  // still loading or failed to load (offline without a cache).
  const ready = Boolean(logs.data && growth.data && doses.data);
  const failures = [
    { label: "Nhật ký", query: logs },
    { label: "Tăng trưởng", query: growth },
    { label: "Tiêm chủng", query: doses },
  ].filter(({ query }) => query.isError && !query.data);

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-[18px] px-4 pt-2 pb-4 print:max-w-none print:p-0 print:text-sm">
      <div className="flex flex-col gap-[18px] print:hidden">
        <PageHeader
          title="Báo cáo cho bác sĩ"
          back={{ href: "/suc-khoe", label: "Sức khỏe" }}
        />
        <Segmented
          label="Khoảng thời gian"
          options={RANGES}
          value={String(range)}
          onChange={(value) =>
            setRange(Number(value) as (typeof REPORT_DAYS)[number])
          }
        />
        <Button block disabled={!ready} onClick={() => window.print()}>
          <Icon name="doc" size={18} />
          In / Lưu PDF
        </Button>
        {failures.map(({ label, query }) => (
          <ErrorCard
            key={label}
            message={`${label}: ${toVietnameseError(query.error)}`}
            onRetry={() => void query.refetch()}
          />
        ))}
        {!ready &&
          failures.length === 0 &&
          ([logs, growth, doses].some(waitingForNetwork) ? (
            <NeedsNetwork what="báo cáo" />
          ) : (
            <div className="flex flex-col gap-2.5">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-[60px]" />
              ))}
            </div>
          ))}
      </div>

      {ready && (
        <div className="glass flex flex-col gap-4 rounded-[28px] p-4 text-ink print:rounded-none print:border-0 print:p-0">
          <h1 className="hidden text-xl font-semibold print:block">
            Báo cáo cho bác sĩ
          </h1>
          <section>
            <h2 className="text-xl font-semibold">
              {baby.name} — {formatAgeVi(baby.dob, now)}
            </h2>
            <p>
              Ngày sinh {dmy(baby.dob)} ·{" "}
              {baby.sex === "female" ? "Bé gái" : "Bé trai"}
              {baby.blood_type ? ` · Nhóm máu ${baby.blood_type}` : ""}
              {baby.allergies ? ` · Dị ứng: ${baby.allergies}` : ""}
            </p>
            <p className="text-muted">
              {range} ngày, từ {formatDayShort(days[0])} đến{" "}
              {formatDayShort(days[days.length - 1])} · in ngày{" "}
              {dmy(vnDateString(now))}
            </p>
          </section>

          <section>
            <h3 className="font-semibold">Theo ngày</h3>
            <table className="w-full border-collapse text-left tabular-nums">
              <thead>
                <tr>
                  <th className={cell}>Ngày</th>
                  <th className={cell}>Ngủ (giờ)</th>
                  <th className={cell}>Cữ bú</th>
                  <th className={cell}>Bình (ml)</th>
                  <th className={cell}>Tã ướt / bẩn</th>
                </tr>
              </thead>
              <tbody>
                {stats.map((s) => (
                  <tr key={s.day} className="break-inside-avoid">
                    <td className={cell}>{formatDayShort(s.day)}</td>
                    <td className={cell}>
                      {decimal.format(sleepHours(s.sleepMinutes))}
                    </td>
                    <td className={cell}>{s.feeds}</td>
                    <td className={cell}>{s.bottleMl}</td>
                    <td className={cell}>
                      {s.wetDiapers} / {s.dirtyDiapers}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section>
            <h3 className="font-semibold">Nhiệt độ</h3>
            {temperatures.length === 0 ? (
              <p className="text-muted">Không đo trong khoảng này.</p>
            ) : (
              <ul>
                {temperatures.map((t, i) => (
                  <li key={i} className={t.high ? "font-semibold" : ""}>
                    {t.at}: {t.text}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h3 className="font-semibold">Thuốc đã dùng</h3>
            {medicines.length === 0 ? (
              <p className="text-muted">Không dùng thuốc trong khoảng này.</p>
            ) : (
              <ul>
                {medicines.map((m, i) => (
                  <li key={i}>
                    {m.at}: {m.name} — {m.amount}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h3 className="font-semibold">Tăng trưởng (lần đo gần nhất)</h3>
            {measures.length === 0 ? (
              <p className="text-muted">Chưa có lần đo.</p>
            ) : (
              <ul>
                {measures.map((m) => (
                  <li key={m.title}>
                    {m.title}: {m.value} ({m.day})
                    {m.percentile ? ` · ${m.percentile} theo WHO` : ""}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h3 className="font-semibold">Tiêm chủng</h3>
            <p>
              Mũi gần nhất:{" "}
              {vaccines.last
                ? `${vaccines.last.name}${vaccines.last.day ? ` (${vaccines.last.day})` : ""}`
                : "chưa ghi"}
            </p>
            <p>
              Mũi sắp tới:{" "}
              {vaccines.next
                ? `${vaccines.next.name} (${vaccines.next.overdue ? "quá hạn từ" : "hẹn"} ${vaccines.next.day})${vaccines.next.pastMaxAge ? " — đã quá tuổi khuyến cáo của loại vaccine này, hỏi bác sĩ" : ""}`
                : "chưa có"}
            </p>
          </section>

          <p className="text-sm text-muted">
            Số liệu do gia đình ghi bằng ứng dụng Kim Bun. Thông tin tham khảo,
            không thay thế bác sĩ.
          </p>
        </div>
      )}
    </main>
  );
}
