import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { findElements } from "@/components/ui/testTree";
import type { OpenPeriodDay } from "@/lib/rules/dayPeriods";
import type { LogRow } from "@/lib/supabase/rows";
import { ICON_PATHS } from "@/lib/ui/icons";
import { HistoryList } from "./HistoryList";

const NOW = new Date("2026-11-14T05:00:00.000Z"); // 12:00 VN
const log = (
  id: string,
  type: string,
  start: string,
  end: string | null,
  details: unknown,
  note: string | null = null,
) =>
  ({
    id,
    baby_id: "b1",
    type,
    started_at: start,
    ended_at: end,
    details,
    note,
    created_by: "u1",
    created_at: start,
    updated_at: start,
  }) as LogRow;

const bottle = log(
  "b1",
  "bottle",
  "2026-11-14T04:00:00.000Z",
  "2026-11-14T04:00:00.000Z",
  { ml: 90, milk: "formula" },
  "uống hết",
);
const sleep = log(
  "s1",
  "sleep",
  "2026-11-14T02:00:00.000Z",
  "2026-11-14T03:00:00.000Z",
  {},
);
const diaper = log(
  "d1",
  "diaper",
  "2026-11-13T22:30:00.000Z",
  "2026-11-13T22:30:00.000Z",
  { wet: true, dirty: false },
);
const symptom = log(
  "y1",
  "symptom",
  "2026-11-14T05:00:00.000Z",
  "2026-11-14T05:00:00.000Z",
  { codes: ["cough"] },
);

const groups: OpenPeriodDay<LogRow>[] = [
  {
    day: "2026-11-14",
    summary: "1 cữ · 1 tã · ngủ 1g",
    symptoms: [symptom],
    periods: [
      {
        key: "afternoon",
        label: "Chiều · 12–18 giờ",
        summary: "",
        logs: [],
        kind: "empty",
        open: false,
      },
      {
        key: "morning",
        label: "Sáng · 6–12 giờ",
        summary: "1 cữ · ngủ 1g",
        logs: [bottle, sleep],
        kind: "logs",
        open: true,
      },
      {
        key: "night",
        label: "Đêm · 0–6 giờ",
        summary: "1 tã · ngủ 4g",
        logs: [diaper],
        kind: "logs",
        open: false,
      },
    ],
  },
  {
    day: "2026-11-13",
    summary: "0 cữ · 0 tã · ngủ 2g",
    symptoms: [],
    periods: [
      {
        key: "evening",
        label: "Tối · 18–24 giờ",
        summary: "ngủ 2g",
        logs: [],
        kind: "sleepOnly",
        open: false,
      },
    ],
  },
];

const render = (pending = new Set<string>()) =>
  renderToStaticMarkup(
    <HistoryList
      groups={groups}
      now={NOW}
      nameOf={() => "Ba"}
      pending={pending}
      onOpen={() => {}}
      onToggle={() => {}}
    />,
  );

describe("HistoryList", () => {
  it("groups by day with a 20/700 title and the day summary", () => {
    const html = render();
    expect(html).toContain(">Hôm nay</h2>");
    expect(html).toContain("text-xl");
    expect(html).toContain(">1 cữ · 1 tã · ngủ 1g</span>");
    expect(html).toContain("glass");
  });

  it("rows of an open period keep chip, text, note, time, who and the pending mark", () => {
    const html = render(new Set(["b1"]));
    expect(html).toContain("size-[34px]");
    expect(html).toContain("bg-cat-bottle/15 text-cat-bottle");
    expect(html).toContain(`d="${ICON_PATHS.moon}"`);
    expect(html).toContain("Bình 90 ml sữa công thức");
    expect(html).toContain(">uống hết</span>");
    expect(html).toContain(">11:00</span>");
    expect(html).toContain(">09:00</span>");
    expect(html.match(/aria-label="Chờ đồng bộ"/g)).toHaveLength(1);
  });

  // Spec 2026-11-27 (Nhật ký theo buổi) §4.1.
  it("symptom rows come first, read Cả ngày, and sit outside every period", () => {
    const html = render();
    expect(html).toContain(">Cả ngày</span>");
    expect(html.indexOf(">Cả ngày</span>")).toBeLessThan(
      html.indexOf(">Chiều · 12–18 giờ</span>"),
    );
  });

  // §4.1, §4.2.
  it("an open period is a header button over a nested list it controls", () => {
    const html = render();
    expect(html).toMatch(
      /<li class="[^"]*border-b border-line[^"]*"><button type="button" aria-expanded="true" aria-controls="p-2026-11-14-morning" class="[^"]*min-h-\[52px\][^"]*bg-line[^"]*"><span class="[^"]*shrink-0 whitespace-nowrap text-base font-bold text-ink[^"]*">Sáng · 6–12 giờ<\/span><span class="[^"]*text-\[13px\] text-muted tabular-nums[^"]*">1 cữ · ngủ 1g<\/span>/,
    );
    expect(html).toContain(`d="${ICON_PATHS.chevronUp}"`);
    // Night: a lighter header keeps the muted summary at 4.5:1 (§5.3).
    expect(html).toContain("in-data-[theme=night]:bg-line/70");
    expect(html).toMatch(
      /<ul id="p-2026-11-14-morning"><li class="border-t border-line">/,
    );
    expect(html.match(/<ul id=/g)).toHaveLength(1);
  });

  it("a closed period shows its summary and no rows", () => {
    const html = render();
    expect(html).toMatch(
      /<button type="button" aria-expanded="false" class="[^"]*">.*?>Đêm · 0–6 giờ<\/span><span[^>]*>1 tã · ngủ 4g<\/span>/,
    );
    expect(html).toContain(`d="${ICON_PATHS.chevronDown}"`);
    expect(html).not.toContain("Tã ướt");
    expect(html).not.toContain("p-2026-11-14-night");
  });

  // §4.3.
  it("an empty period is a faded row and a sleep-only period a plain row, neither a button", () => {
    const html = render();
    expect(html).toMatch(
      /<li class="[^"]*min-h-\[52px\][^"]*"><span class="[^"]*font-bold text-muted[^"]*">Chiều · 12–18 giờ<\/span><span class="[^"]*text-muted[^"]*">Không có bản ghi<\/span><\/li>/,
    );
    expect(html).toMatch(
      /<li class="[^"]*min-h-\[52px\][^"]*"><span class="[^"]*font-bold text-ink[^"]*">Tối · 18–24 giờ<\/span><span class="[^"]*text-muted[^"]*">ngủ 2g<\/span><\/li>/,
    );
    expect(html).not.toContain("opacity");
  });

  // §4.2.
  it("a closed period with a pending row shows the mark on its header; an open one does not", () => {
    const closed = render(new Set(["d1"]));
    expect(closed).toMatch(
      />1 tã · ngủ 4g<\/span><span role="img" aria-label="Chờ đồng bộ"/,
    );
    const open = render(new Set(["s1"]));
    expect(open).not.toMatch(/ngủ 1g<\/span><span role="img"/);
    expect(open.match(/aria-label="Chờ đồng bộ"/g)).toHaveLength(1);
  });

  it("a header hands its period on to be flipped; a row opens its log", () => {
    const onOpen = vi.fn();
    const onToggle = vi.fn();
    const buttons = findElements(
      HistoryList({
        groups,
        now: NOW,
        nameOf: () => "Ba",
        pending: new Set(),
        onOpen,
        onToggle,
      }),
      (el) => el.type === "button",
    );
    // Cả ngày, Sáng header, two rows of Sáng, Đêm header.
    expect(buttons).toHaveLength(5);
    (buttons[1].props.onClick as () => void)();
    expect(onToggle).toHaveBeenCalledWith("2026-11-14", "morning", false);
    (buttons[4].props.onClick as () => void)();
    expect(onToggle).toHaveBeenLastCalledWith("2026-11-14", "night", true);
    (buttons[3].props.onClick as () => void)();
    expect(onOpen).toHaveBeenCalledWith(sleep);
    (buttons[0].props.onClick as () => void)();
    expect(onOpen).toHaveBeenLastCalledWith(symptom);
  });
});
