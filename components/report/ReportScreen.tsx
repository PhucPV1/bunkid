"use client";

import { useState } from "react";
import { FeverChartFigure } from "@/components/illness/FeverChart";
import { Button } from "@/components/ui/Button";
import { ErrorCard } from "@/components/ui/ErrorCard";
import { Icon } from "@/components/ui/Icon";
import { PageHeader } from "@/components/ui/PageHeader";
import { type ChoiceOption, Segmented } from "@/components/ui/Segmented";
import { NeedsNetwork, waitingForNetwork } from "@/components/ui/NeedsNetwork";
import { Skeleton } from "@/components/ui/Skeleton";
import { VACCINES } from "@/lib/content/vaccines";
import { whoSex, type LmsRow } from "@/lib/content/who";
import { toVietnameseError } from "@/lib/data/errors";
import { useGrowth, useWhoTable } from "@/lib/data/growth";
import { useEpisodes, useVisits } from "@/lib/data/illness";
import { useRangeLogs, useStatsLogs } from "@/lib/data/logs";
import { useNow } from "@/lib/hooks/useNow";
import { useVaccineDoses } from "@/lib/data/vaccines";
import {
  dailyStats,
  sleepHours,
  statsFetchSince,
} from "@/lib/rules/dailyStats";
import { formatDayShort, vnDayRange, vnDayStartMs } from "@/lib/rules/days";
import { belongsTo, feverChartModel } from "@/lib/rules/illness";
import {
  episodeReport,
  growthSummary,
  medicineRows,
  REPORT_DAYS,
  type ReportPeriod,
  reportSelection,
  symptomRows,
  temperatureRows,
  vaccineSummary,
  visitRows,
} from "@/lib/rules/report";
import { formatAgeVi, vnDateString } from "@/lib/rules/time";
import { parseChoices, toDoseRecords } from "@/lib/rules/vaccineForm";
import { buildSchedule } from "@/lib/rules/vaccines";
import { visitsOf } from "@/lib/rules/visits";
import type { Baby } from "@/lib/supabase/rows";

const decimal = new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 1 });
const dmy = (day: string) => day.split("-").reverse().join("/");
const RANGES: ChoiceOption<ReportPeriod>[] = REPORT_DAYS.map((n) => ({
  value: n === 7 ? "7" : "14",
  label: `${n} ngày`,
}));
// Spec 2026-11-26 §9: the third choice, once the baby has an episode.
const EPISODE: ChoiceOption<ReportPeriod> = { value: "dot", label: "Đợt ốm" };

// `dot` is the episode named by the address (/bao-cao?dot={id}), or null.
export function ReportScreen({
  baby,
  dot = null,
}: {
  baby: Baby;
  dot?: string | null;
}) {
  const [picked, setPicked] = useState<ReportPeriod | null>(null);
  const now = useNow(60_000);
  const episodes = useEpisodes(baby.id);
  // null while the address names an episode and the list is still loading:
  // nothing is shown yet rather than 7 days that then jump.
  const selection = reportSelection({
    picked,
    address: dot,
    episodes: episodes.data,
  });
  const episode = selection?.episode ?? null;
  const report = episode ? episodeReport(episode, now) : null;
  const range = selection?.period === "14" ? 14 : 7;
  const days = report ? report.days : vnDayRange(now, range);
  const fromMs = vnDayStartMs(days[0]);
  const statsLogs = useStatsLogs(
    baby.id,
    statsFetchSince(days),
    selection !== null && report === null,
  );
  const rangeLogs = useRangeLogs(
    baby.id,
    report?.from ?? "",
    report?.to ?? null,
    report !== null,
  );
  const logs = report ? rangeLogs : statsLogs;
  // Spec §9 from M5: the episode's visits, read only for the episode period.
  const visits = useVisits(baby.id, report !== null);
  const episodeVisits = episode ? visitsOf(visits.data ?? [], episode.id) : [];
  const growth = useGrowth(baby.id);
  const doses = useVaccineDoses(baby.id);
  const sex = whoSex(baby.sex);
  const wfa = useWhoTable("wfa", sex);
  const lhfa = useWhoTable("lhfa", sex);
  const hcfa = useWhoTable("hcfa", sex);

  const rows = logs.data ?? [];
  // The daily table counts whole calendar days; the readings, the medicines
  // and the symptoms of an episode are only the logs that belong to it.
  const own = episode
    ? rows.filter((log) => belongsTo(episode, log.started_at, now))
    : rows;
  const stats = dailyStats(rows, days, now);
  const temperatures = temperatureRows(own, fromMs);
  const medicines = medicineRows(own, fromMs);
  const symptoms = symptomRows(own, fromMs);
  const visitTable = visitRows(episodeVisits);
  const chart = episode
    ? feverChartModel(
        rows,
        episode,
        now,
        episodeVisits.map((visit) => Date.parse(visit.visited_at)),
      )
    : null;
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
  const ready = Boolean(
    selection &&
    logs.data &&
    growth.data &&
    doses.data &&
    (report === null || visits.data),
  );
  const failures = [
    ...(selection ? [] : [{ label: "Đợt ốm", query: episodes }]),
    { label: "Nhật ký", query: logs },
    ...(report ? [{ label: "Lần khám", query: visits }] : []),
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
          options={
            episodes.data && episodes.data.length > 0
              ? [...RANGES, EPISODE]
              : RANGES
          }
          value={selection?.period ?? "dot"}
          onChange={setPicked}
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
          ([
            selection ? logs : episodes,
            growth,
            doses,
            ...(report ? [visits] : []),
          ].some(waitingForNetwork) ? (
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
              {report
                ? report.line
                : `${range} ngày, từ ${formatDayShort(days[0])} đến ${formatDayShort(days[days.length - 1])}`}{" "}
              · in ngày {dmy(vnDateString(now))}
            </p>
            {report?.truncated && (
              <p className="text-muted">14 ngày cuối của đợt ốm</p>
            )}
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
            {/* Spec 2026-11-26 §9: the episode's chart, on paper too; not
                an empty frame when its last 7 days have no reading. */}
            {chart && chart.points.length > 0 && (
              <div className="flex max-w-md flex-col gap-2.5 py-2 break-inside-avoid [print-color-adjust:exact]">
                <FeverChartFigure chart={chart} />
              </div>
            )}
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

          {/* Spec 2026-11-26 §9 from M5: the visits of the episode, without
              their photos; only when it has one. */}
          {visitTable.length > 0 && (
            <section>
              <h3 className="font-semibold">Lần khám</h3>
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr>
                    <th className={cell}>Lúc khám</th>
                    <th className={cell}>Nơi khám</th>
                    <th className={cell}>Bác sĩ kết luận</th>
                    <th className={cell}>Lời dặn</th>
                  </tr>
                </thead>
                <tbody>
                  {visitTable.map((row, i) => (
                    <tr key={i} className="break-inside-avoid">
                      {/* The time may break after its day: on a phone the
                          three columns of text need the room. */}
                      <td className={`${cell} tabular-nums`}>{row.at}</td>
                      <td className={cell}>{row.place}</td>
                      <td className={cell}>{row.conclusion}</td>
                      <td className={`${cell} whitespace-pre-line`}>
                        {row.advice}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}

          {/* Spec 2026-11-26 §9: only when the period has a symptom log. */}
          {symptoms.length > 0 && (
            <section>
              <h3 className="font-semibold">Triệu chứng</h3>
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr>
                    <th className={cell}>Giờ</th>
                    <th className={cell}>Triệu chứng</th>
                    <th className={cell}>Ghi chú</th>
                  </tr>
                </thead>
                <tbody>
                  {symptoms.map((row, i) => (
                    <tr key={i} className="break-inside-avoid">
                      <td className={`${cell} whitespace-nowrap tabular-nums`}>
                        {row.at}
                      </td>
                      <td className={cell}>{row.text}</td>
                      <td className={cell}>{row.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}

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
