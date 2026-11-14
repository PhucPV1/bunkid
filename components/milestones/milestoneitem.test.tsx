import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { MilestoneRow } from "@/lib/supabase/rows";
import { ICON_PATHS } from "@/lib/ui/icons";
import { MilestoneItem } from "./MilestoneItem";

const row = {
  id: "m1",
  baby_id: "b1",
  milestone_code: "smile",
  achieved_on: "2026-11-01",
  note: "cười với mẹ",
  photo_id: "p1",
  created_by: "u1",
  created_at: "2026-11-01T00:00:00.000Z",
} as MilestoneRow;

describe("MilestoneItem", () => {
  it("achieved: a filled check icon, no emoji, and the date with note and photo", () => {
    const html = renderToStaticMarkup(
      <ul>
        <MilestoneItem
          title="Cười đáp lại"
          row={row}
          pending
          disabled={false}
          onOpen={() => {}}
        />
      </ul>,
    );
    expect(html).toContain(`d="${ICON_PATHS.check}"`);
    expect(html).toContain("bg-good");
    expect(html).not.toContain("✓");
    expect(html).toContain(">Cười đáp lại ");
    expect(html).toContain("Đạt ngày 01/11/2026 · cười với mẹ · có ảnh");
    expect(html).toContain('aria-label="Chờ đồng bộ"');
  });

  it("not yet: an empty ring, extra content, and a tap opens the sheet", () => {
    const onOpen = vi.fn();
    const html = renderToStaticMarkup(
      <ul>
        <MilestoneItem
          title="Lật"
          row={undefined}
          pending={false}
          disabled={false}
          extra={<span>Thường 4–6 tháng</span>}
          onOpen={onOpen}
        />
      </ul>,
    );
    expect(html).not.toContain(`d="${ICON_PATHS.check}"`);
    expect(html).toContain("border-muted");
    expect(html).toContain("<span>Thường 4–6 tháng</span>");
    const element = MilestoneItem({
      title: "Lật",
      row: undefined,
      pending: false,
      disabled: false,
      onOpen,
    });
    const button = element.props.children as { props: { onClick: () => void } };
    button.props.onClick();
    expect(onOpen).toHaveBeenCalledOnce();
  });
});
