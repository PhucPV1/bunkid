import { formatAgeVi } from "./time";

export const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
export const ALLERGIES_MAX = 300;

export type Contact = {
  id: string;
  label: string;
  phone: string;
  sort: number;
  created_at: string;
};

export type ContactInput = { label: string; phone: string };

// Spaces, dots, dashes and brackets are typing aids; the stored number keeps only
// digits and an optional leading "+" (the DB check is ^\+?[0-9]{3,15}$).
export function normalizePhone(raw: string): string {
  return raw.trim().replace(/[\s.\-()]/g, "");
}

export function parseContactForm(
  raw: ContactInput,
): { ok: true; value: ContactInput } | { ok: false; message: string } {
  const label = raw.label.trim();
  const phone = normalizePhone(raw.phone);
  if (label.length === 0)
    return { ok: false, message: "Nhập tên người hoặc nơi cần gọi." };
  if (label.length > 60) return { ok: false, message: "Tên tối đa 60 ký tự." };
  if (!/^\+?[0-9]{3,15}$/.test(phone))
    return {
      ok: false,
      message: "Số điện thoại chỉ gồm chữ số, có thể bắt đầu bằng +.",
    };
  return { ok: true, value: { label, phone } };
}

export function sortContacts<T extends Contact>(contacts: T[]): T[] {
  return [...contacts].sort(
    (a, b) => a.sort - b.sort || a.created_at.localeCompare(b.created_at),
  );
}

export function nextSort(contacts: Contact[]): number {
  return contacts.reduce((max, c) => Math.max(max, c.sort), -1) + 1;
}

// Moving one place up or down: the two neighbours take each other's position.
// Positions are renumbered 0..n-1 so equal sort values cannot get stuck.
export function moveContact(
  contacts: Contact[],
  id: string,
  direction: -1 | 1,
): { id: string; sort: number }[] {
  const list = sortContacts(contacts);
  const from = list.findIndex((c) => c.id === id);
  const to = from + direction;
  if (from < 0 || to < 0 || to >= list.length) return [];
  [list[from], list[to]] = [list[to], list[from]];
  return list.flatMap((c, index) =>
    c.sort === index ? [] : [{ id: c.id, sort: index }],
  );
}

const grams = new Intl.NumberFormat("vi-VN");

export function profileLines(
  baby: {
    name: string;
    dob: string;
    blood_type: string | null;
    allergies: string | null;
    birth_weight_g: number | null;
  },
  latestWeightG: number | null,
  now: Date,
): { label: string; value: string }[] {
  const weight =
    latestWeightG !== null
      ? `${grams.format(latestWeightG)} g`
      : baby.birth_weight_g !== null
        ? `${grams.format(baby.birth_weight_g)} g (lúc sinh)`
        : "Chưa ghi";
  return [
    { label: "Tên", value: baby.name },
    { label: "Tuổi", value: formatAgeVi(baby.dob, now) },
    { label: "Nhóm máu", value: baby.blood_type || "Chưa ghi" },
    { label: "Dị ứng", value: baby.allergies || "Chưa ghi" },
    { label: "Cân nặng gần nhất", value: weight },
  ];
}
