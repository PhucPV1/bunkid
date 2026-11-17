import type { CategoryToken } from "@/lib/ui/categories";
import type { IconName } from "@/lib/ui/icons";

export type TabKey = "home" | "history" | "explore";
export type Tab = { key: TabKey; href: string; label: string; icon: IconName };

export const TABS: Tab[] = [
  { key: "home", href: "/", label: "Hôm nay", icon: "home" },
  { key: "history", href: "/nhat-ky", label: "Nhật ký", icon: "list" },
  { key: "explore", href: "/kham-pha", label: "Khám phá", icon: "explore" },
];

export type ExploreItem = {
  label: string;
  href: string;
  icon: IconName;
  color: CategoryToken;
  detail?: string;
};

export const EXPLORE_EMERGENCY = {
  label: "Khẩn cấp",
  href: "/khan-cap",
  detail: "Gọi 115, bác sĩ, hồ sơ nhóm máu và dị ứng",
};

export const EXPLORE_TRACK: ExploreItem[] = [
  {
    label: "Thống kê",
    href: "/thong-ke",
    icon: "chart",
    color: "cat-sleep",
    detail: "Biểu đồ ngủ, bú, tã 7 và 14 ngày",
  },
  {
    label: "Tăng trưởng",
    href: "/tang-truong",
    icon: "ruler",
    color: "cat-tummy",
    detail: "Cân nặng, chiều dài theo chuẩn WHO",
  },
  {
    label: "Tiêm chủng",
    href: "/tiem-chung",
    icon: "syringe",
    color: "cat-temp",
    detail: "Mũi tiếp theo và lịch đã tiêm",
  },
  {
    label: "Phát triển",
    href: "/phat-trien",
    icon: "star",
    color: "cat-diaper",
    detail: "Các mốc theo tháng tuổi",
  },
];

export const EXPLORE_GUIDES: ExploreItem[] = [
  {
    label: "Triệu chứng",
    href: "/trieu-chung",
    icon: "thermo",
    color: "cat-med",
    detail: "Hỏi từng bước, biết khi nào đi khám",
  },
  {
    label: "Bệnh thường gặp",
    href: "/benh-thuong-gap",
    icon: "book",
    color: "cat-feed",
    detail: "10 bài theo NHS",
  },
  {
    label: "Bồng bế",
    href: "/bong-be",
    icon: "hands",
    color: "cat-tummy",
    detail: "Tư thế bế, ợ hơi, cho bú",
  },
];

export const EXPLORE_SOOTHE: ExploreItem[] = [
  { label: "Ồn trắng", href: "/on-trang", icon: "wave", color: "cat-sleep" },
  { label: "Nhạc", href: "/nhac", icon: "music", color: "cat-feed" },
  { label: "Ảnh", href: "/anh", icon: "image", color: "cat-diaper" },
];

export const EXPLORE_REPORT: ExploreItem = {
  label: "Báo cáo cho bác sĩ",
  href: "/bao-cao",
  icon: "doc",
  color: "cat-temp",
  detail: "In A4 tóm tắt 14 ngày gần nhất",
};

// Pages that light up the Khám phá tab; /cam-nang and /tien-ich now redirect there.
const EXPLORE_PREFIXES = [
  "/kham-pha",
  "/cam-nang",
  "/tien-ich",
  EXPLORE_EMERGENCY.href,
  ...[
    ...EXPLORE_TRACK,
    ...EXPLORE_GUIDES,
    ...EXPLORE_SOOTHE,
    EXPLORE_REPORT,
  ].map((item) => item.href),
];

function under(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export function activeTab(pathname: string): TabKey | null {
  if (pathname === "/" || under(pathname, "/cai-dat")) return "home";
  if (under(pathname, "/nhat-ky")) return "history";
  if (EXPLORE_PREFIXES.some((prefix) => under(pathname, prefix)))
    return "explore";
  return null;
}

// Spec 2026-11-17 §5.2: the timer pill shows on every page except Hôm nay,
// where the hero card already shows the running timer.
export function showsTimerPill(pathname: string): boolean {
  return pathname !== "/";
}
