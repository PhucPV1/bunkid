import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { HomeStatTile } from "@/lib/rules/summaryText";
import type { LogRow } from "@/lib/supabase/rows";
import { ICON_PATHS } from "@/lib/ui/icons";
import { RecentCard } from "./RecentCard";
import { StatsSection } from "./StatsSection";

const NOW = new Date("2026-11-14T05:00:00Z");
const tiles: HomeStatTile[] = [
  { label: "Giấc ngủ", value: "13g 5p", note: "Bình thường", tone: "good" },
  { label: "Cữ bú", value: "8", note: "Cần chú ý", tone: "warn" },
  {
    label: "Tã ướt",
    value: "6",
    note: "Đánh giá sau 24 giờ đầu",
    tone: "muted",
  },
];
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

describe("StatsSection", () => {
  it("shows a titled row of three tiles and the totals line", () => {
    const html = renderToStaticMarkup(
      <StatsSection tiles={tiles} totals="Bình 180 ml · Tã bẩn 2" />,
    );
    expect(html).toContain(">24 giờ qua</h2>");
    expect(html).toContain("grid-cols-3");
    expect(html).toContain(">13g 5p</span>");
    expect(html).toContain(">Bình thường</span>");
    expect(html).toContain("text-good");
    expect(html).toContain("text-warn");
    expect(html).toContain(">Bình 180 ml · Tã bẩn 2</p>");
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
