import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { findElements } from "@/components/ui/testTree";
import { formatGrowthValue } from "@/lib/rules/growthForm";
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

const props = (over: Partial<Parameters<typeof GrowthList>[0]> = {}) => ({
  rows: [row("g1", "u1"), row("g2", "u2")],
  lms: undefined,
  indicator: "wfa" as const,
  dob: "2026-09-10",
  pending: new Set(["g1"]),
  canEdit: (r: GrowthRow) => r.created_by === "u1",
  onOpen: () => {},
  ...over,
});

describe("GrowthList", () => {
  it("a glass list titled Các lần đo: date, age and each measured value", () => {
    const html = renderToStaticMarkup(<GrowthList {...props()} />);
    expect(html).toContain(">Các lần đo</h2>");
    expect(html).toContain("glass");
    expect(html).toContain("01/11/2026 · ");
    expect(html).toContain(">Cân nặng:</span>");
    expect(html).toContain(`>${formatGrowthValue("wfa", 5.2)}</span>`);
    expect(html).toContain(`>${formatGrowthValue("lhfa", 58.5)}</span>`);
    expect(html).not.toContain(">Vòng đầu:</span>");
    expect(html.match(/aria-label="Chờ đồng bộ"/g)).toHaveLength(1);
    expect(html.match(/disabled=""/g)).toHaveLength(1);
  });

  it("opens a row its owner may edit", () => {
    const onOpen = vi.fn();
    const p = props({ onOpen });
    const [first] = findElements(GrowthList(p), (el) => el.type === "button");
    (first.props.onClick as () => void)();
    expect(onOpen).toHaveBeenCalledWith(p.rows[0]);
  });
});
