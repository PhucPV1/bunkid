import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { findElements } from "@/components/ui/testTree";
import { STOOL_SWATCHES } from "@/lib/ui/tokens";
import { DiaperFields } from "./DiaperFields";
import { MedicineFields } from "./MedicineFields";

const wet = { wet: true, dirty: false, stoolColor: "" };

describe("DiaperFields", () => {
  it("wet only: three-way choice, no stool colours", () => {
    const html = renderToStaticMarkup(
      <DiaperFields values={wet} onChange={() => {}} />,
    );
    expect(html).toMatch(/aria-pressed="true"[^>]*>Ướt<\/button>/);
    expect(html).toContain(">Cả hai</button>");
    expect(html).not.toContain("Màu phân");
  });

  it("dirty: seven stool swatches in spec order, black and pale outlined", () => {
    const html = renderToStaticMarkup(
      <DiaperFields
        values={{ wet: false, dirty: true, stoolColor: "green" }}
        onChange={() => {}}
      />,
    );
    expect(html).toContain(">Màu phân</legend>");
    expect(html.match(/class="size-11 rounded-full/g)).toHaveLength(7);
    const labels = [
      ...html.matchAll(/<span class="text-xs font-medium">([^<]+)<\/span>/g),
    ].map((m) => m[1]);
    expect(labels).toEqual([
      "Không ghi",
      "Vàng",
      "Xanh",
      "Nâu",
      "Đen",
      "Bạc màu / trắng",
      "Có máu / đỏ",
    ]);
    expect(html).toContain(`background:${STOOL_SWATCHES.green}`);
    expect(html.match(/border border-muted/g)).toHaveLength(2);
  });

  it("switches kind and picks a colour", () => {
    const onChange = vi.fn();
    const tree = DiaperFields({ values: wet, onChange });
    const [segmented] = findElements(
      tree,
      (el) => el.props.options !== undefined,
    );
    (segmented.props.onChange as (v: string) => void)("both");
    expect(onChange).toHaveBeenLastCalledWith({
      wet: true,
      dirty: true,
      stoolColor: "",
    });
    const dirtyTree = DiaperFields({
      values: { wet: false, dirty: true, stoolColor: "" },
      onChange,
    });
    const [black] = findElements(dirtyTree, (el) => el.props.label === "Đen");
    (black.props.onSelect as () => void)();
    expect(onChange).toHaveBeenLastCalledWith({
      wet: false,
      dirty: true,
      stoolColor: "black",
    });
  });
});

describe("MedicineFields", () => {
  const values = { name: "", amount: "", unit: "ml", antipyretic: true };

  it("name with recent chips, decimal amount, unit, fever switch and warnings", () => {
    const onChange = vi.fn();
    const html = renderToStaticMarkup(
      <MedicineFields
        values={values}
        onChange={onChange}
        names={["Paracetamol", "Vitamin D"]}
        warnings={["Chưa đủ 4 giờ từ liều hạ sốt trước (09:00)."]}
      />,
    );
    expect(html).toContain(">Tên thuốc</span>");
    expect(html).toContain(">Paracetamol</button>");
    expect(html).toContain('inputMode="decimal"');
    expect(html).toMatch(/aria-pressed="true"[^>]*>ml<\/button>/);
    expect(html).toContain(">giọt</button>");
    expect(html).toContain('role="switch"');
    expect(html).toContain('aria-checked="true"');
    expect(html).toContain("bg-warn-soft");
    expect(html).toContain("text-warn-ink");
    expect(html).toContain("Chưa đủ 4 giờ từ liều hạ sốt trước (09:00).");
    const [chip] = findElements(
      MedicineFields({ values, onChange, names: ["Vitamin D"], warnings: [] }),
      (el) => el.props.children === "Vitamin D",
    );
    (chip.props.onClick as () => void)();
    expect(onChange).toHaveBeenLastCalledWith({ ...values, name: "Vitamin D" });
  });
});
