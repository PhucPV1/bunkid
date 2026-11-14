import type { MetricResult, Rating } from "./ratings";
import { formatDuration } from "./time";

export const RATING_LABEL: Record<Rating, string> = {
  green: "Tốt",
  yellow: "Lưu ý",
  red: "Nguy cơ",
};

const LABEL = { sleep: "Giấc ngủ", feeds: "Cữ bú", wet: "Tã ướt" } as const;

function valueText(kind: "sleep" | "feeds" | "wet", value: number): string {
  if (kind === "sleep") return formatDuration(value * 60_000);
  return kind === "feeds" ? `${value} cữ` : `${value} tã`;
}

export function metricText(
  kind: "sleep" | "feeds" | "wet",
  result: MetricResult,
): { label: string; value: string; note: string; rating: Rating | null } {
  const label = LABEL[kind];
  if (result.status === "no-data")
    return { label, value: "—", note: "Chưa đủ dữ liệu", rating: null };
  if (result.status === "not-rated")
    return {
      label,
      value: valueText(kind, result.value),
      note: "Không đánh giá ở tuổi này",
      rating: null,
    };
  return {
    label,
    value: valueText(kind, result.value),
    note: result.explain,
    rating: result.rating,
  };
}
