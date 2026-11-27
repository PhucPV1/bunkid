import { describe, expect, it } from "vitest";
import * as nav from "./nav";
import { activeTab, showsTabTimer, TABS } from "./nav";

const HEALTH_PAGES = [
  nav.HEALTH_EMERGENCY,
  nav.HEALTH_GROWTH,
  ...nav.HEALTH_CARDS,
  nav.HEALTH_STATS,
  ...nav.HEALTH_SICK,
];

// Spec 2026-11-25 §3.1.
describe("nav", () => {
  it("has four tabs with SVG icons", () => {
    expect(TABS).toEqual([
      { key: "home", href: "/", label: "Hôm nay", icon: "home" },
      { key: "history", href: "/nhat-ky", label: "Nhật ký", icon: "list" },
      { key: "health", href: "/suc-khoe", label: "Sức khỏe", icon: "pulse" },
      { key: "tools", href: "/tien-ich", label: "Tiện ích", icon: "grid" },
    ]);
  });

  it("Hôm nay and Nhật ký light up as before", () => {
    expect(activeTab("/")).toBe("home");
    expect(activeTab("/cai-dat")).toBe("home");
    expect(activeTab("/cai-dat/thanh-vien")).toBe("home");
    expect(activeTab("/nhat-ky")).toBe("history");
  });

  it("Sức khỏe lights up on its page, its sub-pages and the two old addresses", () => {
    for (const path of [
      "/suc-khoe",
      "/kham-pha",
      "/cam-nang",
      "/tang-truong/chieu-cao",
      // Spec 2026-11-26 §6.1: the list of illness episodes and one episode.
      "/dot-om",
      "/dot-om/chi-tiet",
      ...HEALTH_PAGES.map((item) => item.href),
    ])
      expect(activeTab(path), path).toBe("health");
    expect(HEALTH_PAGES.map((item) => item.href)).toEqual([
      "/khan-cap",
      "/tang-truong",
      "/tiem-chung",
      "/phat-trien",
      "/thong-ke",
      "/dot-om",
      "/trieu-chung",
      "/benh-thuong-gap",
      "/bao-cao",
    ]);
  });

  it("Tiện ích lights up on its page and its four sub-pages", () => {
    for (const path of ["/tien-ich", ...nav.TOOLS.map((item) => item.href)])
      expect(activeTab(path), path).toBe("tools");
    expect(nav.TOOLS.map((item) => item.href)).toEqual([
      "/on-trang",
      "/nhac",
      "/anh",
      "/bong-be",
    ]);
  });

  it("other pages light no tab, and a prefix alone is not a match", () => {
    expect(activeTab("/nhat-ky-cu")).toBeNull();
    expect(activeTab("/suc-khoe-cu")).toBeNull();
    expect(activeTab("/dot-om-cu")).toBeNull();
    expect(activeTab("/dang-nhap")).toBeNull();
    expect(activeTab("/cai-app")).toBeNull();
  });

  it("the Khám phá names are gone", () => {
    expect(Object.keys(nav).filter((name) => /explore/i.test(name))).toEqual(
      [],
    );
  });
});

describe("showsTabTimer (spec 2026-11-19 §4)", () => {
  it("is off on Hôm nay, which already has the hero card, and on elsewhere", () => {
    expect(showsTabTimer("/")).toBe(false);
    expect(showsTabTimer("/nhat-ky")).toBe(true);
    expect(showsTabTimer("/suc-khoe")).toBe(true);
    expect(showsTabTimer("/tien-ich")).toBe(true);
    expect(showsTabTimer("/cai-dat")).toBe(true);
    expect(showsTabTimer("/cai-dat/cu-bu")).toBe(true);
  });

  it("replaces showsTimerPill: the old name is gone", () => {
    expect(Object.keys(nav)).not.toContain("showsTimerPill");
  });
});

// Spec 2026-11-25 §3.4 and §3.5.
describe("Sức khỏe and Tiện ích items", () => {
  const brief = (i: nav.NavItem) => [
    i.label,
    i.href,
    i.icon,
    i.color,
    i.detail,
  ];

  it("Sức khỏe: the growth card, two cards, the stats row and three sick-day rows", () => {
    expect(nav.HEALTH_EMERGENCY).toEqual({
      label: "Khẩn cấp",
      href: "/khan-cap",
      detail: "Gọi 115, bác sĩ, hồ sơ nhóm máu và dị ứng",
    });
    expect(brief(nav.HEALTH_GROWTH)).toEqual([
      "Tăng trưởng",
      "/tang-truong",
      "ruler",
      "cat-tummy",
      "Cân nặng, chiều dài theo chuẩn WHO",
    ]);
    expect(nav.HEALTH_CARDS.map(brief)).toEqual([
      [
        "Tiêm chủng",
        "/tiem-chung",
        "syringe",
        "cat-temp",
        "Mũi tiếp theo và lịch đã tiêm",
      ],
      [
        "Phát triển",
        "/phat-trien",
        "star",
        "cat-diaper",
        "Các mốc theo tháng tuổi",
      ],
    ]);
    expect(brief(nav.HEALTH_STATS)).toEqual([
      "Thống kê",
      "/thong-ke",
      "chart",
      "cat-sleep",
      "Biểu đồ ngủ, bú, tã 7 và 14 ngày",
    ]);
    expect(nav.HEALTH_SICK.map(brief)).toEqual([
      [
        "Đợt ốm",
        "/dot-om",
        "calendar",
        "cat-temp",
        "Gom sốt, thuốc, triệu chứng theo từng đợt",
      ],
      [
        "Triệu chứng",
        "/trieu-chung",
        "thermo",
        "cat-med",
        "Hỏi từng bước, biết khi nào đi khám",
      ],
      [
        "Bệnh thường gặp",
        "/benh-thuong-gap",
        "book",
        "cat-feed",
        "10 bài theo NHS",
      ],
      [
        "Báo cáo cho bác sĩ",
        "/bao-cao",
        "doc",
        "cat-temp",
        "In A4 tóm tắt 14 ngày gần nhất",
      ],
    ]);
  });

  it("Tiện ích: four cards with a one-line description each", () => {
    expect(nav.TOOLS.map(brief)).toEqual([
      [
        "Ồn trắng",
        "/on-trang",
        "wave",
        "cat-sleep",
        "Tiếng ồn đều giúp bé dễ ngủ",
      ],
      ["Nhạc", "/nhac", "music", "cat-feed", "Danh sách nhạc cho bé"],
      ["Ảnh", "/anh", "image", "cat-diaper", "Ảnh của bé"],
      ["Bồng bế", "/bong-be", "hands", "cat-tummy", "Tư thế bế, ợ hơi, cho bú"],
    ]);
  });
});
