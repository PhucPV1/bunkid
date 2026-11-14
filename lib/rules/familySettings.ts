export type Role = "owner" | "member";

export const ROLE_LABEL: Record<Role, string> = {
  owner: "Chủ gia đình",
  member: "Thành viên",
};

export function roleLabel(role: string): string {
  return role === "owner" || role === "member" ? ROLE_LABEL[role] : role;
}

export type MemberFormRaw = {
  email: string;
  displayName: string;
  role: string;
};
export type MemberInput = { email: string; display_name: string; role: Role };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function parseMemberForm(
  raw: MemberFormRaw,
):
  | { ok: true; value: MemberInput }
  | { ok: false; errors: Partial<Record<keyof MemberFormRaw, string>> } {
  const errors: Partial<Record<keyof MemberFormRaw, string>> = {};
  const email = raw.email.trim().toLowerCase();
  if (!EMAIL.test(email) || email.length > 254)
    errors.email = "Nhập Gmail hợp lệ";
  const displayName = raw.displayName.trim();
  if (displayName.length < 1 || displayName.length > 40)
    errors.displayName = "Nhập tên hiển thị (tối đa 40 ký tự)";
  if (raw.role !== "owner" && raw.role !== "member")
    errors.role = "Chọn vai trò";
  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return {
    ok: true,
    value: { email, display_name: displayName, role: raw.role as Role },
  };
}

export const FEED_INTERVAL_OPTIONS: number[] = Array.from(
  { length: (360 - 60) / 15 + 1 },
  (_, i) => 60 + i * 15,
);

export function formatInterval(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours} giờ` : `${hours} giờ ${rest} phút`;
}
