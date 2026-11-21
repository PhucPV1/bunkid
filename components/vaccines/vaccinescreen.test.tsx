import { renderToStaticMarkup } from "react-dom/server";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import type { Baby, VaccineDoseRow } from "@/lib/supabase/rows";
import type { DoseGrid } from "./DoseGrid";
import { VaccineScreen } from "./VaccineScreen";

type GridProps = Parameters<typeof DoseGrid>[0];

const state = vi.hoisted(() => ({
  doses: {} as Record<string, unknown>,
  grid: null as GridProps | null,
}));
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
vi.mock("@/lib/data/vaccines", () => {
  const idle = {
    isPending: false,
    isError: false,
    error: null,
    mutate: () => {},
  };
  return {
    useVaccineDoses: () => state.doses,
    useUpdateChoices: () => idle,
    useVaccineSetup: () => idle,
    useDoseActions: () => ({ save: idle, clear: idle }),
  };
});
vi.mock("@/lib/hooks/useOutboxEntries", () => ({ useOutboxEntries: () => [] }));
// The real table, with its props kept for the tests below.
vi.mock("./DoseGrid", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./DoseGrid")>();
  return {
    DoseGrid: (props: GridProps) => {
      state.grid = props;
      return actual.DoseGrid(props);
    },
  };
});

const CHOSEN = { dtp_combo: "6in1" };
const CARD = /<button type="button" class="glass [^"]*rounded-\[28px\]/;

const done = (code: string): VaccineDoseRow =>
  ({
    id: `row-${code}`,
    baby_id: "b1",
    vaccine_code: code,
    dose_no: 1,
    status: "done",
    given_on: "2026-11-15",
    due_on_override: null,
    place: null,
    note: null,
    created_by: "u1",
    created_at: "2026-11-15T00:00:00.000Z",
    updated_at: "2026-11-15T00:00:00.000Z",
  }) as VaccineDoseRow;

function render(
  rows: VaccineDoseRow[] | undefined,
  choices: Record<string, string> = CHOSEN,
  isOwner = true,
) {
  state.doses = {
    data: rows,
    isPending: rows === undefined,
    isError: false,
    error: null,
    fetchStatus: rows === undefined ? "fetching" : "idle",
    refetch: () => {},
  };
  const baby = {
    id: "b1",
    family_id: "f1",
    name: "Bun",
    dob: "2026-09-14",
    vaccine_choices: choices,
  } as Baby;
  return renderToStaticMarkup(
    <VaccineScreen baby={baby} userId="u1" isOwner={isOwner} />,
  );
}

beforeAll(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-11-20T05:00:00Z")); // 12:00 giờ VN
});
afterAll(() => vi.useRealTimers());

// Spec 2026-11-19 §7.
describe("VaccineScreen: the cần làm trước card", () => {
  it("sits right under the page header, above the source row, for the first open dose", () => {
    const html = render([]);
    expect(html).toMatch(CARD);
    expect(html.match(/border-warn!/g)).toHaveLength(1);
    expect(html).toContain(">Quá hạn 67 ngày</span>");
    expect(html).toContain(
      ">Hẹn Thứ Hai, 14/09/2026 · Tiêm chủng mở rộng</span>",
    );
    const header = html.indexOf("</header>");
    const card = html.search(CARD);
    expect(card).toBeGreaterThan(header);
    expect(html.slice(header, card)).toBe("</header>");
    expect(html.indexOf("Nguồn lịch tiêm")).toBeGreaterThan(card);
    expect(html.slice(card, html.indexOf("Nguồn lịch tiêm"))).toContain(
      ">Lao (BCG)</span>",
    );
  });

  it("moves on once a dose is marked: the next one by due date and code", () => {
    const html = render([done("bcg")]);
    const card = html.slice(html.search(CARD), html.indexOf("Nguồn lịch tiêm"));
    expect(card).toContain(">Quá hạn 6 ngày</span>");
    expect(card).toContain(">6 trong 1 mũi 1</span>");
    expect(card).toContain(">Hẹn Thứ Bảy, 14/11/2026 · Dịch vụ</span>");
  });

  it("passes over the doses of a group with no series chosen", () => {
    const html = render([done("bcg")], {}, false);
    const card = html.slice(html.search(CARD), html.indexOf("Nguồn lịch tiêm"));
    expect(card).toContain(">Phế cầu mũi 1</span>");
  });

  it("a dose that is not overdue: no warn border", () => {
    const html = render([done("bcg"), done("hexa"), done("pcv")]);
    const card = html.slice(html.search(CARD), html.indexOf("Nguồn lịch tiêm"));
    expect(card).toContain(">Mũi tiếp theo</span>");
    expect(card).toContain(">Sởi mũi 1</span>");
    expect(html).not.toContain("border-warn!");
  });

  it("is hidden during setup", () => {
    const html = render([], {});
    expect(html).toContain(">Thiết lập lịch tiêm</h2>");
    expect(html).not.toMatch(CARD);
    expect(html).not.toContain("Quá hạn 67 ngày");
  });

  it("is hidden when no dose is left to do", () => {
    const html = render(["bcg", "hexa", "pcv", "mmr"].map(done));
    expect(
      html.match(/aria-label="[^"]*: Đã tiêm 15\/11\/2026"/g),
    ).toHaveLength(4);
    expect(html).not.toMatch(CARD);
  });

  it("is hidden while the doses load", () => {
    const html = render(undefined);
    expect(html).toContain("kb-pulse");
    expect(html).not.toMatch(CARD);
  });
});

// Spec 2026-11-19 §7.2 and §7.3.
describe("VaccineScreen: the table", () => {
  it("comes after the card, the source row and the choices, with its legend", () => {
    const html = render([]);
    const at = [
      html.indexOf("</header>"),
      html.search(CARD),
      html.indexOf("Nguồn lịch tiêm"),
      html.indexOf(">Chọn loại vaccine</button>"),
      html.indexOf("<table"),
      html.indexOf("</table>"),
      html.indexOf(">Chưa tiêm</li>"),
    ];
    expect(at.every((n) => n > -1)).toBe(true);
    expect([...at].sort((a, b) => a - b)).toEqual(at);
    expect(html.slice(html.indexOf("</table>"))).not.toContain("<button");
  });

  it("one row per vaccine, no list by state", () => {
    const html = render([done("bcg")]);
    const labels = [
      ...html.matchAll(/line-clamp-3[^"]*">([^<]+)<\/span>/g),
    ].map((m) => m[1]);
    expect(labels).toEqual(["Lao (BCG)", "6 trong 1", "Phế cầu", "Sởi"]);
    expect(html).toContain('aria-label="Lao (BCG): Đã tiêm 15/11/2026"');
    expect(html).toContain('aria-label="6 trong 1 mũi 1: Trễ hẹn 14/11/2026"');
    expect(html).not.toContain("Quá hạn (");
    expect(html).not.toContain("Sau này (");
  });

  it("not the owner: the unchosen group is plain text, and the new sentence", () => {
    const html = render([], {}, false);
    expect(state.grid?.onChoose).toBeUndefined();
    expect(html).toContain(">Bạch hầu, ho gà, uốn ván</span></th>");
    expect(html).toMatch(
      /text-muted"><span[^>]*>Chưa chọn loại<\/span><\/span><\/td>/,
    );
    expect(html).toContain(
      "Còn 1 nhóm chưa chọn loại vaccine. Mỗi nhóm này hiện một hàng &quot;Chưa chọn loại&quot; trong bảng và không có nhắc lịch.",
    );
    expect(html).not.toContain("hiện nhãn");
  });

  it("the owner: a dashed button that scrolls back to the top", () => {
    // A stored choice for a group that no longer exists: past setup, one unchosen.
    const html = render([], { legacy: "x" });
    expect(html).not.toContain(">Thiết lập lịch tiêm</h2>");
    expect(html).toMatch(
      /border-dashed border-muted[^"]*"><span[^>]*>Chưa chọn loại<svg/,
    );
    expect(html).toContain("Còn 1 nhóm chưa chọn loại vaccine.");
    const scrollTo = vi.fn();
    vi.stubGlobal("window", { scrollTo });
    try {
      state.grid?.onChoose?.();
    } finally {
      vi.unstubAllGlobals();
    }
    expect(scrollTo).toHaveBeenCalledExactlyOnceWith({ top: 0 });
  });

  it("the owner during setup: the button still scrolls to the setup step", () => {
    const html = render([], {});
    expect(html).toContain(">Thiết lập lịch tiêm</h2>");
    expect(html).toMatch(/border-dashed border-muted/);
    expect(state.grid?.onChoose).toBeTypeOf("function");
  });
});
