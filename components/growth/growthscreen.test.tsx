import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Baby, GrowthRow } from "@/lib/supabase/rows";
import { ICON_PATHS } from "@/lib/ui/icons";
import { GrowthScreen } from "./GrowthScreen";

const state = vi.hoisted(() => ({
  growth: {} as Record<string, unknown>,
  tables: {} as Record<string, unknown>,
}));
const useGrowth = vi.hoisted(() => vi.fn());
const useWhoTable = vi.hoisted(() => vi.fn());

vi.mock("@/lib/data/growth", () => ({
  useGrowth,
  useWhoTable,
  useGrowthActions: vi.fn(),
}));
vi.mock("@/lib/hooks/useOutboxEntries", () => ({ useOutboxEntries: () => [] }));
// The chart is loaded lazily; a stand-in shows which indicator it was given.
vi.mock("next/dynamic", () => ({
  default:
    () =>
    ({
      unit,
      points,
      last,
      band,
    }: {
      unit: string;
      points: unknown[];
      last: { label: string; tone: string } | null;
      band: Record<string, number>[];
    }) => (
      <div
        data-chart={`${unit}:${points.length}`}
        data-last={last ? `${last.label}|${last.tone}` : ""}
        data-band={Object.keys(band[0] ?? {}).join(",")}
      />
    ),
}));

const LOADING = {
  data: undefined,
  isPending: true,
  isError: false,
  error: null,
  fetchStatus: "fetching",
};
const loaded = (data: unknown) => ({
  data,
  isPending: false,
  isError: false,
  error: null,
  fetchStatus: "idle",
});
// z = (value / median − 1) × 8 on every day.
const flat = (median: number) =>
  loaded({
    rows: Array.from({ length: 1857 }, (_, day) => [day, 1, median, 0.125]),
  });
const TABLES = { wfa: flat(5.5), lhfa: flat(58.5), hcfa: flat(38) };

const measure = (
  measured_on: string,
  weight_g: number | null,
  length_cm: number | null = 58.5,
) =>
  ({
    id: `g-${measured_on}`,
    baby_id: "b1",
    measured_on,
    weight_g,
    length_cm,
    head_cm: null,
    created_by: "u1",
    created_at: `${measured_on}T03:00:00.000Z`,
    updated_at: `${measured_on}T03:00:00.000Z`,
  }) as GrowthRow;

const baby = {
  id: "b1",
  family_id: "f1",
  name: "Bun",
  dob: "2026-09-14",
  sex: "male",
} as unknown as Baby;

function render(
  rows: GrowthRow[] | null,
  tables: Record<string, unknown> = TABLES,
) {
  state.growth = rows === null ? LOADING : loaded(rows);
  state.tables = tables;
  return renderToStaticMarkup(<GrowthScreen baby={baby} userId="u1" isOwner />);
}

const pressed = (html: string) =>
  [...html.matchAll(/aria-pressed="(true|false)"[^>]*>([^<]+)/g)]
    .filter((m) => m[1] === "true")
    .map((m) => m[2]);

beforeEach(() => {
  useGrowth.mockImplementation(() => state.growth);
  useWhoTable.mockImplementation(
    (indicator: string) => state.tables[indicator] ?? LOADING,
  );
});

// Spec 2026-11-25 §5.3.
describe("GrowthScreen", () => {
  it("goes back to Sức khỏe and keeps the add button", () => {
    const html = render([measure("2026-11-15", 5500)]);
    expect(html).toContain('href="/suc-khoe"');
    expect(html).toContain('aria-label="Thêm lần đo"');
  });

  it("reads the three WHO tables of the baby's sex", () => {
    useWhoTable.mockClear();
    render([measure("2026-11-15", 5500)]);
    expect(useWhoTable.mock.calls).toEqual([
      ["wfa", "boys"],
      ["lhfa", "boys"],
      ["hcfa", "boys"],
    ]);
  });

  it("on the norm: the calm verdict, no alert card, the picker on weight", () => {
    const html = render([
      measure("2026-11-15", 5500),
      measure("2026-10-14", 4400, 55),
    ]);
    expect(html).toContain(">Bun đang lớn đều</h2>");
    expect(html).toContain(">Đo gần nhất 15/11 · 2 tháng 1 ngày</span>");
    expect(html).toContain("+1,1 kg sau 32 ngày");
    expect(html).not.toContain(ICON_PATHS.alert);
    expect(html).not.toContain('aria-label="có cảnh báo"');
    expect(pressed(html)).toEqual(["Cân nặng"]);
    expect(html).toContain('data-chart="kg:2"');
  });

  it("blocks come in order: alert cards, verdict, picker, chart, list", () => {
    // 51 cm against a 58,5 cm median is z −1,03 lower than a month before: no
    // alert; 4 kg is z −2,18: low.
    const html = render([measure("2026-11-15", 4000)]);
    const order = [
      ">Cân nặng thấp hơn chuẩn</h2>",
      ">Đo gần nhất 15/11",
      'aria-label="Chỉ số"',
      "data-chart=",
      ">Các lần đo</h2>",
    ].map((mark) => html.indexOf(mark));
    expect(order.every((i) => i >= 0)).toBe(true);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
  });

  it("with an alert: its card, no calm heading, a dot on its indicator", () => {
    const html = render([measure("2026-11-15", 4000)]);
    expect(html).toContain("border-warn/35 bg-warn-soft text-warn-ink");
    expect(html).toContain(">Nên hỏi bác sĩ ở lần khám tới.</p>");
    expect(html).not.toContain("đang lớn đều");
    expect(html).toContain('Cân nặng<span role="img" aria-label="có cảnh báo"');
    expect(html.match(/aria-label="có cảnh báo"/g)).toHaveLength(1);
    expect(html).toContain('bg-warn-soft text-warn-ink">Thấp</span>');
  });

  it("opens on the first indicator that has an alert", () => {
    // 48 cm against 58,5 cm is z −1,44; 44 cm is z −1,98; 43 cm is z −2,12.
    const html = render([measure("2026-11-15", 5500, 43)]);
    expect(pressed(html)).toEqual(["Chiều dài"]);
    expect(html).toContain('data-chart="cm:1"');
  });

  it("one card per alert, the red one first", () => {
    const html = render([measure("2026-11-15", 4000, 30)]);
    expect(html.indexOf(">Chiều dài thấp hơn chuẩn nhiều</h2>")).toBeLessThan(
      html.indexOf(">Cân nặng thấp hơn chuẩn</h2>"),
    );
    expect(html.match(/Vì sao có cảnh báo này\?/g)).toHaveLength(2);
  });

  it("a table still loading: that indicator has no block and raises no alert", () => {
    const html = render([measure("2026-11-15", 4000, 30)], {
      lhfa: TABLES.lhfa,
    });
    expect(html).toContain(">Chiều dài thấp hơn chuẩn nhiều</h2>");
    expect(html).not.toContain(">Cân nặng thấp hơn chuẩn</h2>");
    // The weight block of the verdict card is not there yet.
    expect(html).not.toContain('aria-label="Thấp. Nặng hơn');
    expect(html.match(/role="img" aria-label="[^"]*trong 100/g)).toHaveLength(
      1,
    );
  });

  it("no table yet: no verdict card and no alert", () => {
    const html = render([measure("2026-11-15", 4000)], {});
    expect(html).not.toContain("Đo gần nhất");
    expect(html).not.toContain(ICON_PATHS.alert);
  });

  it("no measurement: only the header and the empty state", () => {
    const html = render([]);
    expect(html).toContain("Chưa có lần đo nào.");
    expect(html).not.toContain("Đo gần nhất");
    expect(html).not.toContain(ICON_PATHS.alert);
    expect(html).not.toContain('aria-label="Chỉ số"');
    expect(html).not.toContain("data-chart");
  });

  it("while the measurements load the picker and the chart stay", () => {
    const html = render(null);
    expect(html).toContain('aria-label="Chỉ số"');
    expect(html).toContain("data-chart");
    expect(html).not.toContain("Chưa có lần đo nào.");
  });

  it("the chart card: a title, the band of the chosen indicator, the newest point", () => {
    const html = render([
      measure("2026-11-15", 5500),
      measure("2026-10-14", 4400, 55),
    ]);
    expect(html).toContain(">Cân nặng theo tháng tuổi</h2>");
    expect(html).toContain('data-band="day,low,mid,high"');
    expect(html).toContain('data-last="5,5 kg|accent"');
    expect(html).toContain("95 trong 100 bé khỏe mạnh nằm trong vùng xanh.");
    expect(html).not.toContain("Đường WHO P3");
    expect(html).not.toContain("Lần đo có cảnh báo");
  });

  it("the chart of an indicator with an alert marks its newest point", () => {
    const html = render([measure("2026-11-15", 4000)]);
    expect(html).toContain('data-last="4 kg · Thấp|warn"');
    expect(html).toContain("Lần đo có cảnh báo");
  });

  it("the list: one row per measurement with the change and a chip, no z-score note", () => {
    const html = render([
      measure("2026-11-15", 5500),
      measure("2026-10-14", 4400, 55),
    ]);
    const list = html.slice(html.indexOf(">Các lần đo</h2>"));
    expect(list).toContain("15/11 · 2 tháng 1 ngày");
    expect(list).toContain(">5,5 kg · 58,5 cm</span>");
    expect(list).toContain(">+1,1 kg · +3,5 cm so với lần trước</span>");
    expect(list.match(/>Bình thường<\/span>/g)).toHaveLength(1);
    // Spec §5.6: 4,4 kg against a 5,5 kg median is z −1,6, near the low edge.
    expect(list).toContain('bg-warn-soft text-warn-ink">Gần mức thấp</span>');
    expect(html).not.toContain("z-score");
  });

  it("the list chips the row an alert is about", () => {
    const html = render([
      measure("2026-11-15", 4000),
      // Lighter a month before, so the newest row is low, not a weight loss.
      measure("2026-10-14", 3900, 55),
    ]);
    const list = html.slice(html.indexOf(">Các lần đo</h2>"));
    expect(list).toContain('bg-warn-soft text-warn-ink">Thấp</span>');
  });

  it("the why popup is closed until asked for", () => {
    expect(render([measure("2026-11-15", 4000)])).not.toContain("<dialog");
  });
});
