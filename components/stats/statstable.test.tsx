import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { DayStat } from "@/lib/rules/dailyStats";
import { StatsTable } from "./StatsTable";

const NOW = new Date("2026-11-14T05:00:00.000Z");
const stat = (day: string, over: Partial<DayStat> = {}): DayStat => ({
  day,
  sleepMinutes: 0,
  feeds: 0,
  bottleMl: 0,
  wetDiapers: 0,
  dirtyDiapers: 0,
  pumpMl: 0,
  tummyMinutes: 0,
  solidsMeals: 0,
  waterMl: 0,
  ...over,
});
const stats = [
  stat("2026-11-13", { wetDiapers: 5, dirtyDiapers: 2 }),
  stat("2026-11-14", { wetDiapers: 3, sleepMinutes: 90 }),
];

describe("StatsTable", () => {
  it("a glass table, newest day first, with the tab's columns", () => {
    const html = renderToStaticMarkup(
      <StatsTable stats={stats} tab="diaper" now={NOW} />,
    );
    expect(html).toContain("glass");
    expect(html).toContain(">Ngày</th>");
    expect(html).toContain(">Ướt</th>");
    expect(html).toContain(">Bẩn</th>");
    expect(html.indexOf(">Hôm nay</td>")).toBeLessThan(
      html.indexOf(">Hôm qua</td>"),
    );
    expect(html).toContain(">5</td>");
    expect(html).toContain("tabular-nums");
  });

  it("shows a dash for no sleep and the duration otherwise", () => {
    const html = renderToStaticMarkup(
      <StatsTable stats={stats} tab="sleep" now={NOW} />,
    );
    expect(html).toContain(">Giờ ngủ</th>");
    expect(html).toContain(">1 giờ 30 phút</td>");
    expect(html).toContain(">—</td>");
  });

  it("the Ăn dặm tab has a meals column and a water column", () => {
    const html = renderToStaticMarkup(
      <StatsTable
        stats={[
          stat("2026-11-13", { solidsMeals: 2, waterMl: 30 }),
          stat("2026-11-14", { waterMl: 60 }),
        ]}
        tab="solids"
        now={NOW}
      />,
    );
    expect(html.indexOf(">Bữa ăn dặm</th>")).toBeLessThan(
      html.indexOf(">Nước (ml)</th>"),
    );
    expect(html.match(/<th /g)).toHaveLength(3);
    const cells = [...html.matchAll(/tabular-nums">([^<]*)<\/td>/g)].map(
      (m) => m[1],
    );
    expect(cells).toEqual(["0", "60", "2", "30"]);
  });
});
