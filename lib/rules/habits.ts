import { dailyStats } from "./dailyStats";
import { vnDayRange } from "./days";
import type { LogLike } from "./describeLog";
import { detailsSchemas } from "./logDetails";
import { VITAMIN_D } from "./medicineNames";
import { dailyNorm } from "./ratings";
import { ageDays, formatDuration, vnDateString } from "./time";

// Spec 2026-11-25 §7.1: three habits that help a child grow, over the seven
// full days before today.
export type HabitKey = "sleep" | "tummy" | "vitaminD";

export type HabitRow = {
  key: HabitKey;
  title: string;
  // "{giá trị} · {chuẩn}", or the line that says there is not enough data.
  line: string;
  // Null when the habit is not judged for lack of data.
  chip: { text: string; tone: "good" | "warn" | "neutral" } | null;
  // 0–1 along the bar; null with no bar.
  progress: number | null;
};

export type HabitStats = {
  rows: HabitRow[];
  // Spec §4, rows 5 and 6: the detail of the row on the Sức khỏe page when
  // the habit is short; null otherwise.
  attention: { sleep: string | null; tummy: string | null };
};

const WINDOW_DAYS = 7;
// A day nobody logged is usually a day somebody forgot, not a day without
// sleep: the mean divides by the days that have data, and below these counts
// the habit is not judged at all.
const SLEEP_MIN_DAYS = 5;
const TUMMY_MIN_DAYS = 3;
// WHO 2019, physical activity under 5 years: at least 30 minutes a day of
// tummy time for infants not yet mobile.
const TUMMY_NORM_MINUTES = 30;
const TUMMY_UNTIL_DAY = 365;
const VITAMIN_D_UNTIL_DAY = 730;
const VITAMIN_D_GOOD_DAYS = 6;

const oneDecimal = new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 1 });

// The mean over the days that have a value, in whole minutes.
function meanOf(values: number[]): { days: number; mean: number } {
  const present = values.filter((value) => value > 0);
  const total = present.reduce((sum, value) => sum + value, 0);
  return {
    days: present.length,
    mean: present.length === 0 ? 0 : Math.round(total / present.length),
  };
}

export function habitStats(
  logs: LogLike[],
  dob: string,
  now: Date,
): HabitStats {
  const age = ageDays(dob, now);
  // Eight days ending today, without today.
  const days = vnDayRange(now, WINDOW_DAYS + 1).slice(0, WINDOW_DAYS);
  const stats = dailyStats(logs, days, now);
  const rows: HabitRow[] = [];
  const attention: HabitStats["attention"] = { sleep: null, tummy: null };

  const sleep = meanOf(stats.map((day) => day.sleepMinutes));
  const norm = dailyNorm("sleep", age);
  if (sleep.days < SLEEP_MIN_DAYS || !norm || norm.max === undefined) {
    rows.push({
      key: "sleep",
      title: "Giấc ngủ",
      line: "Chưa đủ dữ liệu ngủ 7 ngày",
      chip: null,
      progress: null,
    });
  } else {
    const range = `nên ${norm.min}–${norm.max} giờ`;
    const low = sleep.mean < norm.min * 60;
    rows.push({
      key: "sleep",
      title: "Giấc ngủ",
      line: `${formatDuration(sleep.mean * 60_000)} mỗi ngày · ${range}`,
      chip: low
        ? { text: "Ít hơn chuẩn", tone: "warn" }
        : sleep.mean > norm.max * 60
          ? { text: "Nhiều hơn chuẩn", tone: "neutral" }
          : { text: "Đủ", tone: "good" },
      progress: Math.min(1, sleep.mean / (norm.max * 60)),
    });
    // Tenths of an hour, rounded down: under the norm it must never read as
    // the norm itself ("14 giờ mỗi ngày · nên 14–17 giờ").
    if (low)
      attention.sleep = `${oneDecimal.format(Math.floor(sleep.mean / 6) / 10)} giờ mỗi ngày · ${range}`;
  }

  if (age < TUMMY_UNTIL_DAY) {
    const tummy = meanOf(stats.map((day) => day.tummyMinutes));
    if (tummy.days < TUMMY_MIN_DAYS) {
      rows.push({
        key: "tummy",
        title: "Nằm sấp",
        line: "Tuần này chưa ghi nằm sấp",
        chip: null,
        progress: null,
      });
    } else {
      const line = `${tummy.mean} phút mỗi ngày · nên từ ${TUMMY_NORM_MINUTES} phút`;
      const short = tummy.mean < TUMMY_NORM_MINUTES;
      rows.push({
        key: "tummy",
        title: "Nằm sấp",
        line,
        chip: short
          ? { text: "Còn thiếu", tone: "warn" }
          : { text: "Đủ", tone: "good" },
        progress: Math.min(1, tummy.mean / TUMMY_NORM_MINUTES),
      });
      if (short) attention.tummy = line;
    }
  }

  if (age < VITAMIN_D_UNTIL_DAY) {
    const given = new Set<string>();
    for (const log of logs) {
      if (log.type !== "medicine") continue;
      const details = detailsSchemas.medicine.safeParse(log.details);
      if (!details.success || !VITAMIN_D.test(details.data.name.trim()))
        continue;
      const day = vnDateString(new Date(log.started_at));
      if (days.includes(day)) given.add(day);
    }
    rows.push({
      key: "vitaminD",
      title: "Vitamin D",
      line: `Đã uống ${given.size} trên ${WINDOW_DAYS} ngày`,
      chip:
        given.size >= VITAMIN_D_GOOD_DAYS
          ? { text: "Đều", tone: "good" }
          : { text: `Sót ${WINDOW_DAYS - given.size} ngày`, tone: "neutral" },
      progress: given.size / WINDOW_DAYS,
    });
  }

  return { rows, attention };
}
