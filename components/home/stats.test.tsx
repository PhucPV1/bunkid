import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { HomeStatTile } from "@/lib/rules/summaryText";
import type { LogRow } from "@/lib/supabase/rows";
import { ICON_PATHS } from "@/lib/ui/icons";
import { RecentCard } from "./RecentCard";
import { GROUP_LABEL } from "./sectionTitle";
import { StatsSection } from "./StatsSection";

const NOW = new Date("2026-11-14T05:00:00Z");
const tile = (
  label: string,
  value: string,
  note: string,
  tone: HomeStatTile["tone"],
  explain: string | null = null,
): HomeStatTile => ({ label, value, note, tone, explain });
const tiles: HomeStatTile[] = [
  tile("Giấc ngủ", "13g 5p", "Bình thường", "good"),
  tile("Cữ bú", "8", "Bình thường", "good"),
  tile("Tã ướt", "6", "Đánh giá sau 24 giờ đầu", "muted"),
];
// Every <p> of the section as [class, text].
const P_TAG = /<p class="([^"]*)">([^<]+)<\/p>/g;
const lines = (html: string) =>
  [...html.matchAll(P_TAG)].map((m) => [m[1], m[2]]);
const bottle = (i: number): LogRow =>
  ({
    id: `b${i}`,
    baby_id: "b1",
    type: "bottle",
    started_at: new Date(NOW.getTime() - i * 3_600_000).toISOString(),
    ended_at: new Date(NOW.getTime() - i * 3_600_000).toISOString(),
    details: { ml: 90, milk: "formula" },
    note: null,
    created_by: "u1",
    created_at: NOW.toISOString(),
    updated_at: NOW.toISOString(),
  }) as LogRow;

// Spec 2026-11-19 §3.5.
describe("StatsSection", () => {
  it("shows a group label, three tiles and the totals line", () => {
    const html = renderToStaticMarkup(
      <StatsSection tiles={tiles} totals="Bình 180 ml · Tã bẩn 2" />,
    );
    expect(html).toContain(`<h2 class="${GROUP_LABEL}">24 giờ qua</h2>`);
    expect(html).toContain("grid-cols-3");
    expect(html).toContain(">13g 5p</span>");
    expect(html).toContain(">Bình thường</span>");
    expect(html).toContain("text-good");
    expect(lines(html)).toEqual([
      [
        "px-1 text-[13px] leading-[18px] text-muted tabular-nums",
        "Bình 180 ml · Tã bẩn 2",
      ],
    ]);
  });

  it("links to Thống kê from the title row, with a 44 px tall touch target", () => {
    const html = renderToStaticMarkup(
      <StatsSection tiles={tiles} totals={null} />,
    );
    const link = html.match(/<a [^>]*href="\/thong-ke"[^>]*>/)?.[0] ?? "";
    expect(link).toContain("min-h-11");
    expect(link).toContain("text-[13px]");
    expect(link).toContain("font-semibold");
    expect(link).toContain("text-accent-text");
    expect(html).toContain(
      '>Thống kê<svg width="14" height="14" viewBox="0 0 24 24"',
    );
    expect(html).toContain(`d="${ICON_PATHS.chevronRight}"`);
    expect(html.indexOf("24 giờ qua")).toBeLessThan(html.indexOf("Thống kê"));
    expect(html.indexOf("Thống kê")).toBeLessThan(html.indexOf("grid-cols-3"));
  });

  it("explains each yellow or red rating under the tiles, in tile order", () => {
    const rated = [
      tile("Giấc ngủ", "9g", "Cần chú ý", "warn", "Bé ngủ ít hơn chuẩn"),
      tile("Cữ bú", "5", "Cần chú ý", "warn", "Ít cữ bú hơn chuẩn"),
      tile("Tã ướt", "2", "Báo bác sĩ", "danger", "Rất ít tã ướt"),
    ];
    const html = renderToStaticMarkup(
      <StatsSection tiles={rated} totals="Tã bẩn 1" />,
    );
    expect(lines(html)).toEqual([
      ["px-1 text-[13px] leading-[18px] text-warn", "Bé ngủ ít hơn chuẩn"],
      ["px-1 text-[13px] leading-[18px] text-warn", "Ít cữ bú hơn chuẩn"],
      ["px-1 text-[13px] leading-[18px] text-danger", "Rất ít tã ướt"],
      ["px-1 text-[13px] leading-[18px] text-muted tabular-nums", "Tã bẩn 1"],
    ]);
    expect(html.indexOf("Bé ngủ ít hơn chuẩn")).toBeGreaterThan(
      html.indexOf("Báo bác sĩ"),
    );
  });

  it("draws no line at all when no rating needs a word and the totals are zero", () => {
    const html = renderToStaticMarkup(
      <StatsSection tiles={tiles} totals={null} />,
    );
    expect(lines(html)).toEqual([]);
    expect(html).not.toContain("<p ");
  });
});

describe("RecentCard", () => {
  it("lists at most six records with chip, description, who and time", () => {
    const logs = [1, 2, 3, 4, 5, 6, 7].map(bottle);
    const html = renderToStaticMarkup(
      <RecentCard
        logs={logs}
        now={NOW}
        nameOf={() => "Ba"}
        pending={new Set(["b1"])}
      />,
    );
    expect(html).toContain(">Gần đây</h2>");
    expect(html).toContain('href="/nhat-ky"');
    expect(html).toContain(">Tất cả</a>");
    expect(html.match(/<li/g)).toHaveLength(6);
    expect(html).toContain("bg-cat-bottle/15 text-cat-bottle");
    expect(html).toContain(`d="${ICON_PATHS.bottle}"`);
    expect(html).toContain(">Bình 90 ml sữa công thức</span>");
    expect(html).toContain(">11:00</span>");
    expect(html).toContain("Ba");
    expect(html.match(/aria-label="Chờ đồng bộ"/g)).toHaveLength(1);
  });

  it("says so when nothing was logged", () => {
    const html = renderToStaticMarkup(
      <RecentCard
        logs={[]}
        now={NOW}
        nameOf={() => "Ba"}
        pending={new Set()}
      />,
    );
    expect(html).toContain("Chưa có ghi chép nào trong 24 giờ qua.");
    expect(html).not.toContain("<li");
  });
});
