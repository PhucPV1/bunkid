import { describe, expect, it } from "vitest";
import * as nav from "./nav";
import {
  activeTab,
  EXPLORE_EMERGENCY,
  EXPLORE_GUIDES,
  EXPLORE_REPORT,
  EXPLORE_SOOTHE,
  EXPLORE_TRACK,
  showsTabTimer,
  TABS,
} from "./nav";

const ALL_EXPLORE = [
  ...EXPLORE_TRACK,
  ...EXPLORE_GUIDES,
  ...EXPLORE_SOOTHE,
  EXPLORE_REPORT,
];

describe("nav", () => {
  it("has the three tabs of spec §6.1 with SVG icons", () => {
    expect(TABS).toEqual([
      { key: "home", href: "/", label: "Hôm nay", icon: "home" },
      { key: "history", href: "/nhat-ky", label: "Nhật ký", icon: "list" },
      { key: "explore", href: "/kham-pha", label: "Khám phá", icon: "explore" },
    ]);
  });

  it("Khám phá lists the sections of spec §6.4 in order", () => {
    expect(EXPLORE_EMERGENCY).toEqual({
      label: "Khẩn cấp",
      href: "/khan-cap",
      detail: "Gọi 115, bác sĩ, hồ sơ nhóm máu và dị ứng",
    });
    expect(
      EXPLORE_TRACK.map((i) => [i.label, i.href, i.icon, i.color]),
    ).toEqual([
      ["Thống kê", "/thong-ke", "chart", "cat-sleep"],
      ["Tăng trưởng", "/tang-truong", "ruler", "cat-tummy"],
      ["Tiêm chủng", "/tiem-chung", "syringe", "cat-temp"],
      ["Phát triển", "/phat-trien", "star", "cat-diaper"],
    ]);
    expect(
      EXPLORE_GUIDES.map((i) => [i.label, i.href, i.icon, i.color]),
    ).toEqual([
      ["Triệu chứng", "/trieu-chung", "thermo", "cat-med"],
      ["Bệnh thường gặp", "/benh-thuong-gap", "book", "cat-feed"],
      ["Bồng bế", "/bong-be", "hands", "cat-tummy"],
    ]);
    expect(
      EXPLORE_SOOTHE.map((i) => [i.label, i.href, i.icon, i.color]),
    ).toEqual([
      ["Ồn trắng", "/on-trang", "wave", "cat-sleep"],
      ["Nhạc", "/nhac", "music", "cat-feed"],
      ["Ảnh", "/anh", "image", "cat-diaper"],
    ]);
    expect(EXPLORE_REPORT).toEqual({
      label: "Báo cáo cho bác sĩ",
      href: "/bao-cao",
      icon: "doc",
      color: "cat-temp",
      detail: "In A4 tóm tắt 14 ngày gần nhất",
    });
  });

  it("track and guide cards carry the spec's one-line descriptions", () => {
    expect(EXPLORE_TRACK.map((i) => i.detail)).toEqual([
      "Biểu đồ ngủ, bú, tã 7 và 14 ngày",
      "Cân nặng, chiều dài theo chuẩn WHO",
      "Mũi tiếp theo và lịch đã tiêm",
      "Các mốc theo tháng tuổi",
    ]);
    expect(EXPLORE_GUIDES.map((i) => i.detail)).toEqual([
      "Hỏi từng bước, biết khi nào đi khám",
      "10 bài theo NHS",
      "Tư thế bế, ợ hơi, cho bú",
    ]);
  });

  it("activeTab maps pages to the three tabs", () => {
    expect(activeTab("/")).toBe("home");
    expect(activeTab("/cai-dat")).toBe("home");
    expect(activeTab("/cai-dat/thanh-vien")).toBe("home");
    expect(activeTab("/nhat-ky")).toBe("history");
    expect(activeTab("/kham-pha")).toBe("explore");
    expect(activeTab("/cam-nang")).toBe("explore");
    expect(activeTab("/tien-ich")).toBe("explore");
    expect(activeTab(EXPLORE_EMERGENCY.href)).toBe("explore");
    for (const item of ALL_EXPLORE)
      expect(activeTab(item.href)).toBe("explore");
    expect(activeTab("/nhat-ky-cu")).toBeNull();
    expect(activeTab("/dang-nhap")).toBeNull();
    expect(activeTab("/cai-app")).toBeNull();
  });
});

describe("showsTabTimer (spec 2026-11-19 §4)", () => {
  it("is off on Hôm nay, which already has the hero card, and on elsewhere", () => {
    expect(showsTabTimer("/")).toBe(false);
    expect(showsTabTimer("/nhat-ky")).toBe(true);
    expect(showsTabTimer("/kham-pha")).toBe(true);
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

  it("until the tab bar changes, the two new pages light the Khám phá tab", () => {
    expect(activeTab("/suc-khoe")).toBe("explore");
    expect(activeTab("/tien-ich")).toBe("explore");
  });
});
