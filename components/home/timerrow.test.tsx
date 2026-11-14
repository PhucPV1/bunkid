import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { findElements } from "@/components/ui/testTree";
import type { LogRow } from "@/lib/supabase/rows";
import { ICON_PATHS } from "@/lib/ui/icons";
import { TimerRow } from "./TimerRow";
import { VitaminDButton } from "./VitaminDButton";

const NOW = new Date("2026-11-14T05:00:00Z");
const sleep = {
  id: "s1",
  baby_id: "b1",
  type: "sleep",
  started_at: "2026-11-14T03:30:00.000Z",
  ended_at: null,
  details: {},
  note: null,
  created_by: "u1",
  created_at: "2026-11-14T03:30:00.000Z",
  updated_at: "2026-11-14T03:30:00.000Z",
} as LogRow;

describe("TimerRow", () => {
  it("names the timer, how long it has run and who started it", () => {
    const html = renderToStaticMarkup(
      <TimerRow
        log={sleep}
        who="Ba"
        now={NOW}
        busy={false}
        pending={false}
        onStop={() => {}}
      />,
    );
    expect(html).toContain(">Ngủ · 1 giờ 30 phút · Ba");
    expect(html).toContain("bg-cat-sleep/15 text-cat-sleep");
    expect(html).toContain(`d="${ICON_PATHS.moon}"`);
    expect(html).toContain(">Dừng</button>");
    expect(html).toContain("glass");
  });

  it("Dừng calls onStop, and is disabled while busy", () => {
    const onStop = vi.fn();
    const tree = TimerRow({
      log: sleep,
      who: "Ba",
      now: NOW,
      busy: true,
      pending: false,
      onStop,
    });
    const [stop] = findElements(tree, (el) => el.props.children === "Dừng");
    expect(stop.props.disabled).toBe(true);
    (stop.props.onClick as () => void)();
    expect(onStop).toHaveBeenCalledOnce();
  });
});

describe("VitaminDButton", () => {
  it("is a dashed glass button without a tick emoji", () => {
    const onRecord = vi.fn();
    const html = renderToStaticMarkup(<VitaminDButton onRecord={onRecord} />);
    expect(html).toContain("Ghi Vitamin D hôm nay");
    expect(html).toContain("border-dashed!");
    expect(html).toContain(`d="${ICON_PATHS.pill}"`);
    expect(html).not.toContain("✓");
    (VitaminDButton({ onRecord }).props.onClick as () => void)();
    expect(onRecord).toHaveBeenCalledOnce();
  });
});
