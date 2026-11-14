import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { findElements } from "@/components/ui/testTree";
import { BottleFields } from "./BottleFields";
import { TemperatureFields } from "./TemperatureFields";

type Step = { text: string; label: string; onPress: () => void };
const stepperOf = (tree: ReturnType<typeof BottleFields>) =>
  findElements(tree, (el) => el.props.plus !== undefined)[0].props as {
    minus: Step;
    plus: Step;
    onChange: (v: string) => void;
  };

describe("BottleFields", () => {
  it("big ml field with −10 / +10, recent amounts and milk type", () => {
    const html = renderToStaticMarkup(
      <BottleFields
        values={{ ml: "90", milk: "breast_milk" }}
        onChange={() => {}}
        recent={[90, 120]}
      />,
    );
    expect(html).toContain('inputMode="decimal"');
    expect(html).toContain('value="90"');
    expect(html).toContain("text-[34px]");
    expect(html).toContain('aria-label="Bớt 10 ml"');
    expect(html).toContain('aria-label="Thêm 10 ml"');
    expect(html).toContain(">−10</button>");
    expect(html).toContain(">90 ml</button>");
    expect(html).toContain(">120 ml</button>");
    expect(html).toMatch(/aria-pressed="true"[^>]*>Sữa mẹ<\/button>/);
  });

  it("steps by 10 and fills a recent amount", () => {
    const onChange = vi.fn();
    const values = { ml: "90", milk: "formula" };
    const tree = BottleFields({ values, onChange, recent: [120] });
    stepperOf(tree).plus.onPress();
    expect(onChange).toHaveBeenLastCalledWith({ ml: "100", milk: "formula" });
    stepperOf(tree).minus.onPress();
    expect(onChange).toHaveBeenLastCalledWith({ ml: "80", milk: "formula" });
    const [chip] = findElements(tree, (el) => el.props.children === "120 ml");
    (chip.props.onClick as () => void)();
    expect(onChange).toHaveBeenLastCalledWith({ ml: "120", milk: "formula" });
  });
});

describe("TemperatureFields", () => {
  it("empty field with 37,0 placeholder, ±0,1 and where it was measured", () => {
    const onChange = vi.fn();
    const values = { celsius: "", method: "nach" };
    const html = renderToStaticMarkup(
      <TemperatureFields values={values} onChange={onChange} />,
    );
    expect(html).toContain('placeholder="37,0"');
    expect(html).toContain(">°C</span>");
    expect(html).toContain('aria-label="Thêm 0,1 độ"');
    expect(html).toMatch(/aria-pressed="true"[^>]*>Nách<\/button>/);
    expect(html).toContain(">Hậu môn</button>");
    const tree = TemperatureFields({ values, onChange });
    stepperOf(tree as ReturnType<typeof BottleFields>).plus.onPress();
    expect(onChange).toHaveBeenLastCalledWith({
      celsius: "37,1",
      method: "nach",
    });
  });
});
