export const VN_TZ = "Asia/Ho_Chi_Minh";
const VN_OFFSET = "+07:00"; // Vietnam has no daylight saving time.
const DAY_MS = 86_400_000;

const dateFormat = new Intl.DateTimeFormat("en-CA", {
  timeZone: VN_TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});
const timeFormat = new Intl.DateTimeFormat("en-GB", {
  timeZone: VN_TZ,
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

export function vnDateString(instant: Date): string {
  return dateFormat.format(instant);
}

function utcMidnight(date: string): number {
  return Date.parse(`${date}T00:00:00Z`);
}

function isoDate(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

export function ageDays(dob: string, now: Date): number {
  return Math.round(
    (utcMidnight(vnDateString(now)) - utcMidnight(dob)) / DAY_MS,
  );
}

function addMonths(date: string, months: number): string {
  const [y, m, d] = date.split("-").map(Number);
  const total = m - 1 + months;
  const year = y + Math.floor(total / 12);
  const month = ((total % 12) + 12) % 12;
  const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  return isoDate(Date.UTC(year, month, Math.min(d, lastDay)));
}

export function formatAgeVi(dob: string, now: Date): string {
  const today = vnDateString(now);
  const [y1, m1] = dob.split("-").map(Number);
  const [y2, m2] = today.split("-").map(Number);
  let months = (y2 - y1) * 12 + (m2 - m1);
  if (addMonths(dob, months) > today) months -= 1;
  const days = Math.round(
    (utcMidnight(today) - utcMidnight(addMonths(dob, months))) / DAY_MS,
  );
  if (months <= 0) return `${ageDays(dob, now)} ngày`;
  if (days === 0) return `${months} tháng`;
  return `${months} tháng ${days} ngày`;
}

export function formatVnTime(instant: Date): string {
  return timeFormat.format(instant);
}

export function formatDuration(ms: number): string {
  const totalMinutes = Math.floor(ms / 60_000);
  if (totalMinutes < 1) return "dưới 1 phút";
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes} phút`;
  return `${hours} giờ ${String(minutes).padStart(2, "0")} phút`;
}

export function toVnLocalInput(instant: Date): string {
  return `${vnDateString(instant)}T${formatVnTime(instant)}`;
}

export function fromVnLocalInput(value: string): Date {
  return new Date(`${value}:00${VN_OFFSET}`);
}
