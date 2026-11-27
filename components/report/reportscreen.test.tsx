import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Baby, EpisodeRow, LogRow } from "@/lib/supabase/rows";
import { ReportPage } from "./ReportPage";
import { ReportScreen } from "./ReportScreen";

const NOW = new Date("2026-11-26T10:00:00+07:00");
const useStatsLogs = vi.hoisted(() => vi.fn());
const useRangeLogs = vi.hoisted(() => vi.fn());
const state = vi.hoisted(() => ({
  stats: {} as Record<string, unknown>,
  range: {} as Record<string, unknown>,
  episodes: {} as Record<string, unknown>,
  search: "",
}));

vi.mock("@/lib/data/logs", () => ({ useStatsLogs, useRangeLogs }));
vi.mock("@/lib/data/illness", () => ({ useEpisodes: () => state.episodes }));
vi.mock("@/lib/data/growth", () => ({
  useGrowth: () => loaded([]),
  useWhoTable: () => loaded(undefined),
}));
vi.mock("@/lib/data/vaccines", () => ({ useVaccineDoses: () => loaded([]) }));
vi.mock("@/lib/hooks/useNow", () => ({ useNow: () => NOW }));
vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(state.search),
}));
// The gate is stood in for: it hands the page a signed-in member with a baby.
vi.mock("@/components/AuthGate", () => ({
  GateLoading: () => <div data-gate-loading />,
  AuthGate: ({
    need,
    children,
  }: {
    need: string;
    children: (gate: unknown) => unknown;
  }) => <div data-need={need}>{children({ ctx: { baby } }) as never}</div>,
}));

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
const OFFLINE = { ...LOADING, fetchStatus: "paused" };
const FAILED = {
  ...LOADING,
  isPending: false,
  isError: true,
  error: new Error("boom"),
  fetchStatus: "idle",
};

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

const episode = (
  id: string,
  start: string,
  end: string | null,
): EpisodeRow => ({
  id,
  baby_id: "b1",
  started_at: iso(start),
  ended_at: end === null ? null : iso(end),
  created_by: "u1",
  created_at: iso(start),
  updated_at: iso(start),
});
const OPEN = episode("open", "2026-11-24 23:30", null);
const PAST = episode("past", "2026-10-10 08:00", "2026-10-12 09:00");

function render(
  input: {
    stats?: unknown[];
    range?: Record<string, unknown>;
    episodes?: Record<string, unknown>;
    dot?: string | null;
  } = {},
) {
  state.stats = loaded(input.stats ?? []);
  if (input.range) state.range = input.range;
  if (input.episodes) state.episodes = input.episodes;
  return renderToStaticMarkup(
    <ReportScreen baby={baby} dot={input.dot ?? null} />,
  );
}
const pressed = (html: string) =>
  [...html.matchAll(/aria-pressed="true"[^>]*>([^<]*)<\/button>/g)].map(
    (match) => match[1],
  );
const choices = (html: string) =>
  [
    ...html.matchAll(/aria-pressed="(?:true|false)"[^>]*>([^<]*)<\/button>/g),
  ].map((match) => match[1]);

beforeEach(() => {
  useStatsLogs.mockReset();
  useStatsLogs.mockImplementation(() => state.stats);
  useRangeLogs.mockReset();
  useRangeLogs.mockImplementation(() => state.range);
  state.range = LOADING;
  state.episodes = loaded([]);
  state.search = "";
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

// Spec 2026-11-26 §9: the period "Đợt ốm".
describe("ReportScreen: the episode period", () => {
  const EPISODE_LOGS = [
    // On the first day, before the episode began: a feed counts for the day,
    // the reading does not belong to the episode.
    log("breast", "2026-11-24 20:00", { side: "left" }),
    log("temperature", "2026-11-24 20:00", { celsius: 37.9, method: "nach" }),
    log("symptom", "2026-11-24 20:05", { codes: ["vomit"] }),
    log("temperature", "2026-11-24 23:40", { celsius: 38.4, method: "nach" }),
    log("temperature", "2026-11-25 15:00", { celsius: 39.2, method: "nach" }),
    log("medicine", "2026-11-25 15:10", {
      name: "Hapacol",
      amount: 2.5,
      unit: "ml",
      antipyretic: true,
    }),
    log("symptom", "2026-11-25 08:00", { codes: ["cough"] }),
  ];

  it("7 and 14 days only, while the baby has no episode or they load", () => {
    expect(choices(render())).toEqual(["7 ngày", "14 ngày"]);
    expect(choices(render({ episodes: LOADING }))).toEqual([
      "7 ngày",
      "14 ngày",
    ]);
  });

  it("a third choice Đợt ốm once the baby has one; 7 days stay the default", () => {
    const html = render({ episodes: loaded([OPEN, PAST]) });
    expect(choices(html)).toEqual(["7 ngày", "14 ngày", "Đợt ốm"]);
    expect(pressed(html)).toEqual(["7 ngày"]);
    expect(html).toContain("7 ngày, từ 20/11 đến 26/11 · in ngày 26/11/2026");
    // The 7 days read their logs as before; the episode's are not asked for.
    expect(useStatsLogs).toHaveBeenLastCalledWith(
      "b1",
      iso("2026-11-19 00:00"),
      true,
    );
    expect(useRangeLogs).toHaveBeenLastCalledWith("b1", "", null, false);
  });

  it("/bao-cao?dot={id}: that episode, its days, its line", () => {
    const html = render({
      episodes: loaded([OPEN, PAST]),
      range: loaded([]),
      dot: "past",
    });
    expect(pressed(html)).toEqual(["Đợt ốm"]);
    expect(html).toContain(
      ">Đợt ốm 10/10 – 12/10 · 3 ngày · in ngày 26/11/2026</p>",
    );
    expect(useRangeLogs).toHaveBeenLastCalledWith(
      "b1",
      iso("2026-10-09 00:00"),
      iso("2026-10-13 00:00"),
      true,
    );
    expect(useStatsLogs.mock.lastCall?.[2]).toBe(false);
    const days = [
      ...html.matchAll(
        /<tr class="break-inside-avoid"><td[^>]*>(\d\d\/\d\d)<\/td>/g,
      ),
    ].map((match) => match[1]);
    expect(days).toEqual(["10/10", "11/10", "12/10"]);
    expect(html).not.toContain("14 ngày cuối của đợt ốm");
  });

  it("an open episode: whole days in the daily table, only the episode's logs in the others", () => {
    const html = render({
      episodes: loaded([OPEN, PAST]),
      range: loaded(EPISODE_LOGS),
      dot: "open",
    });
    expect(html).toContain(
      ">Đợt ốm từ 24/11 · ngày thứ 3 · in ngày 26/11/2026</p>",
    );
    expect(useRangeLogs).toHaveBeenLastCalledWith(
      "b1",
      iso("2026-11-23 00:00"),
      null,
      true,
    );
    // The feed before the start still counts for 24/11.
    expect(html).toMatch(
      /<td[^>]*>24\/11<\/td><td[^>]*>0<\/td><td[^>]*>1<\/td>/,
    );
    expect(html).not.toContain("37,9°C");
    expect(html).toContain("24/11 23:40: 38,4°C (nách)");
    expect(html).toContain("25/11 15:10: Hapacol (hạ sốt) — 2,5 ml");
    expect(html).toContain(">Ho</td>");
    expect(html).not.toContain(">Nôn</td>");
  });

  it("the fever chart stands before the readings and is printed", () => {
    const html = render({
      episodes: loaded([OPEN]),
      range: loaded(EPISODE_LOGS),
      dot: "open",
    });
    const chart = html.indexOf(
      'aria-label="Biểu đồ nhiệt độ: 2 lần đo, cao nhất 39,2°C, 1 liều hạ sốt."',
    );
    expect(chart).toBeGreaterThan(html.indexOf(">Nhiệt độ</h3>"));
    expect(chart).toBeLessThan(html.indexOf("24/11 23:40: 38,4°C"));
    expect(html).toContain("Từ 38°C là sốt");
    expect(html).toContain("[print-color-adjust:exact]");
    expect(html.slice(html.indexOf(">Nhiệt độ</h3>") - 400)).not.toMatch(
      /print:hidden[^>]*>[^<]*<svg/,
    );
  });

  it("no chart for 7 or 14 days, nor without a reading in the 7 days it draws", () => {
    const temperature = log("temperature", "2026-11-25 15:00", {
      celsius: 39.2,
      method: "nach",
    });
    expect(render({ stats: [temperature] })).not.toContain("Biểu đồ nhiệt độ");
    expect(
      render({ episodes: loaded([PAST]), range: loaded([]), dot: "past" }),
    ).not.toContain("Biểu đồ nhiệt độ");
    // A long episode whose readings all come before its last 7 days: the
    // readings are listed, and no empty chart frame is printed.
    const long = episode("long", "2026-10-01 08:00", "2026-10-20 09:00");
    const early = log("temperature", "2026-10-08 09:00", {
      celsius: 38.6,
      method: "nach",
    });
    const html = render({
      episodes: loaded([long]),
      range: loaded([early]),
      dot: "long",
    });
    expect(html).toContain("08/10 09:00: 38,6°C (nách)");
    expect(html).not.toContain("Biểu đồ nhiệt độ");
  });

  it("longer than 14 days: the last 14, and it says so", () => {
    const long = episode("long", "2026-10-01 08:00", "2026-10-20 09:00");
    const html = render({
      episodes: loaded([long]),
      range: loaded([]),
      dot: "long",
    });
    expect(html).toContain(
      ">Đợt ốm 01/10 – 20/10 · 20 ngày · in ngày 26/11/2026</p>",
    );
    expect(html).toContain(">14 ngày cuối của đợt ốm</p>");
  });

  it("an id the baby's episodes do not hold: the 7 days", () => {
    const html = render({ episodes: loaded([OPEN]), dot: "gone" });
    expect(pressed(html)).toEqual(["7 ngày"]);
    expect(html).toContain("7 ngày, từ 20/11 đến 26/11");
  });

  it("while the episodes load, the address waits: placeholders, not the 7 days", () => {
    const html = render({ episodes: LOADING, dot: "past" });
    expect(html).toContain("kb-pulse");
    expect(html).not.toContain("7 ngày, từ");
    expect(pressed(html)).toEqual([]);
    expect(useStatsLogs.mock.lastCall?.[2]).toBe(false);
    expect(render({ episodes: OFFLINE, dot: "past" })).toContain(
      "Cần mạng để tải báo cáo. Trang sẽ tự tải khi có mạng lại.",
    );
    const failed = render({ episodes: FAILED, dot: "past" });
    expect(failed).toContain("Đợt ốm: Có lỗi xảy ra: boom");
    expect(failed).toContain(">Thử lại</button>");
  });
});

// Spec §9: /bao-cao?dot={id}.
describe("ReportPage", () => {
  it("hands the dot of the address to the report behind the gate", () => {
    state.stats = loaded([]);
    state.range = loaded([]);
    state.episodes = loaded([OPEN, PAST]);
    state.search = "dot=past";
    const html = renderToStaticMarkup(<ReportPage />);
    expect(html).toContain('data-need="baby"');
    expect(html).toContain("Đợt ốm 10/10 – 12/10 · 3 ngày");
    state.search = "";
    expect(renderToStaticMarkup(<ReportPage />)).toContain(
      "7 ngày, từ 20/11 đến 26/11",
    );
  });
});
