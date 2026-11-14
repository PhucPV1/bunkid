export type TabKey = "home" | "history" | "guide" | "tools" | "settings";

export const TABS: {
  key: TabKey;
  href: string;
  label: string;
  icon: string;
}[] = [
  { key: "home", href: "/", label: "Trang chủ", icon: "🏠" },
  { key: "history", href: "/nhat-ky", label: "Nhật ký", icon: "📖" },
  { key: "guide", href: "/cam-nang", label: "Cẩm nang", icon: "📚" },
  { key: "tools", href: "/tien-ich", label: "Tiện ích", icon: "🧰" },
  { key: "settings", href: "/cai-dat", label: "Cài đặt", icon: "⚙️" },
];

export type MenuItem = { label: string; href: string | null };

export const GUIDE_ITEMS: MenuItem[] = [
  { label: "Tiêm chủng", href: "/tiem-chung" },
  { label: "Triệu chứng", href: "/trieu-chung" },
  { label: "Phát triển", href: "/phat-trien" },
  { label: "Bồng bế", href: "/bong-be" },
  { label: "Bệnh thường gặp", href: "/benh-thuong-gap" },
];

export const TOOL_ITEMS: MenuItem[] = [
  { label: "Thống kê", href: "/thong-ke" },
  { label: "Tăng trưởng", href: "/tang-truong" },
  { label: "Khẩn cấp", href: "/khan-cap" },
  { label: "Nhạc", href: "/nhac" },
  { label: "Ồn trắng", href: "/on-trang" },
  { label: "Ảnh", href: "/anh" },
  { label: "Báo cáo", href: null },
];

const OWNERS: { tab: TabKey; prefixes: string[] }[] = [
  { tab: "history", prefixes: ["/nhat-ky"] },
  {
    tab: "guide",
    prefixes: [
      "/cam-nang",
      "/tiem-chung",
      "/trieu-chung",
      "/benh-thuong-gap",
      "/phat-trien",
      "/bong-be",
    ],
  },
  {
    tab: "tools",
    prefixes: [
      "/tien-ich",
      "/thong-ke",
      "/tang-truong",
      "/khan-cap",
      "/nhac",
      "/on-trang",
      "/anh",
      "/bao-cao",
    ],
  },
  { tab: "settings", prefixes: ["/cai-dat"] },
];

export function activeTab(pathname: string): TabKey | null {
  if (pathname === "/") return "home";
  const owner = OWNERS.find(({ prefixes }) =>
    prefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`)),
  );
  return owner?.tab ?? null;
}
