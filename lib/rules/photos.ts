import { vnDateString } from "./time";

// Spec §6.14: longest side at most 1600 px, JPEG quality 0.8.
export const MAX_SIDE = 1600;
export const JPEG_QUALITY = 0.8;
export const QUOTA_BYTES = 1024 ** 3;
export const WARN_BYTES = 900 * 1024 ** 2;
export const BLOCK_BYTES = 1000 * 1024 ** 2;

export function fitWithin(
  width: number,
  height: number,
  max: number = MAX_SIDE,
): { width: number; height: number } {
  const longest = Math.max(width, height);
  if (longest <= max) return { width, height };
  const scale = max / longest;
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

// Spec §5.2: <family_id>/<baby_id>/<uuid>.jpg.
export function photoPath(
  familyId: string,
  babyId: string,
  id: string,
): string {
  return `${familyId}/${babyId}/${id}.jpg`;
}

export type Usage = {
  level: "ok" | "warn" | "full";
  text: string;
  percent: number;
};

const mb = (bytes: number) =>
  new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 }).format(
    bytes / 1024 ** 2,
  );

export function usage(totalBytes: number): Usage {
  const percent = Math.min(100, (totalBytes / QUOTA_BYTES) * 100);
  const text = `Đã dùng ${mb(totalBytes)} MB / 1 GB`;
  if (totalBytes >= BLOCK_BYTES)
    return {
      level: "full",
      percent,
      text: `${text}. Đã đầy, không tải thêm ảnh được; xóa bớt ảnh cũ.`,
    };
  if (totalBytes >= WARN_BYTES)
    return { level: "warn", percent, text: `${text}. Sắp đầy dung lượng.` };
  return { level: "ok", percent, text };
}

// Whole months of age on a given day (VN dates), never below 0.
export function ageMonthsOn(dob: string, day: string): number {
  const [y1, m1, d1] = dob.split("-").map(Number);
  const [y2, m2, d2] = day.split("-").map(Number);
  let months = (y2 - y1) * 12 + (m2 - m1);
  if (d2 < d1) months -= 1;
  return Math.max(0, months);
}

export function monthLabel(months: number): string {
  if (months === 0) return "Dưới 1 tháng tuổi";
  return `${months} tháng tuổi`;
}

// Spec §6.14: grid grouped by month of age, newest first.
export function groupByAgeMonth<
  T extends { taken_on: string; created_at: string },
>(photos: T[], dob: string): { months: number; label: string; photos: T[] }[] {
  const groups = new Map<number, T[]>();
  for (const photo of photos) {
    const months = ageMonthsOn(dob, photo.taken_on);
    groups.set(months, [...(groups.get(months) ?? []), photo]);
  }
  return [...groups.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([months, list]) => ({
      months,
      label: monthLabel(months),
      photos: list.sort(
        (a, b) =>
          b.taken_on.localeCompare(a.taken_on) ||
          b.created_at.localeCompare(a.created_at),
      ),
    }));
}

// Default "Ngày chụp": the EXIF capture day if the photo has one, otherwise the
// file's last-modified day (VN time), kept within dob..today.
export function defaultTakenOn(
  exifDay: string | null,
  lastModified: number,
  dob: string,
  now: Date,
): string {
  const day = exifDay ?? vnDateString(new Date(lastModified));
  const today = vnDateString(now);
  if (day < dob) return dob;
  return day > today ? today : day;
}

export function parsePhotoForm(
  raw: { takenOn: string; caption: string },
  ctx: { dob: string; today: string },
):
  | { ok: true; value: { taken_on: string; caption: string | null } }
  | {
      ok: false;
      message: string;
    } {
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(raw.takenOn) ||
    raw.takenOn < ctx.dob ||
    raw.takenOn > ctx.today
  )
    return { ok: false, message: "Ngày chụp phải từ ngày sinh đến hôm nay." };
  const caption = raw.caption.trim();
  if (caption.length > 200)
    return { ok: false, message: "Ghi chú tối đa 200 ký tự." };
  return {
    ok: true,
    value: { taken_on: raw.takenOn, caption: caption || null },
  };
}
