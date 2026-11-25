import { renderToStaticMarkup } from "react-dom/server";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import {
  HEALTH_CARDS,
  HEALTH_EMERGENCY,
  HEALTH_GROWTH,
  HEALTH_SICK,
  HEALTH_STATS,
  TOOLS,
} from "@/lib/nav";
import type { Baby, GrowthRow, VaccineDoseRow } from "@/lib/supabase/rows";
import { ICON_PATHS } from "@/lib/ui/icons";
import { HealthScreen } from "./HealthScreen";

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
const [VACCINE, MILESTONES] = HEALTH_CARDS;
const LINE = "line-clamp-2 text-[13px] leading-[18px]";

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
  dob = "2026-09-14",
) {
  state.growth = (query.growth ?? LOADING) as Record<string, unknown>;
  state.doses = (query.doses ?? LOADING) as Record<string, unknown>;
  const baby = {
    id: "b1",
    family_id: "f1",
    name: "Bun",
    dob,
    vaccine_choices: CHOSEN,
  } as unknown as Baby;
  return renderToStaticMarkup(<HealthScreen baby={baby} />);
}

// One link of the page: from its href to the end of the link.
function link(html: string, href: string) {
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

// Spec 2026-11-25 §3.4.
describe("HealthScreen", () => {
  it("has the large title, no back link, and the two sections in order", () => {
    const page = render();
    expect(page).toContain(">Sức khỏe</h1>");
    expect(page).not.toContain(ICON_PATHS.chevronLeft);
    const order = [
      "Theo dõi",
      "Tăng trưởng",
      "Tiêm chủng",
      "Phát triển",
      "Thống kê",
      "Khi bé ốm",
      "Khẩn cấp",
      "Triệu chứng",
      "Bệnh thường gặp",
      "Báo cáo cho bác sĩ",
    ].map((t) => page.indexOf(`>${t}<`));
    expect(order.every((i) => i >= 0)).toBe(true);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
  });

  it("links every item with its icon, and none of the Tiện ích pages", () => {
    const page = render();
    for (const item of [
      HEALTH_GROWTH,
      ...HEALTH_CARDS,
      HEALTH_STATS,
      ...HEALTH_SICK,
    ]) {
      expect(page).toContain(`href="${item.href}"`);
      expect(page).toContain(`d="${ICON_PATHS[item.icon]}"`);
    }
    for (const item of TOOLS) expect(page).not.toContain(`href="${item.href}"`);
  });

  it("keeps the red emergency card", () => {
    const page = render();
    expect(link(page, HEALTH_EMERGENCY.href)).toContain(
      HEALTH_EMERGENCY.detail,
    );
    expect(page).toContain("bg-danger-solid text-on-danger");
    expect(page).toContain(`d="${ICON_PATHS.phone}"`);
  });

  it("reads the growth and the vaccine doses of this baby", () => {
    useGrowth.mockClear();
    useVaccineDoses.mockClear();
    render();
    expect(useGrowth).toHaveBeenCalledExactlyOnceWith("b1");
    expect(useVaccineDoses).toHaveBeenCalledExactlyOnceWith("b1");
  });
});

// Spec 2026-11-25 §4, rows 2 and 3.
describe("HealthScreen: Cần chú ý", () => {
  it.each([
    ["loading", LOADING],
    ["offline", OFFLINE],
    ["after an error", FAILED],
  ])("%s: the section is not drawn, and nothing pulses", (_, q) => {
    const page = render({ growth: q, doses: q });
    expect(page).not.toContain("Cần chú ý");
    expect(page).not.toContain("kb-pulse");
    expect(page).not.toContain('role="alert"');
    expect(page).not.toContain("text-warn");
  });

  it("an overdue dose is the first block of the page, in warn", () => {
    const page = render({ doses: loaded([]) });
    expect(page.indexOf(">Cần chú ý<")).toBeGreaterThan(-1);
    expect(page.indexOf(">Cần chú ý<")).toBeLessThan(
      page.indexOf(">Theo dõi<"),
    );
    const row = link(page, "/tiem-chung");
    expect(row).toContain(">Quá hạn: Lao (BCG)</span>");
    expect(row).toContain(
      '<span class="text-[13px] font-semibold text-warn">Hẹn 14/09</span>',
    );
    expect(row).toContain(`d="${ICON_PATHS.syringe}"`);
  });

  it("a dose due within 14 days is listed with the days left, not in warn", () => {
    const page = render({ doses: loaded([done("bcg")]) }, "2026-09-28");
    const row = link(page, "/tiem-chung");
    expect(row).toContain(">6 trong 1 mũi 1</span>");
    expect(row).toContain(
      '<span class="text-[13px] text-muted">Hẹn 28/11 · còn 8 ngày</span>',
    );
    expect(page).not.toContain("text-warn");
  });

  it("a dose further away gives no section", () => {
    const page = render({
      doses: loaded([done("bcg"), done("hexa"), done("pcv")]),
    });
    expect(page).not.toContain("Cần chú ý");
  });
});

describe("HealthScreen: the Tăng trưởng card", () => {
  it.each([
    ["loading", LOADING],
    ["no measurement", loaded([])],
  ])("%s: the static description and no values", (_, q) => {
    const card = link(render({ growth: q }), HEALTH_GROWTH.href);
    expect(card).toContain(`>${HEALTH_GROWTH.detail}</span>`);
    expect(card).not.toContain("Cân nặng</span>");
    expect(card).not.toContain("Đo gần nhất");
  });

  it("shows the day of the newest measurement and the newest value of each indicator", () => {
    const card = link(
      render({
        growth: loaded([
          measure("2026-11-18", null, 59),
          measure("2026-11-15", 5500),
        ]),
      }),
      HEALTH_GROWTH.href,
    );
    expect(card).toContain(">Đo gần nhất 18/11</span>");
    expect(card).not.toContain(HEALTH_GROWTH.detail);
    for (const [title, value] of [
      ["Cân nặng", "5,5 kg"],
      ["Chiều dài", "59 cm"],
      ["Vòng đầu", "—"],
    ])
      expect(card).toContain(
        `<span class="text-xs text-muted">${title}</span><span class="text-xl leading-[26px] font-bold tabular-nums">${value}</span>`,
      );
  });

  it("has no status chip and no goal line yet", () => {
    const card = link(
      render({ growth: loaded([measure("2026-11-15", 5500)]) }),
      HEALTH_GROWTH.href,
    );
    expect(card).not.toContain("Lớn đều");
    expect(card).not.toContain("Mục tiêu");
  });
});

describe("HealthScreen: the Tiêm chủng and Phát triển cards", () => {
  it("are short cards in a two-column grid", () => {
    const page = render();
    expect(page).toContain("grid grid-cols-2 gap-2.5");
    expect(page.match(/min-h-28/g)).toHaveLength(2);
    expect(page).not.toContain("min-h-32");
  });

  it("Tiêm chủng overdue: Quá hạn and the dose name in warn", () => {
    const card = link(
      render({ doses: loaded([]) }).split(">Theo dõi<")[1],
      VACCINE.href,
    );
    expect(card).toContain(
      `<span class="${LINE} font-semibold text-warn">Quá hạn: Lao (BCG)</span>`,
    );
  });

  it("Tiêm chủng not overdue: the due day first, then the dose name", () => {
    const page = render({
      doses: loaded([done("bcg"), done("hexa"), done("pcv")]),
    });
    expect(link(page, VACCINE.href)).toContain(
      `<span class="${LINE} text-muted">14/06 · Sởi mũi 1</span>`,
    );
  });

  it("Phát triển and Thống kê keep their descriptions", () => {
    const page = render({ doses: loaded([]) });
    expect(link(page, MILESTONES.href)).toContain(
      `>${MILESTONES.detail}</span>`,
    );
    expect(link(page, HEALTH_STATS.href)).toContain(
      `>${HEALTH_STATS.detail}</span>`,
    );
  });
});
