import type { LogLike } from "./describeLog";
import { detailsSchemas } from "./logDetails";
import type { MetricResult } from "./ratings";
import { formatVnTime, vnDateString } from "./time";

export type HomeAlert = {
  key: string;
  level: "red" | "yellow";
  message: string;
};

const HOUR_MS = 3_600_000;
const ms = (iso: string) => Date.parse(iso);
const within = (log: LogLike, now: Date, hours: number) => {
  const start = ms(log.started_at);
  return start <= now.getTime() && now.getTime() - start <= hours * HOUR_MS;
};

function temperatureAlert(
  logs: LogLike[],
  ageDays: number,
  triageAvailable: boolean,
  now: Date,
): HomeAlert | null {
  let latest: { at: number; celsius: number } | null = null;
  for (const log of logs) {
    if (log.type !== "temperature" || !within(log, now, 6)) continue;
    const parsed = detailsSchemas.temperature.safeParse(log.details);
    if (!parsed.success) continue;
    const at = ms(log.started_at);
    if (!latest || at > latest.at)
      latest = { at, celsius: parsed.data.celsius };
  }
  if (!latest) return null;
  const c = latest.celsius;
  if (c < 35.5)
    return {
      key: "hypothermia",
      level: "red",
      message: "Thân nhiệt thấp: cần đi khám ngay.",
    };
  if (c >= 40.0)
    return {
      key: "fever-high",
      level: "red",
      message: "Sốt rất cao: cần đi khám ngay.",
    };
  if (c >= 38.0 && ageDays < 91)
    return {
      key: "fever-infant",
      level: "red",
      message: "Bé dưới 3 tháng sốt ≥ 38°C: cần đi khám ngay.",
    };
  // Same threshold as temperatureFindings in ./triage, so the home banner never
  // says less than the triage screen it links to.
  if (c >= 39.0 && ageDays < 183)
    return {
      key: "fever-infant",
      level: "red",
      message: "Bé 3–6 tháng sốt ≥ 39°C: cần đi khám ngay.",
    };
  if (c >= 38.0)
    return {
      key: "fever",
      level: "yellow",
      message: triageAvailable
        ? "Bé đang sốt — xem Phân loại triệu chứng."
        : "Bé đang sốt — theo dõi sát, hỏi bác sĩ nếu sốt kéo dài.",
    };
  return null;
}

function stoolAlerts(logs: LogLike[], now: Date): HomeAlert[] {
  const colors = new Set<string>();
  for (const log of logs) {
    if (log.type !== "diaper" || !within(log, now, 72)) continue;
    const parsed = detailsSchemas.diaper.safeParse(log.details);
    if (parsed.success && parsed.data.stoolColor)
      colors.add(parsed.data.stoolColor);
  }
  const result: HomeAlert[] = [];
  if (colors.has("pale"))
    result.push({
      key: "stool-pale",
      level: "red",
      message: "Phân bạc màu: cần đi khám ngay.",
    });
  if (colors.has("red"))
    result.push({
      key: "stool-blood",
      level: "red",
      message: "Phân có máu: cần đi khám ngay.",
    });
  return result;
}

export function homeAlerts(input: {
  logs: LogLike[];
  ageDays: number;
  wetDiapers: MetricResult;
  triageAvailable: boolean;
  now: Date;
}): HomeAlert[] {
  const { logs, ageDays, wetDiapers, triageAvailable, now } = input;
  const all: HomeAlert[] = [];
  const temperature = temperatureAlert(logs, ageDays, triageAvailable, now);
  if (temperature) all.push(temperature);
  all.push(...stoolAlerts(logs, now));
  if (wetDiapers.status === "rated" && wetDiapers.rating === "red")
    all.push({
      key: "few-wet",
      level: "red",
      message: "Ít tã ướt: nguy cơ mất nước.",
    });
  return [
    ...all.filter((a) => a.level === "red"),
    ...all.filter((a) => a.level === "yellow"),
  ];
}

function antipyreticTimes(logs: LogLike[], at: Date): number[] {
  return logs
    .filter((log) => log.type === "medicine")
    .filter((log) => {
      const parsed = detailsSchemas.medicine.safeParse(log.details);
      return parsed.success && parsed.data.antipyretic;
    })
    .map((log) => ms(log.started_at))
    .filter((t) => t <= at.getTime());
}

export function medicineWarnings(input: {
  logs: LogLike[];
  at: Date;
}): string[] {
  const { logs, at } = input;
  const times = antipyreticTimes(logs, at);
  const warnings: string[] = [];
  const latest = times.length > 0 ? Math.max(...times) : null;
  if (latest !== null && at.getTime() - latest < 4 * HOUR_MS)
    warnings.push(
      `Chưa đủ 4 giờ từ liều hạ sốt trước (${formatVnTime(new Date(latest))}).`,
    );
  if (times.filter((t) => at.getTime() - t < 24 * HOUR_MS).length >= 4)
    warnings.push("Đã đủ 4 liều hạ sốt trong 24 giờ.");
  return warnings;
}

export function vitaminDToday(logs: LogLike[], now: Date): string | null {
  const today = vnDateString(now);
  const times = logs
    .filter(
      (log) =>
        log.type === "medicine" &&
        vnDateString(new Date(log.started_at)) === today,
    )
    .filter((log) => {
      const parsed = detailsSchemas.medicine.safeParse(log.details);
      return parsed.success && parsed.data.name.toLowerCase() === "vitamin d";
    })
    .map((log) => ms(log.started_at));
  return times.length > 0 ? formatVnTime(new Date(Math.min(...times))) : null;
}
