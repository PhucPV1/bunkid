export type LoadErrorKind = "offline" | "server-down" | "other";

export const LOAD_ERROR_TEXT: Record<LoadErrorKind, string> = {
  offline: "Bạn đang offline. Kết nối mạng rồi thử lại.",
  "server-down":
    "Máy chủ đang ngủ hoặc không truy cập được. Nếu kéo dài, vào supabase.com, mở project và bấm Restore.",
  other: "Không tải được dữ liệu gia đình.",
};

export function classifyLoadError(e: unknown, online: boolean): LoadErrorKind {
  if (!online) return "offline";
  const message =
    typeof e === "object" && e !== null && "message" in e
      ? String((e as { message: unknown }).message)
      : "";
  if (/failed to fetch|load failed|network/i.test(message))
    return "server-down";
  return "other";
}
