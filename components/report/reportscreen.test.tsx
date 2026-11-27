import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Baby, LogRow } from "@/lib/supabase/rows";
import { ReportScreen } from "./ReportScreen";

const NOW = new Date("2026-11-26T10:00:00+07:00");
const useStatsLogs = vi.hoisted(() => vi.fn());
const useRangeLogs = vi.hoisted(() => vi.fn());
const state = vi.hoisted(() => ({
  stats: {} as Record<string, unknown>,
  range: {} as Record<string, unknown>,
  episodes: {} as Record<string, unknown>,
}));

vi.mock("@/lib/data/logs", () => ({ useStatsLogs, useRangeLogs }));
vi.mock("@/lib/data/illness", () => ({ useEpisodes: () => state.episodes }));
vi.mock("@/lib/data/growth", () => ({
  useGrowth: () => loaded([]),
  useWhoTable: () => loaded(undefined),
}));
vi.mock("@/lib/data/vaccines", () => ({ useVaccineDoses: () => loaded([]) }));
vi.mock("@/lib/hooks/useNow", () => ({ useNow: () => NOW }));

const LOADING = {
  data: undefined,
  isPending: true,
  isError: false,
  error: null,
  fetchStatus: "fetching",
  refetch: () => {},
};
function loaded(data: unknown) {
  return { ...LOADING, data, isPending: false, fetchStatus: "idle" };
}

const iso = (text: string) =>
  new Date(`${text.replace(" ", "T")}:00+07:00`).toISOString();
const baby = {
  id: "b1",
  family_id: "f1",
  name: "Bun",
  dob: "2026-09-10",
  sex: "male",
  vaccine_choices: {},
} as unknown as Baby;
const log = (type: string, time: string, details: unknown) =>
  ({
    id: `${type}-${time}`,
    baby_id: "b1",
    type,
    started_at: iso(time),
    ended_at: iso(time),
    details,
    note: null,
  }) as LogRow;
const SYMPTOMS = [
  log("symptom", "2026-11-25 08:00", { codes: ["cough", "runny_nose"] }),
  log("symptom", "2026-11-21 21:15", { codes: ["fever"], note: "quấy cả tối" }),
];

function render(input: { stats?: unknown[] } = {}) {
  state.stats = loaded(input.stats ?? []);
  return renderToStaticMarkup(<ReportScreen baby={baby} />);
}

beforeEach(() => {
  useStatsLogs.mockReset();
  useStatsLogs.mockImplementation(() => state.stats);
  useRangeLogs.mockReset();
  useRangeLogs.mockImplementation(() => state.range);
  state.range = LOADING;
  state.episodes = loaded([]);
});

// Spec 2026-11-26 §9: "Triệu chứng", for every period.
describe("ReportScreen: symptoms", () => {
  it("a table after the medicines: time, short names, note", () => {
    const html = render({ stats: SYMPTOMS });
    expect(html).toMatch(
      /<h3[^>]*>Triệu chứng<\/h3><table[^>]*><thead><tr><th[^>]*>Giờ<\/th><th[^>]*>Triệu chứng<\/th><th[^>]*>Ghi chú<\/th><\/tr><\/thead>/,
    );
    expect(html).toMatch(
      /<td[^>]*>21\/11 21:15<\/td><td[^>]*>Sốt<\/td><td[^>]*>quấy cả tối<\/td>/,
    );
    expect(html).toMatch(
      /<td[^>]*>25\/11 08:00<\/td><td[^>]*>Sổ mũi, Ho<\/td><td[^>]*><\/td>/,
    );
    const order = [
      ">Thuốc đã dùng</h3>",
      ">Triệu chứng</h3>",
      ">Tăng trưởng (lần đo gần nhất)</h3>",
    ].map((mark) => html.indexOf(mark));
    expect(order).toEqual([...order].sort((a, b) => a - b));
    expect(order[0]).toBeGreaterThan(-1);
  });

  it("a period without a symptom log has no such table", () => {
    const html = render({
      stats: [
        log("temperature", "2026-11-25 08:00", {
          celsius: 38.2,
          method: "nach",
        }),
      ],
    });
    expect(html).toContain(">Nhiệt độ</h3>");
    expect(html).not.toContain(">Triệu chứng</h3>");
  });

  it("a symptom log before the 7 days is not in the table", () => {
    const html = render({
      stats: [log("symptom", "2026-11-19 08:00", { codes: ["cough"] })],
    });
    expect(html).not.toContain(">Triệu chứng</h3>");
  });
});
