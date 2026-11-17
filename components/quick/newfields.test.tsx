import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { findElements, hostElements } from "@/components/ui/testTree";
import { NoteFields } from "./NoteFields";
import { SolidsFields } from "./SolidsFields";
import { WaterFields } from "./WaterFields";

const typing = (value: string) => ({ target: { value } });

describe("SolidsFields", () => {
  const values = { food: "Cháo", amount: "some", isNew: false, reaction: "" };

  it("food with recent chips, amount, new-food switch and reaction", () => {
    const html = renderToStaticMarkup(
      <SolidsFields
        values={values}
        onChange={() => {}}
        recent={["Bí đỏ", "Chuối"]}
      />,
    );
    expect(html).toContain(">Món</span>");
    expect(html).toContain('value="Cháo"');
    expect(html).toContain('maxLength="80"');
    expect(html).toContain('aria-label="Món gần đây"');
    expect(html).toContain(">Bí đỏ</button>");
    expect(html).toContain(">Chuối</button>");
    expect(html).toContain('aria-label="Lượng"');
    expect(html).toMatch(/aria-pressed="true"[^>]*>Vừa<\/button>/);
    expect(html).toContain(">Ít</button>");
    expect(html).toContain(">Nhiều</button>");
    expect(html).toMatch(
      /role="switch" aria-checked="false" aria-label="Món mới"/,
    );
    expect(html).toContain(">Đánh dấu lần đầu bé ăn món này</span>");
    expect(html).toContain(">Phản ứng (nếu có)</span>");
    expect(html).toContain('maxLength="200"');
    expect(html).toContain('placeholder="Ví dụ: nổi mẩn quanh miệng"');
  });

  it("hides the chip row when nothing was logged before", () => {
    const html = renderToStaticMarkup(
      <SolidsFields values={values} onChange={() => {}} recent={[]} />,
    );
    expect(html).not.toContain("Món gần đây");
  });

  it("a chip fills the food; amount, switch and reaction report their own key", () => {
    const onChange = vi.fn();
    const tree = SolidsFields({ values, onChange, recent: ["Bí đỏ"] });
    const [chip] = findElements(tree, (el) => el.props.children === "Bí đỏ");
    (chip.props.onClick as () => void)();
    expect(onChange).toHaveBeenLastCalledWith({ ...values, food: "Bí đỏ" });
    const [amount] = findElements(tree, (el) => el.props.options !== undefined);
    (amount.props.onChange as (v: string) => void)("lots");
    expect(onChange).toHaveBeenLastCalledWith({ ...values, amount: "lots" });
    const [isNew] = findElements(tree, (el) => el.props.label === "Món mới");
    (isNew.props.onChange as (v: boolean) => void)(true);
    expect(onChange).toHaveBeenLastCalledWith({ ...values, isNew: true });
    const [, reaction] = hostElements(tree, "input");
    (reaction.props.onChange as (e: unknown) => void)(typing("nổi mẩn"));
    expect(onChange).toHaveBeenLastCalledWith({
      ...values,
      reaction: "nổi mẩn",
    });
  });
});

describe("WaterFields", () => {
  it("one big ml field stepped by 10", () => {
    const onChange = vi.fn();
    const html = renderToStaticMarkup(
      <WaterFields values={{ ml: "30" }} onChange={onChange} />,
    );
    expect(html).toContain(">Số ml</span>");
    expect(html).toContain('value="30"');
    expect(html).toContain('aria-label="Bớt 10 ml"');
    expect(html).toContain('aria-label="Thêm 10 ml"');
    const [stepper] = findElements(
      WaterFields({ values: { ml: "30" }, onChange }),
      (el) => el.props.plus !== undefined,
    );
    const { minus, plus } = stepper.props as {
      minus: { onPress: () => void };
      plus: { onPress: () => void };
    };
    plus.onPress();
    expect(onChange).toHaveBeenLastCalledWith({ ml: "40" });
    minus.onPress();
    expect(onChange).toHaveBeenLastCalledWith({ ml: "20" });
  });
});

describe("NoteFields", () => {
  it("a three-line textarea capped at 500 characters", () => {
    const onChange = vi.fn();
    const html = renderToStaticMarkup(
      <NoteFields values={{ text: "Bé cười nhiều" }} onChange={onChange} />,
    );
    expect(html).toContain(">Nội dung</span>");
    expect(html).toMatch(/<textarea[^>]*rows="3"/);
    expect(html).toMatch(/<textarea[^>]*maxLength="500"/);
    expect(html).toContain(">Bé cười nhiều</textarea>");
    const [area] = hostElements(
      NoteFields({ values: { text: "" }, onChange }),
      "textarea",
    );
    (area.props.onChange as (e: unknown) => void)(typing("Mọc răng"));
    expect(onChange).toHaveBeenLastCalledWith({ text: "Mọc răng" });
  });
});
