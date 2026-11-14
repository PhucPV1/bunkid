import { describe, expect, it } from "vitest";
import { CONDITIONS } from "./conditions";

describe("content/conditions.vi.json (spec §6.6, §10.2)", () => {
  it("has the ten articles of spec §6.6 in order", () => {
    expect(CONDITIONS.articles.map((a) => a.title)).toEqual([
      "Cảm lạnh",
      "Sổ mũi, nghẹt mũi",
      "Nôn trớ",
      "Táo bón",
      "Hăm tã",
      "Chàm sữa (viêm da cơ địa)",
      "Nấm miệng (tưa lưỡi)",
      "Vàng da sinh lý",
      "Viêm tiểu phế quản",
      "Tiêu chảy",
    ]);
  });

  it("every article has a source, a review date, a unique code and a go-now list", () => {
    const codes = CONDITIONS.articles.map((a) => a.code);
    expect(new Set(codes).size).toBe(codes.length);
    for (const article of CONDITIONS.articles) {
      expect(article.source, article.code).toMatch(/^https:\/\/www\.nhs\.uk\//);
      expect(article.reviewedAt, article.code).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(article.goNow.length, article.code).toBeGreaterThan(0);
    }
  });

  it("gives no medicine doses", () => {
    const text = JSON.stringify(CONDITIONS);
    expect(text).not.toMatch(/\d+\s*(mg|ml\/kg|mg\/kg|giọt\/lần)/i);
  });
});
