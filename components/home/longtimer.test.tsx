import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { findElements } from "@/components/ui/testTree";
import type { LogRow } from "@/lib/supabase/rows";
import { ICON_PATHS } from "@/lib/ui/icons";
import { LongTimerBanner } from "./LongTimerBanner";

const NOW = new Date("2026-11-17T05:00:00Z");
const tummy: LogRow = {
  id: "t1",
  baby_id: "b1",
  type: "tummy",
  started_at: "2026-11-17T04:28:00Z",
  ended_at: null,
  details: {},
  note: null,
  created_by: "u1",
  created_at: "2026-11-17T04:28:00Z",
  updated_at: "2026-11-17T04:28:00Z",
};

describe("LongTimerBanner", () => {
  it("is a yellow status row with a clock, the question and a Dừng button", () => {
    const html = renderToStaticMarkup(
      <LongTimerBanner log={tummy} now={NOW} busy={false} onStop={() => {}} />,
    );
    expect(html).toContain('role="status"');
    expect(html).toContain("bg-warn-soft");
    expect(html).toContain("text-warn-ink");
    expect(html).toContain(`d="${ICON_PATHS.clock}"`);
    expect(html).toContain("Nằm sấp đã chạy 32 phút. Còn đang nằm sấp không?");
    expect(html).toContain("min-h-11");
    expect(html).toContain(">Dừng</button>");
  });

  it("Dừng calls onStop and is disabled while busy", () => {
    const onStop = vi.fn();
    const [button] = findElements(
      LongTimerBanner({ log: tummy, now: NOW, busy: false, onStop }),
      (el) => el.type === "button",
    );
    (button.props.onClick as () => void)();
    expect(onStop).toHaveBeenCalledTimes(1);
    const html = renderToStaticMarkup(
      <LongTimerBanner log={tummy} now={NOW} busy onStop={onStop} />,
    );
    expect(html).toContain("disabled");
  });
});
