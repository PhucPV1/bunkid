import type { CategoryToken } from "@/lib/ui/categories";
import type { IconName } from "@/lib/ui/icons";

export type TabKey = "home" | "history" | "health" | "tools";
export type Tab = { key: TabKey; href: string; label: string; icon: IconName };

export const TABS: Tab[] = [
  { key: "home", href: "/", label: "Hôm nay", icon: "home" },
  { key: "history", href: "/nhat-ky", label: "Nhật ký", icon: "list" },
  { key: "health", href: "/suc-khoe", label: "Sức khỏe", icon: "pulse" },
  { key: "tools", href: "/tien-ich", label: "Tiện ích", icon: "grid" },
];

export type NavItem = {
  label: string;
  href: string;
  icon: IconName;
  color: CategoryToken;
  detail?: string;
};

// Spec 2026-11-25 §3.4: the Sức khỏe page.
export const HEALTH_EMERGENCY = {
  label: "Khẩn cấp",
  href: "/khan-cap",
  detail: "Gọi 115, bác sĩ, hồ sơ nhóm máu và dị ứng",
};

export const HEALTH_GROWTH: NavItem = {
  label: "Tăng trưởng",
  href: "/tang-truong",
  icon: "ruler",
  color: "cat-tummy",
  detail: "Cân nặng, chiều dài theo chuẩn WHO",
};

export const HEALTH_CARDS: NavItem[] = [
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

export const HEALTH_STATS: NavItem = {
  label: "Thống kê",
  href: "/thong-ke",
  icon: "chart",
  color: "cat-sleep",
  detail: "Biểu đồ ngủ, bú, tã 7 và 14 ngày",
};

export const HEALTH_SICK: NavItem[] = [
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
    label: "Báo cáo cho bác sĩ",
    href: "/bao-cao",
    icon: "doc",
    color: "cat-temp",
    detail: "In A4 tóm tắt 14 ngày gần nhất",
  },
];

// Spec 2026-11-25 §3.5: the Tiện ích page.
export const TOOLS: NavItem[] = [
  {
    label: "Ồn trắng",
    href: "/on-trang",
    icon: "wave",
    color: "cat-sleep",
    detail: "Tiếng ồn đều giúp bé dễ ngủ",
  },
  {
    label: "Nhạc",
    href: "/nhac",
    icon: "music",
    color: "cat-feed",
    detail: "Danh sách nhạc cho bé",
  },
  {
    label: "Ảnh",
    href: "/anh",
    icon: "image",
    color: "cat-diaper",
    detail: "Ảnh của bé",
  },
  {
    label: "Bồng bế",
    href: "/bong-be",
    icon: "hands",
    color: "cat-tummy",
    detail: "Tư thế bế, ợ hơi, cho bú",
  },
];

// Spec 2026-11-25 §3.1: the pages that light up the Sức khỏe tab. /kham-pha
// and /cam-nang redirect to it.
const HEALTH_PREFIXES = [
  "/suc-khoe",
  "/kham-pha",
  "/cam-nang",
  HEALTH_EMERGENCY.href,
  HEALTH_GROWTH.href,
  HEALTH_STATS.href,
  ...[...HEALTH_CARDS, ...HEALTH_SICK].map((item) => item.href),
];

const TOOLS_PREFIXES = ["/tien-ich", ...TOOLS.map((item) => item.href)];

function under(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export function activeTab(pathname: string): TabKey | null {
  if (pathname === "/" || under(pathname, "/cai-dat")) return "home";
  if (under(pathname, "/nhat-ky")) return "history";
  if (HEALTH_PREFIXES.some((prefix) => under(pathname, prefix)))
    return "health";
  if (TOOLS_PREFIXES.some((prefix) => under(pathname, prefix))) return "tools";
  return null;
}

// Spec 2026-11-19 §4: the Hôm nay tab shows the running timer on every page
// except Hôm nay, where the hero card already shows it.
export function showsTabTimer(pathname: string): boolean {
  return pathname !== "/";
}
