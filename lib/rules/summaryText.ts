import type { LogLike } from "./describeLog";
import {
  countFeedsInWindow,
  sleepMinutesInWindow,
  wetDiapersInWindow,
  type DayRatings,
  type MetricResult,
  type Rating,
} from "./ratings";

export type HomeStatTile = {
  label: string;
  value: string;
  note: string;
  tone: "good" | "warn" | "danger" | "muted";
};

const RATED: Record<Rating, Pick<HomeStatTile, "note" | "tone">> = {
  green: { note: "Bình thường", tone: "good" },
  yellow: { note: "Cần chú ý", tone: "warn" },
  red: { note: "Báo bác sĩ", tone: "danger" },
};

function noteFor(result: MetricResult): Pick<HomeStatTile, "note" | "tone"> {
  if (result.status === "rated") return RATED[result.rating];
  if (result.status === "not-rated")
    return { note: "Không đánh giá ở tuổi này", tone: "muted" };
  return { note: "Đánh giá sau 24 giờ đầu", tone: "muted" };
}

export function shortDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${rest}p`;
  return rest === 0 ? `${hours}g` : `${hours}g ${rest}p`;
}

// Spec §7.3: counts always show; the rating line only when there is a rating.
export function homeStatTiles(input: {
  ratings: DayRatings;
  logs: LogLike[];
  now: Date;
}): HomeStatTile[] {
  const { ratings, logs, now } = input;
  return [
    {
      label: "Giấc ngủ",
      value: shortDuration(sleepMinutesInWindow(logs, now)),
      ...noteFor(ratings.sleepMinutes),
    },
    {
      label: "Cữ bú",
      value: String(countFeedsInWindow(logs, now)),
      ...noteFor(ratings.feeds),
    },
    {
      label: "Tã ướt",
      value: String(wetDiapersInWindow(logs, now)),
      ...noteFor(ratings.wetDiapers),
    },
  ];
}

// Spec 2026-11-19 §3.5: only the non-zero parts; null when both are zero.
export function totalsLine(totals: {
  bottleMl: number;
  dirtyDiapers: number;
}): string | null {
  const parts: string[] = [];
  if (totals.bottleMl > 0) parts.push(`Bình ${totals.bottleMl} ml`);
  if (totals.dirtyDiapers > 0) parts.push(`Tã bẩn ${totals.dirtyDiapers}`);
  return parts.length > 0 ? parts.join(" · ") : null;
}
