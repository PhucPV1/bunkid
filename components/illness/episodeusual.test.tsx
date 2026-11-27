import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { UsualView } from "@/lib/rules/illnessView";
import { ICON_PATHS } from "@/lib/ui/icons";
import { EpisodeUsual } from "./EpisodeUsual";

const ROWS: UsualView = {
  sub: "Hôm qua, so với trung bình 7 ngày trước khi ốm",
  message: null,
  rows: [
    {
      label: "Bú",
      line: "6 cữ · thường 8 cữ",
      chip: { text: "Ít hơn", tone: "warn" },
    },
    {
      label: "Tã ướt",
      line: "5 lần · thường 6 lần",
      chip: { text: "Như thường", tone: "good" },
    },
    {
      label: "Ngủ",
      line: "17 giờ · thường 13 giờ",
      chip: { text: "Nhiều hơn", tone: "neutral" },
    },
  ],
};
const card = (view: UsualView) =>
  renderToStaticMarkup(<EpisodeUsual view={view} />);

// Spec 2026-11-26 §5.4 and §6.3 item 5 (board "Đợt ốm · A").
describe("EpisodeUsual", () => {
  it("a glass card titled So với thường ngày, with what is compared under it", () => {
    const html = card(ROWS);
    expect(html).toMatch(/^<section class="glass[^"]*rounded-\[26px\]/);
    expect(html).toMatch(/<h2[^>]*font-bold[^>]*>So với thường ngày<\/h2>/);
    expect(html).toMatch(
      /<p[^>]*text-muted[^>]*>Hôm qua, so với trung bình 7 ngày trước khi ốm<\/p>/,
    );
    expect(html).not.toContain("truncate");
  });

  it("one row each: the name, the numbers, and a chip with words", () => {
    const html = card(ROWS);
    expect(html).toMatch(
      /font-semibold[^>]*>Bú<\/span><span[^>]*text-muted[^>]*>6 cữ · thường 8 cữ<\/span><\/span><span[^>]*bg-warn-soft[^>]*>Ít hơn<\/span>/,
    );
    expect(html).toMatch(/bg-good-soft[^>]*>Như thường<\/span>/);
    expect(html).toMatch(/bg-line[^>]*>Nhiều hơn<\/span>/);
    const order = ["Bú", "Tã ướt", "Ngủ"].map((label) =>
      html.indexOf(`>${label}</span>`),
    );
    expect(order).toEqual([...order].sort((a, b) => a - b));
    expect(order[0]).toBeGreaterThan(-1);
  });

  it("ends with the way to symptom triage, a touch target of 44 px", () => {
    const html = card(ROWS);
    expect(html).toMatch(
      /<a class="[^"]*min-h-11[^"]*" href="\/trieu-chung">.*Phân loại triệu chứng.*<\/a><\/section>$/,
    );
    expect(html).toContain(`d="${ICON_PATHS.chevronRight}"`);
  });

  it("with nothing to compare: one sentence, no rows, the link stays", () => {
    const html = card({
      sub: null,
      message: "Chưa đủ dữ liệu trước khi ốm để so.",
      rows: [],
    });
    expect(html).toMatch(/<p[^>]*>Chưa đủ dữ liệu trước khi ốm để so\.<\/p>/);
    expect(html).not.toContain("so với trung bình");
    expect(html).not.toContain("rounded-full");
    expect(html).toContain('href="/trieu-chung"');
  });
});
