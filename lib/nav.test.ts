import { describe, expect, it } from "vitest";
import { activeTab, GUIDE_ITEMS, TABS, TOOL_ITEMS } from "./nav";

describe("nav", () => {
  it("has the five tabs of spec §6.18 in order", () => {
    expect(TABS.map((t) => t.label)).toEqual([
      "Trang chủ",
      "Nhật ký",
      "Cẩm nang",
      "Tiện ích",
      "Cài đặt",
    ]);
  });

  it("activeTab maps each page to its tab", () => {
    expect(activeTab("/")).toBe("home");
    expect(activeTab("/nhat-ky")).toBe("history");
    expect(activeTab("/thong-ke")).toBe("tools");
    expect(activeTab("/tien-ich")).toBe("tools");
    expect(activeTab("/tiem-chung")).toBe("guide");
    expect(activeTab("/cai-dat")).toBe("settings");
    expect(activeTab("/nhat-ky-cu")).toBeNull();
    expect(activeTab("/dang-nhap")).toBeNull();
  });

  it("Cẩm nang opens the vaccine page", () => {
    expect(GUIDE_ITEMS.find((i) => i.label === "Tiêm chủng")?.href).toBe(
      "/tiem-chung",
    );
  });

  it("Tiện ích opens the emergency page", () => {
    expect(TOOL_ITEMS.find((i) => i.label === "Khẩn cấp")?.href).toBe(
      "/khan-cap",
    );
  });

  it("Tiện ích opens the growth page", () => {
    expect(TOOL_ITEMS.find((i) => i.label === "Tăng trưởng")?.href).toBe(
      "/tang-truong",
    );
  });

  it("Cẩm nang opens symptom triage", () => {
    expect(GUIDE_ITEMS.find((i) => i.label === "Triệu chứng")?.href).toBe(
      "/trieu-chung",
    );
  });

  it("Cẩm nang opens the common illnesses guide", () => {
    expect(GUIDE_ITEMS.find((i) => i.label === "Bệnh thường gặp")?.href).toBe(
      "/benh-thuong-gap",
    );
  });

  it("Tiện ích opens white noise", () => {
    expect(TOOL_ITEMS.find((i) => i.label === "Ồn trắng")?.href).toBe(
      "/on-trang",
    );
  });

  it("opens the holding guide and music", () => {
    expect(GUIDE_ITEMS.find((i) => i.label === "Bồng bế")?.href).toBe(
      "/bong-be",
    );
    expect(TOOL_ITEMS.find((i) => i.label === "Nhạc")?.href).toBe("/nhac");
  });

  it("Tiện ích opens photos", () => {
    expect(TOOL_ITEMS.find((i) => i.label === "Ảnh")?.href).toBe("/anh");
  });

  it("every menu link opens under its own tab", () => {
    for (const item of GUIDE_ITEMS)
      if (item.href) expect(activeTab(item.href)).toBe("guide");
    for (const item of TOOL_ITEMS)
      if (item.href) expect(activeTab(item.href)).toBe("tools");
  });
});
