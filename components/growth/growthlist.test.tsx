import { Children, type ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { StatusChip } from "@/components/ui/StatusChip";
import { findElements, type TreeProps } from "@/components/ui/testTree";
import type { GrowthListItem } from "@/lib/rules/growthView";
import type { GrowthRow } from "@/lib/supabase/rows";
import { GrowthList } from "./GrowthList";

const row = (id: string, by: string): GrowthRow =>
  ({
    id,
    baby_id: "b1",
    measured_on: "2026-11-01",
    weight_g: 5200,
    length_cm: 58.5,
    head_cm: null,
    created_by: by,
    created_at: "2026-11-01T00:00:00.000Z",
    updated_at: "2026-11-01T00:00:00.000Z",
  }) as GrowthRow;

const item = (
  id: string,
  by: string,
  over: Partial<GrowthListItem<GrowthRow>> = {},
): GrowthListItem<GrowthRow> => ({
  row: row(id, by),
  title: "01/11 · 1 tháng 22 ngày",
  values: "5,2 kg · 58,5 cm",
  delta: "+0,8 kg · +3,5 cm so với lần trước",
  chip: { text: "Bình thường", tone: "good" },
  outside: false,
  ...over,
});

const props = (over: Partial<Parameters<typeof GrowthList>[0]> = {}) => ({
  items: [item("g1", "u1"), item("g2", "u2", { delta: null })],
  pending: new Set(["g1"]),
  canEdit: (r: GrowthRow) => r.created_by === "u1",
  onOpen: () => {},
  ...over,
});

// Spec 2026-11-25 §5.5.
describe("GrowthList", () => {
  it("a glass list titled Các lần đo: the day and age, the values, the change, a chip", () => {
    const html = renderToStaticMarkup(<GrowthList {...props()} />);
    expect(html).toContain(">Các lần đo</h2>");
    expect(html).toContain("glass");
    expect(html).toContain("01/11 · 1 tháng 22 ngày");
    expect(html).toContain(
      '<span class="text-[15px] text-ink tabular-nums">5,2 kg · 58,5 cm</span>',
    );
    expect(html).toContain(
      '<span class="text-[13px] leading-[18px] text-muted">+0,8 kg · +3,5 cm so với lần trước</span>',
    );
    expect(html.match(/so với lần trước/g)).toHaveLength(1);
    expect(
      html.match(/bg-good-soft text-good-ink">Bình thường<\/span>/g),
    ).toHaveLength(2);
  });

  // Beside the whole row the chip left the text 200 px at 375 px wide, and a
  // row with all three values broke between a number and its unit.
  it("the chip sits beside the title only; the values and the change run the full width", () => {
    const [button] = findElements(
      GrowthList(props()),
      (el) => el.type === "button",
    );
    expect(button.props.className).toContain("flex-col");
    const [head, values, delta] = Children.toArray(
      button.props.children,
    ) as ReactElement<TreeProps>[];
    expect(head.props.className).toBe("flex items-start gap-3");
    expect(findElements(head, (el) => el.type === StatusChip)).toHaveLength(1);
    expect(values.props.children).toBe("5,2 kg · 58,5 cm");
    expect(delta.props.children).toBe("+0,8 kg · +3,5 cm so với lần trước");
  });

  it("the words Ngoài bảng WHO sit beside the title too", () => {
    const [button] = findElements(
      GrowthList(
        props({ items: [item("g1", "u1", { chip: null, outside: true })] }),
      ),
      (el) => el.type === "button",
    );
    const [head] = Children.toArray(
      button.props.children,
    ) as ReactElement<TreeProps>[];
    expect(renderToStaticMarkup(head)).toContain("Ngoài bảng WHO");
  });

  it("no longer writes z-scores or percentile codes", () => {
    const html = renderToStaticMarkup(<GrowthList {...props()} />);
    expect(html).not.toMatch(/>z |· P\d/);
    expect(html).not.toContain("Cân nặng:");
  });

  it("marks the row still waiting to sync and locks the rows of others", () => {
    const html = renderToStaticMarkup(<GrowthList {...props()} />);
    expect(html.match(/aria-label="Chờ đồng bộ"/g)).toHaveLength(1);
    expect(html.match(/disabled=""/g)).toHaveLength(1);
  });

  it("a warning chip takes its tone", () => {
    const html = renderToStaticMarkup(
      <GrowthList
        {...props({
          items: [
            item("g1", "u1", { chip: { text: "Tăng chậm", tone: "warn" } }),
          ],
        })}
      />,
    );
    expect(html).toContain('bg-warn-soft text-warn-ink">Tăng chậm</span>');
  });

  it("a row outside the WHO table says so instead of a chip", () => {
    const html = renderToStaticMarkup(
      <GrowthList
        {...props({ items: [item("g1", "u1", { chip: null, outside: true })] })}
      />,
    );
    expect(html).toContain(
      '<span class="shrink-0 text-[13px] text-muted">Ngoài bảng WHO</span>',
    );
    expect(html).not.toContain("rounded-full px-2.5");
  });

  it("a row not assessed yet has neither", () => {
    const html = renderToStaticMarkup(
      <GrowthList
        {...props({
          items: [item("g1", "u1", { chip: null, outside: false })],
        })}
      />,
    );
    expect(html).not.toContain("Ngoài bảng WHO");
    expect(html).not.toContain("rounded-full px-2.5");
  });

  it("opens a row its owner may edit", () => {
    const onOpen = vi.fn();
    const p = props({ onOpen });
    const [first] = findElements(GrowthList(p), (el) => el.type === "button");
    (first.props.onClick as () => void)();
    expect(onOpen).toHaveBeenCalledWith(p.items[0].row);
  });
});
