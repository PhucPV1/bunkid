export class PermissionDeniedError extends Error {
  constructor() {
    super("permission_denied");
    this.name = "PermissionDeniedError";
  }
}

const PERMISSION = "Bạn không có quyền thực hiện thao tác này";

export function toVietnameseError(e: unknown): string {
  if (e instanceof PermissionDeniedError) return PERMISSION;
  const message =
    typeof e === "object" && e !== null && "message" in e
      ? String((e as { message: unknown }).message)
      : "";
  // supabase-js reports fetch failures as an error object, not a thrown TypeError.
  if (/failed to fetch|network|load failed/i.test(message))
    return "Mất kết nối mạng, thử lại sau.";
  if (/last_owner/.test(message))
    return "Gia đình phải còn ít nhất một chủ gia đình.";
  if (typeof e === "object" && e !== null && "code" in e) {
    const code = (e as { code?: unknown }).code;
    if (code === "23505") return "Đã có người bắt đầu trước.";
    // Spec 2026-11-26 §8: a visit whose episode is not on the server (yet,
    // or any more); the outbox drops such a change with the same words.
    if (code === "23503") return "Bản ghi liên quan không còn.";
    if (code === "42501") return PERMISSION;
  }
  if (e instanceof Error) return `Có lỗi xảy ra: ${e.message}`;
  if (typeof e === "object" && e !== null && "message" in e)
    return `Có lỗi xảy ra: ${String((e as { message: unknown }).message)}`;
  return "Có lỗi xảy ra.";
}

export function memberErrorText(e: unknown): string {
  if (
    typeof e === "object" &&
    e !== null &&
    "code" in e &&
    (e as { code?: unknown }).code === "23505"
  )
    return "Gmail này đã có trong gia đình.";
  return toVietnameseError(e);
}
