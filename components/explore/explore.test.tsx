import { renderToStaticMarkup } from "react-dom/server";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import {
  EXPLORE_EMERGENCY,
  EXPLORE_GUIDES,
  EXPLORE_REPORT,
  EXPLORE_SOOTHE,
  EXPLORE_TRACK,
} from "@/lib/nav";
import type { Baby, GrowthRow, VaccineDoseRow } from "@/lib/supabase/rows";
import { ICON_PATHS } from "@/lib/ui/icons";
import { ExploreScreen } from "./ExploreScreen";

const state = vi.hoisted(() => ({
  growth: {} as Record<string, unknown>,
  doses: {} as Record<string, unknown>,
}));
const useGrowth = vi.hoisted(() => vi.fn());
const useVaccineDoses = vi.hoisted(() => vi.fn());
// Four doses: one at birth, two at two months (one of them in a group), one late.
const content = vi.hoisted(() => {
  const base = {
    protects: ["X"],
    source: "https://example.org",
    reviewedAt: "2026-11-14",
  };
  return {
    title: "Lịch tiêm",
    disclaimer: "Lịch tham khảo.",
    reviewedAt: "2026-11-14",
    groups: [
      {
        code: "dtp_combo",
        name: "Bạch hầu, ho gà, uốn ván",
        series: [
          { code: "6in1", name: "6 trong 1", program: "dich_vu" },
          { code: "tcmr_5in1", name: "5 trong 1", program: "tcmr" },
        ],
      },
    ],
    doses: [
      {
        ...base,
        code: "bcg",
        doseNo: 1,
        name: "Lao (BCG)",
        program: "tcmr",
        recommendedAgeDays: 0,
        minAgeDays: 0,
      },
      {
        ...base,
        code: "hexa",
        doseNo: 1,
        name: "6 trong 1 mũi 1",
        program: "dich_vu",
        group: "dtp_combo",
        series: "6in1",
        recommendedAgeDays: 60,
        minAgeDays: 42,
      },
      {
        ...base,
        code: "pcv",
        doseNo: 1,
        name: "Phế cầu mũi 1",
        program: "dich_vu",
        recommendedAgeDays: 60,
        minAgeDays: 42,
      },
      {
        ...base,
        code: "mmr",
        doseNo: 1,
        name: "Sởi mũi 1",
        program: "tcmr",
        recommendedAgeDays: 270,
        minAgeDays: 270,
      },
    ],
  };
});

vi.mock("@/lib/content/vaccines", () => ({ VACCINES: content }));
vi.mock("@/lib/data/growth", () => ({ useGrowth }));
vi.mock("@/lib/data/vaccines", () => ({ useVaccineDoses }));

const LOADING = {
  data: undefined,
  isPending: true,
  isError: false,
  error: null,
  fetchStatus: "fetching",
};
const OFFLINE = { ...LOADING, fetchStatus: "paused" };
const FAILED = {
  ...LOADING,
  isPending: false,
  isError: true,
  error: new Error("boom"),
  fetchStatus: "idle",
};
const loaded = (data: unknown[]) => ({
  data,
  isPending: false,
  isError: false,
  error: null,
  fetchStatus: "idle",
});

const CHOSEN = { dtp_combo: "6in1" };
const [STATS, GROWTH, VACCINE, MILESTONES] = EXPLORE_TRACK;
const STATIC_LINE = "text-[13px] leading-[18px] text-muted";
const LIVE_LINE = "line-clamp-2 text-[13px] leading-[18px] text-muted";
const WARN_LINE =
  "line-clamp-2 text-[13px] leading-[18px] font-semibold text-warn";

const measure = (measured_on: string, weight_g: number | null) =>
  ({
    id: `g-${measured_on}`,
    baby_id: "b1",
    measured_on,
    weight_g,
    length_cm: 58.5,
    head_cm: null,
  }) as GrowthRow;

const done = (code: string) =>
  ({
    id: `row-${code}`,
    baby_id: "b1",
    vaccine_code: code,
    dose_no: 1,
    status: "done",
    given_on: "2026-11-15",
    due_on_override: null,
  }) as VaccineDoseRow;

function render(
  query: { growth?: unknown; doses?: unknown } = {},
  choices: Record<string, string> = CHOSEN,
) {
  state.growth = (query.growth ?? LOADING) as Record<string, unknown>;
  state.doses = (query.doses ?? LOADING) as Record<string, unknown>;
  const baby = {
    id: "b1",
    family_id: "f1",
    name: "Bun",
    dob: "2026-09-14",
    vaccine_choices: choices,
  } as Baby;
  return renderToStaticMarkup(<ExploreScreen baby={baby} />);
}

// One Theo dõi card: from its link to the end of the link.
function card(html: string, href: string) {
  const from = html.indexOf(`href="${href}"`);
  expect(from, href).toBeGreaterThan(-1);
  return html.slice(from, html.indexOf("</a>", from));
}

beforeAll(() => {
  useGrowth.mockImplementation(() => state.growth);
  useVaccineDoses.mockImplementation(() => state.doses);
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-11-20T05:00:00Z")); // 12:00 giờ VN
});
afterAll(() => vi.useRealTimers());

describe("ExploreScreen", () => {
  const html = () => render();

  it("has a large title and the four section headings in spec order", () => {
    const page = html();
    expect(page).toContain(">Khám phá</h1>");
    const order = [
      "Khẩn cấp",
      "Theo dõi",
      "Cẩm nang",
      "Dỗ bé và kỷ niệm",
      "Báo cáo cho bác sĩ",
    ].map((t) => page.indexOf(t));
    expect(order.every((i) => i >= 0)).toBe(true);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
  });

  it("starts with the red emergency card", () => {
    const page = html();
    expect(page).toContain(`href="${EXPLORE_EMERGENCY.href}"`);
    expect(page).toContain(EXPLORE_EMERGENCY.detail);
    expect(page).toContain("bg-danger-solid text-on-danger");
    expect(page).toContain(`d="${ICON_PATHS.phone}"`);
  });

  it("links every item with its icon", () => {
    const page = html();
    for (const item of [
      ...EXPLORE_TRACK,
      ...EXPLORE_GUIDES,
      ...EXPLORE_SOOTHE,
      EXPLORE_REPORT,
    ]) {
      expect(page).toContain(`href="${item.href}"`);
      expect(page).toContain(`d="${ICON_PATHS[item.icon]}"`);
      expect(page).toContain(`>${item.label}<`);
    }
  });

  it("track cards are a two-column grid of glass cards with tinted icons", () => {
    const page = html();
    expect(page).toContain("grid grid-cols-2");
    expect(page).toContain("bg-cat-sleep/15 text-cat-sleep");
    expect(page).toContain("min-h-32");
  });
});

// Spec 2026-11-19 §9.
describe("ExploreScreen: live Tăng trưởng and Tiêm chủng cards", () => {
  it("reads the growth and the vaccine doses of this baby", () => {
    useGrowth.mockClear();
    useVaccineDoses.mockClear();
    render();
    expect(useGrowth).toHaveBeenCalledExactlyOnceWith("b1");
    expect(useVaccineDoses).toHaveBeenCalledExactlyOnceWith("b1");
  });

  it.each([
    ["loading", LOADING],
    ["offline", OFFLINE],
    ["after an error", FAILED],
  ])("%s: the static descriptions, no skeleton and no error card", (_, q) => {
    const page = render({ growth: q, doses: q });
    for (const item of EXPLORE_TRACK)
      expect(card(page, item.href)).toContain(`>${item.detail}</span>`);
    expect(page).not.toContain("kb-pulse");
    expect(page).not.toContain('role="alert"');
    expect(page).not.toContain('role="status"');
    expect(page).not.toContain("text-warn");
  });

  it("Tăng trưởng: the latest weight and its day, at most two lines", () => {
    const page = render({
      growth: loaded([
        measure("2026-11-18", null),
        measure("2026-11-15", 5500),
        measure("2026-10-14", 4300),
      ]),
    });
    expect(card(page, GROWTH.href)).toContain(
      `<span class="${LIVE_LINE}">Cân nặng 5.500 g · 15/11</span>`,
    );
    expect(card(page, GROWTH.href)).not.toContain(GROWTH.detail);
    expect(card(page, VACCINE.href)).toContain(`>${VACCINE.detail}</span>`);
  });

  it("Tăng trưởng: no weight yet keeps the static description", () => {
    for (const rows of [[], [measure("2026-11-18", null)]])
      expect(card(render({ growth: loaded(rows) }), GROWTH.href)).toContain(
        `<span class="${LIVE_LINE}">${GROWTH.detail}</span>`,
      );
  });

  it("Tiêm chủng overdue: Quá hạn and the dose name in warn, semibold", () => {
    const page = render({ doses: loaded([]) });
    expect(card(page, VACCINE.href)).toContain(
      `<span class="${WARN_LINE}">Quá hạn: Lao (BCG)</span>`,
    );
    expect(page.match(/text-warn/g)).toHaveLength(1);
    expect(card(page, GROWTH.href)).toContain(`>${GROWTH.detail}</span>`);
  });

  it("Tiêm chủng not overdue: the due day first, then the dose name", () => {
    const page = render({
      doses: loaded([done("bcg"), done("hexa"), done("pcv")]),
    });
    expect(card(page, VACCINE.href)).toContain(
      `<span class="${LIVE_LINE}">14/06 · Sởi mũi 1</span>`,
    );
    expect(page).not.toContain("text-warn");
  });

  it("Tiêm chủng: passes over the doses of a group with no series chosen", () => {
    const page = render({ doses: loaded([done("bcg")]) }, {});
    expect(card(page, VACCINE.href)).toContain(">Quá hạn: Phế cầu mũi 1<");
  });

  it("Tiêm chủng: nothing left to do keeps the static description", () => {
    const page = render({
      doses: loaded(["bcg", "hexa", "pcv", "mmr"].map(done)),
    });
    expect(card(page, VACCINE.href)).toContain(
      `<span class="${LIVE_LINE}">${VACCINE.detail}</span>`,
    );
  });

  it("Thống kê and Phát triển stay as they were", () => {
    const page = render({
      growth: loaded([measure("2026-11-15", 5500)]),
      doses: loaded([]),
    });
    for (const item of [STATS, MILESTONES])
      expect(card(page, item.href)).toContain(
        `<span class="${STATIC_LINE}">${item.detail}</span>`,
      );
    expect(page.match(/line-clamp-2/g)).toHaveLength(2);
  });
});
