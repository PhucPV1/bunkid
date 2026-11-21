import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { STATS_TABS } from "@/lib/rules/dailyStats";
import type { Baby } from "@/lib/supabase/rows";
import { SERIES, StatsScreen } from "./StatsScreen";

// 01:00 on 14/11 in Việt Nam, still 13/11 in UTC.
const NOW = vi.hoisted(() => new Date("2026-11-13T18:00:00Z"));
const state = vi.hoisted(() => ({
  logs: {} as Record<string, unknown>,
  // The props StatsScreen gave the chart; null when it drew no chart.
  chart: null as Record<string, unknown> | null,
}));

vi.mock("@/lib/hooks/useNow", () => ({ useNow: () => NOW }));
vi.mock("@/lib/data/logs", () => ({ useStatsLogs: () => state.logs }));
vi.mock("@/lib/data/realtime", () => ({ useLogsRealtime: () => {} }));
// The real chart only loads in the browser; this stands in for it.
vi.mock("next/dynamic", () => ({
  default: () => (props: Record<string, unknown>) => {
    state.chart = props;
    return <p>chart</p>;
  },
}));

const baby = (dob: string) =>
  ({
    id: "b1",
    family_id: "f1",
    name: "Bun",
    dob,
    feed_interval_min: 180,
  }) as Baby;
// 21:00 on 12/11 to 05:00 on 13/11 in Việt Nam.
const SLEEP = {
  id: "s1",
  baby_id: "b1",
  type: "sleep",
  started_at: "2026-11-12T14:00:00.000Z",
  ended_at: "2026-11-12T22:00:00.000Z",
  details: {},
};

function render(dob: string, data: unknown[]) {
  state.logs = {
    data,
    isPending: false,
    isError: false,
    error: null,
    fetchStatus: "idle",
    refetch: () => {},
  };
  return renderToStaticMarkup(<StatsScreen baby={baby(dob)} />);
}

const NOTE = "Tính theo ngày lịch giờ Việt Nam. Hôm nay tính đến hiện tại.";
const note = (html: string) =>
  html.match(/<p class="px-1 text-\[13px\] text-muted">([^<]*)<\/p>/)?.[1];

beforeEach(() => {
  state.chart = null;
});

// Spec 2026-11-19 §8.
describe("StatsScreen", () => {
  it("gives the chart the tab's unit and the norm for the baby's age at now", () => {
    // 90 days old on 14/11, the last day of the 14–17 hour band.
    render("2026-08-16", [SLEEP]);
    expect(state.chart).toMatchObject({
      unit: "giờ",
      norm: { min: 14, max: 17 },
      primaryName: "Giờ ngủ",
      color: "var(--color-cat-sleep)",
    });
    expect(state.chart?.rows).toHaveLength(7);
    expect((state.chart?.rows as { label: string }[]).at(-1)?.label).toBe("14");
    // 91 days old: the next band.
    render("2026-08-15", [SLEEP]);
    expect(state.chart).toMatchObject({
      unit: "giờ",
      norm: { min: 12, max: 15 },
    });
  });

  it("explains the band and the pale bar under the table, only when the chart is drawn", () => {
    expect(note(render("2026-08-16", [SLEEP]))).toBe(
      `${NOTE} Vùng tô nhạt: chuẩn 14–17 giờ mỗi ngày. Cột nhạt là hôm nay, chưa hết ngày.`,
    );
    expect(note(render("2026-08-15", [SLEEP]))).toBe(
      `${NOTE} Vùng tô nhạt: chuẩn 12–15 giờ mỗi ngày. Cột nhạt là hôm nay, chưa hết ngày.`,
    );
    state.chart = null;
    const empty = render("2026-08-16", []);
    expect(state.chart).toBeNull();
    expect(empty).toContain("Chưa có giấc ngủ nào trong 7 ngày");
    expect(note(empty)).toBe(NOTE);
  });

  it("has the spec's unit for every tab", () => {
    expect(
      Object.fromEntries(
        STATS_TABS.map(({ value }) => [value, SERIES[value].unit]),
      ),
    ).toEqual({
      sleep: "giờ",
      feed: "cữ",
      diaper: "tã",
      pump: "ml",
      tummy: "phút",
      solids: "bữa",
    });
  });
});
