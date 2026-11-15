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
  const props = {
    values,
    onChange: () => {},
    names: ["Paracetamol"],
    onPick: () => {},
    warnings: [] as string[],
  };

  it("name, quick chips, recent chips, decimal amount, 6 units, fever switch and warnings", () => {
    const html = renderToStaticMarkup(
      <MedicineFields
        {...props}
        warnings={["Chưa đủ 4 giờ từ liều hạ sốt trước (09:00)."]}
      />,
    );
    expect(html).toContain(">Tên thuốc</span>");
    expect(html).toContain('aria-label="Chọn nhanh"');
    expect(html).toContain(">Vitamin D</button>");
    expect(html).toContain(">DHA</button>");
    expect(html).toContain(">Men tiêu hoá</button>");
    expect(html.indexOf(">Vitamin D</button>")).toBeLessThan(
      html.indexOf(">Men tiêu hoá</button>"),
    );
    expect(html).toContain('aria-label="Thuốc gần đây"');
    expect(html).toContain(">Paracetamol</button>");
    expect(html.indexOf(">Men tiêu hoá</button>")).toBeLessThan(
      html.indexOf(">Paracetamol</button>"),
    );
    expect(html).toContain('inputMode="decimal"');
    expect(html).toMatch(/aria-pressed="true"[^>]*>ml<\/button>/);
    expect(html).toContain(">gói</button>");
    expect(html).toContain(">ống</button>");
    expect(html).toContain('role="switch"');
    expect(html).toContain("bg-warn-soft");
    expect(html).toContain("Chưa đủ 4 giờ từ liều hạ sốt trước (09:00).");
  });

  it("hides Gần đây when there is nothing left after the presets", () => {
    const html = renderToStaticMarkup(<MedicineFields {...props} names={[]} />);
    expect(html).toContain('aria-label="Chọn nhanh"');
    expect(html).not.toContain("Gần đây");
  });

  it("the chip matching the typed name is pressed and filled, any case", () => {
    const html = renderToStaticMarkup(
      <MedicineFields {...props} values={{ ...values, name: "dha " }} />,
    );
    expect(html).toMatch(/aria-pressed="true"[^>]*>DHA<\/button>/);
    expect(html).toMatch(/aria-pressed="false"[^>]*>Vitamin D<\/button>/);
    expect(html).toMatch(/bg-accent text-on-accent[^>]*>DHA<\/button>/);
  });

  it("quick and recent chips both hand their name to onPick", () => {
    const onPick = vi.fn();
    const tree = MedicineFields({ ...props, onPick });
    const [dha] = findElements(tree, (el) => el.props.children === "DHA");
    const [recent] = findElements(
      tree,
      (el) => el.props.children === "Paracetamol",
    );
    (dha.props.onClick as () => void)();
    (recent.props.onClick as () => void)();
    expect(onPick.mock.calls).toEqual([["DHA"], ["Paracetamol"]]);
  });
});
