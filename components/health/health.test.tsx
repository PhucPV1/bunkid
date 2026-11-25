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
  tables: {} as Record<string, unknown>,
}));
const useGrowth = vi.hoisted(() => vi.fn());
const useWhoTable = vi.hoisted(() => vi.fn());
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
vi.mock("@/lib/data/growth", () => ({ useGrowth, useWhoTable }));
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

// WHO tables whose median never changes, so z = (value / median − 1) × 8:
// 5,5 kg and 58,5 cm sit exactly on the median.
const flat = (median: number) => ({
  data: {
    rows: Array.from({ length: 1857 }, (_, day) => [day, 1, median, 0.125]),
  },
  isPending: false,
  isError: false,
  error: null,
  fetchStatus: "idle",
});
const TABLES = { wfa: flat(5.5), lhfa: flat(58.5), hcfa: flat(38) };

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
  query: { growth?: unknown; doses?: unknown; tables?: boolean } = {},
  dob = "2026-09-14",
  target: number | null = null,
) {
  state.growth = (query.growth ?? LOADING) as Record<string, unknown>;
  state.doses = (query.doses ?? LOADING) as Record<string, unknown>;
  state.tables = query.tables ? TABLES : {};
  const baby = {
    id: "b1",
    family_id: "f1",
    name: "Bun",
    dob,
    vaccine_choices: CHOSEN,
    father_height_cm: null,
    mother_height_cm: null,
    target_height_cm: target,
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
  useWhoTable.mockImplementation(
    (indicator: string) => state.tables[indicator] ?? LOADING,
  );
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

  // Spec 2026-11-25 §3.4 and §6.4: the line at the foot of the card.
  const goalCard = (growth: unknown, target: number | null, tables = true) =>
    link(render({ growth, tables }, "2026-09-14", target), HEALTH_GROWTH.href);

  it("no target: no goal line", () => {
    expect(goalCard(loaded([measure("2026-11-15", 5500)]), null)).not.toContain(
      "Mục tiêu",
    );
  });

  it("a target: a flag, the target and where the baby stands against its line", () => {
    // 180 cm is z +0,47 for a man: the line is at 61,96 cm. 58,5 cm is 3,5 under.
    const card = goalCard(loaded([measure("2026-11-15", 5500)]), 180);
    expect(card).toContain(`d="${ICON_PATHS.flag}"`);
    expect(card).toContain(
      ">Mục tiêu 180 cm: dưới đường mục tiêu 3,5 cm</span>",
    );
    // A long line wraps onto two: the flag stays level with the first.
    expect(card).toContain(
      '<span class="flex items-start gap-2 border-t border-line pt-3 text-[13px] leading-[18px] text-ink">',
    );
    expect(card).toContain("mt-px shrink-0 text-accent");
    // It is the last thing in the card, under the three values.
    expect(card.indexOf("Mục tiêu 180 cm")).toBeGreaterThan(
      card.indexOf(">Vòng đầu</span>"),
    );
  });

  it("a target, on the line: says on track", () => {
    expect(goalCard(loaded([measure("2026-11-15", 5500, 62)]), 180)).toContain(
      ">Mục tiêu 180 cm: đang đúng hướng</span>",
    );
  });

  it("a target, no length measured yet: says so", () => {
    expect(
      goalCard(loaded([measure("2026-11-15", 5500, null)]), 180),
    ).toContain(">Mục tiêu 180 cm: chưa có lần đo chiều dài</span>");
  });

  it("no goal line until the measurements and the tables have loaded, or with no measurement", () => {
    for (const card of [
      goalCard(loaded([measure("2026-11-15", 5500)]), 180, false),
      goalCard(LOADING, 180),
      goalCard(loaded([]), 180),
    ])
      expect(card).not.toContain("Mục tiêu 180");
  });
});

// Spec 2026-11-25 §3.4 and §4 row 1.
describe("HealthScreen: growth alerts", () => {
  const CHIP = "font-semibold whitespace-nowrap";
  // The card sits below "Theo dõi"; an alert row above it links to the same page.
  const growthCard = (page: string) =>
    link(page.slice(page.indexOf(">Theo dõi<")), HEALTH_GROWTH.href);
  const growthRow = (page: string) => {
    const attention = page.slice(
      page.indexOf(">Cần chú ý<"),
      page.indexOf(">Theo dõi<"),
    );
    return attention.includes('href="/tang-truong"')
      ? link(attention, "/tang-truong")
      : null;
  };

  it("reads the three WHO tables of the baby's sex", () => {
    useWhoTable.mockClear();
    render({ growth: loaded([measure("2026-11-15", 5500)]) });
    expect(useWhoTable.mock.calls).toEqual([
      ["wfa", "boys"],
      ["lhfa", "boys"],
      ["hcfa", "boys"],
    ]);
  });

  it("no chip until the measurements and all three tables have loaded", () => {
    for (const page of [
      render({ growth: loaded([measure("2026-11-15", 5500)]) }),
      render({ tables: true }),
      render({ growth: loaded([]), tables: true }),
    ])
      expect(growthCard(page)).not.toContain(CHIP);
  });

  it("on the norm: the chip Lớn đều and no growth row", () => {
    const page = render({
      growth: loaded([measure("2026-11-15", 5500)]),
      doses: loaded([]),
      tables: true,
    });
    expect(growthCard(page)).toContain(
      `${CHIP} bg-good-soft text-good-ink">Lớn đều</span>`,
    );
    expect(growthRow(page)).toBeNull();
  });

  it("a yellow alert: the chip Cần chú ý and a warn row above the vaccine row", () => {
    // 4 kg against a 5,5 kg median is z −2,18.
    const page = render({
      growth: loaded([measure("2026-11-15", 4000)]),
      doses: loaded([]),
      tables: true,
    });
    expect(growthCard(page)).toContain(
      `${CHIP} bg-warn-soft text-warn-ink">Cần chú ý</span>`,
    );
    const row = growthRow(page);
    expect(row).toContain(">Cân nặng thấp hơn chuẩn</span>");
    expect(row).toContain(
      '<span class="text-[13px] font-semibold text-warn">Nên hỏi bác sĩ ở lần khám tới.</span>',
    );
    expect(row).toContain(`d="${ICON_PATHS.ruler}"`);
    expect(page.indexOf(">Cân nặng thấp hơn chuẩn<")).toBeLessThan(
      page.indexOf(">Quá hạn: Lao (BCG)<"),
    );
  });

  it("a red alert: the chip Nên đi khám and a danger row", () => {
    // 3 kg against a 5,5 kg median is z −3,6.
    const page = render({
      growth: loaded([measure("2026-11-15", 3000)]),
      tables: true,
    });
    expect(growthCard(page)).toContain(
      `${CHIP} bg-danger-soft text-danger-ink">Nên đi khám</span>`,
    );
    const row = growthRow(page);
    expect(row).toContain(">Cân nặng thấp hơn chuẩn nhiều</span>");
    expect(row).toContain(
      '<span class="text-[13px] font-semibold text-danger">Nên cho bé đi khám.</span>',
    );
  });

  // Spec 2026-11-25 §5.6: near the edge of the norm is said on the chip, and
  // never in "Cần chú ý".
  it("near the low edge: the chip Gần mức thấp and no growth row", () => {
    // 4,6 kg against a 5,5 kg median is z −1,31.
    const page = render({
      growth: loaded([measure("2026-11-15", 4600)]),
      doses: loaded([]),
      tables: true,
    });
    expect(growthCard(page)).toContain(
      `${CHIP} bg-warn-soft text-warn-ink">Gần mức thấp</span>`,
    );
    expect(growthRow(page)).toBeNull();
  });

  it("near the high edge: the chip Gần mức cao", () => {
    // 6,5 kg is z +1,45.
    const page = render({
      growth: loaded([measure("2026-11-15", 6500)]),
      tables: true,
    });
    expect(growthCard(page)).toContain(
      `${CHIP} bg-warn-soft text-warn-ink">Gần mức cao</span>`,
    );
  });

  it("one indicator near each edge: the chip Gần ranh chuẩn", () => {
    // 50 cm against a 58,5 cm median is z −1,16.
    const page = render({
      growth: loaded([measure("2026-11-15", 6500, 50)]),
      tables: true,
    });
    expect(growthCard(page)).toContain(
      `${CHIP} bg-warn-soft text-warn-ink">Gần ranh chuẩn</span>`,
    );
  });

  it("an alert on another indicator wins over near the edge", () => {
    const page = render({
      growth: loaded([measure("2026-11-15", 4000, 50)]),
      tables: true,
    });
    expect(growthCard(page)).toContain(">Cần chú ý</span>");
    expect(growthCard(page)).not.toContain("Gần");
  });

  it("only the newest measurement of an indicator can be near the edge", () => {
    const page = render({
      growth: loaded([
        measure("2026-11-15", 5500),
        measure("2026-10-14", 4600),
      ]),
      tables: true,
    });
    expect(growthCard(page)).toContain(">Lớn đều</span>");
  });

  // At 375 px "Gần ranh chuẩn" and the arrow together leave the name of the
  // card less room than it needs.
  it("the chip takes the place of the arrow; a card with no chip keeps the arrow", () => {
    const withChip = growthCard(
      render({ growth: loaded([measure("2026-11-15", 5500)]), tables: true }),
    );
    expect(withChip).toContain(">Lớn đều</span>");
    expect(withChip).not.toContain(ICON_PATHS.chevronRight);
    for (const page of [
      render({ growth: loaded([measure("2026-11-15", 5500)]) }),
      render({ growth: loaded([]), tables: true }),
    ])
      expect(growthCard(page)).toContain(`d="${ICON_PATHS.chevronRight}"`);
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
