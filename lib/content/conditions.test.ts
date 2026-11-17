import { describe, expect, it } from "vitest";
import { CONDITIONS } from "./conditions";

describe("content/conditions.vi.json (spec §6.6, §10.2)", () => {
  it("has the ten articles of spec §6.6, then the nine of spec 2026-11-17, in order", () => {
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
      "Sốt",
      "Viêm tai giữa",
      "Mọc răng",
      "Khóc dạ đề (colic)",
      "Rôm sảy",
      "Sốt phát ban (roseola)",
      "Tay chân miệng",
      "Viêm thanh quản (croup)",
      "Đau mắt đỏ, ghèn mắt",
    ]);
  });

  it("has the short tab names and suggestion ages of spec 2026-11-17 §4.2, §4.4", () => {
    const short = Object.fromEntries(
      CONDITIONS.articles
        .filter((a) => a.short !== undefined)
        .map((a) => [a.code, a.short]),
    );
    expect(short).toEqual({
      so_mui: "Sổ mũi",
      cham_sua: "Chàm sữa",
      nam_mieng: "Tưa lưỡi",
      vang_da_sinh_ly: "Vàng da",
      khoc_da_de: "Khóc dạ đề",
      sot_phat_ban: "Sốt phát ban",
      croup: "Croup",
      dau_mat: "Đau mắt",
    });
    const ages = Object.fromEntries(
      CONDITIONS.articles
        .filter((a) => a.minAgeDays !== undefined || a.maxAgeDays !== undefined)
        .map((a) => [a.code, [a.minAgeDays ?? null, a.maxAgeDays ?? null]]),
    );
    expect(ages).toEqual({
      vang_da_sinh_ly: [null, 60],
      viem_tieu_phe_quan: [null, 730],
      moc_rang: [90, null],
      khoc_da_de: [null, 180],
      sot_phat_ban: [150, 1100],
    });
  });

  it("states medicine only with age limits and the pharmacist line", () => {
    const lines = CONDITIONS.articles.flatMap((a) => a.homeCare);
    for (const line of lines.filter((l) => /paracetamol|ibuprofen/i.test(l))) {
      expect(line).toContain(
        "đúng liều theo cân nặng ghi trên hộp hoặc hỏi dược sĩ",
      );
      expect(line).toContain("không dùng aspirin");
    }
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
