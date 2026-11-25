import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { Popup, PopupView } from "./Popup";
import { findElements } from "./testTree";

// Spec 2026-11-25 §5.3: a short explanation in the middle of the screen, in
// the look of the "Bỏ thay đổi?" dialog (spec 2026-11-15 §5.2).
describe("Popup", () => {
  const html = renderToStaticMarkup(
    <Popup title="Vì sao có cảnh báo này?" onClose={() => {}}>
      App so số đo của bé với chuẩn của WHO.
    </Popup>,
  );

  it("is a modal dialog that fills the screen and centres its box", () => {
    expect(html).toMatch(/^<dialog /);
    expect(html).toContain("fixed inset-0");
    expect(html).toContain("hidden");
    expect(html).toContain("open:flex");
    expect(html).toContain("items-center justify-center");
    expect(html).toContain("backdrop:bg-black/40");
  });

  it("the box is solid, 300 px wide at most, with the title naming the dialog", () => {
    expect(html).toContain(
      "w-full max-w-[300px] rounded-[28px] bg-glass-solid p-[22px_18px_16px] text-center shadow-[0_20px_60px_rgb(0_0_0/0.3)]",
    );
    const id = /aria-labelledby="([^"]+)"/.exec(html)?.[1];
    expect(id).toBeTruthy();
    expect(html).toContain(
      `<h2 id="${id}" class="text-[19px] leading-6 font-bold text-ink">Vì sao có cảnh báo này?</h2>`,
    );
  });

  it("shows the text and one button to close", () => {
    expect(html).toContain(">App so số đo của bé với chuẩn của WHO.</div>");
    expect(html.match(/<button/g)).toHaveLength(1);
    expect(html).toContain(">Đã hiểu</button>");
  });

  it("the button closes it", () => {
    const onClose = vi.fn();
    const [button] = findElements(
      PopupView({ title: "x", titleId: "t", onClose, children: "y" }),
      (el) => el.props.children === "Đã hiểu",
    );
    (button.props.onClick as () => void)();
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("a tap on the dark area closes it, a tap inside the box does not", () => {
    const onClose = vi.fn();
    const [dialog] = findElements(
      PopupView({ title: "x", titleId: "t", onClose, children: "y" }),
      (el) => el.type === "dialog",
    );
    const click = dialog.props.onClick as (event: unknown) => void;
    const area = {};
    click({ target: {}, currentTarget: area });
    expect(onClose).not.toHaveBeenCalled();
    click({ target: area, currentTarget: area });
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("closing with Esc reports through the dialog's close event", () => {
    const onClose = vi.fn();
    const [dialog] = findElements(
      PopupView({ title: "x", titleId: "t", onClose, children: "y" }),
      (el) => el.type === "dialog",
    );
    expect(dialog.props.onClose).toBe(onClose);
  });
});
