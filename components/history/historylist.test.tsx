import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { findElements } from "@/components/ui/testTree";
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
const groups = [
  { day: "2026-11-14", summary: "1 cữ · 0 tã · ngủ 1g", logs: [bottle, sleep] },
];

describe("HistoryList", () => {
  it("groups by day with a 20/700 title and the day summary, rows with chip, text, time and who", () => {
    const html = renderToStaticMarkup(
      <HistoryList
        groups={groups}
        now={NOW}
        nameOf={() => "Ba"}
        pending={new Set(["b1"])}
        onOpen={() => {}}
      />,
    );
    expect(html).toContain(">Hôm nay</h2>");
    expect(html).toContain("text-xl");
    expect(html).toContain(">1 cữ · 0 tã · ngủ 1g</span>");
    expect(html).toContain("size-[34px]");
    expect(html).toContain("bg-cat-bottle/15 text-cat-bottle");
    expect(html).toContain(`d="${ICON_PATHS.moon}"`);
    expect(html).toContain("Bình 90 ml sữa công thức");
    expect(html).toContain(">uống hết</span>");
    expect(html).toContain(">11:00</span>");
    expect(html).toContain(">09:00</span>");
    expect(html.match(/>Ba<\/span>/g)).toHaveLength(2);
    expect(html.match(/aria-label="Chờ đồng bộ"/g)).toHaveLength(1);
    expect(html).toContain("glass");
  });

  it("spec 2026-11-27 §6.2: a symptom row reads Cả ngày instead of its time", () => {
    const symptom = log(
      "y1",
      "symptom",
      "2026-11-14T05:00:00.000Z",
      "2026-11-14T05:00:00.000Z",
      { codes: ["cough"] },
    );
    const html = renderToStaticMarkup(
      <HistoryList
        groups={[{ day: "2026-11-14", summary: "", logs: [symptom] }]}
        now={NOW}
        nameOf={() => "Ba"}
        pending={new Set()}
        onOpen={() => {}}
      />,
    );
    expect(html).toContain(">Cả ngày</span>");
    expect(html).not.toContain(">12:00</span>");
  });

  it("opens the row's log", () => {
    const onOpen = vi.fn();
    const rows = findElements(
      HistoryList({
        groups,
        now: NOW,
        nameOf: () => "Ba",
        pending: new Set(),
        onOpen,
      }),
      (el) => el.type === "button",
    );
    expect(rows).toHaveLength(2);
    (rows[1].props.onClick as () => void)();
    expect(onOpen).toHaveBeenCalledWith(sleep);
  });
});
