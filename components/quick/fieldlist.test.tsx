import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { findElements } from "@/components/ui/testTree";
import { LOG_FIELDS } from "@/lib/rules/logForm";
import { FieldList } from "./FieldList";

const html = (props: Parameters<typeof FieldList>[0]) =>
  renderToStaticMarkup(<FieldList {...props} />);

describe("FieldList", () => {
  it("checkboxes become switches; a long select stays native and follows showIf", () => {
    const fields = LOG_FIELDS.diaper;
    const wetOnly = html({
      fields,
      values: { wet: true, dirty: false, stoolColor: "" },
      onChange: () => {},
    });
    expect(wetOnly.match(/role="switch"/g)).toHaveLength(2);
    expect(wetOnly).toContain('aria-label="Ướt"');
    expect(wetOnly).not.toContain("<select");
    const dirty = html({
      fields,
      values: { wet: false, dirty: true, stoolColor: "green" },
      onChange: () => {},
    });
    expect(dirty).toContain(">Màu phân</span>");
    expect(dirty).toContain("<select");
    expect(dirty).toContain("accent-accent");
    expect(dirty.match(/<option/g)).toHaveLength(7);
    expect(dirty).not.toContain('type="checkbox"');
  });

  it("selects with 2 to 4 options become a segmented control", () => {
    const side = html({
      fields: LOG_FIELDS.breast,
      values: { side: "left" },
      onChange: () => {},
    });
    expect(side).toContain('aria-label="Bên"');
    expect(side).toMatch(/aria-pressed="true"[^>]*>Trái<\/button>/);
    const method = html({
      fields: LOG_FIELDS.temperature,
      values: { celsius: "37,5", method: "tai" },
      onChange: () => {},
    });
    expect(method).toMatch(/aria-pressed="true"[^>]*>Tai<\/button>/);
    expect(method).not.toContain("<select");
  });

  it("numbers use the decimal keyboard, text fields the normal one", () => {
    const med = html({
      fields: LOG_FIELDS.medicine,
      values: {
        name: "Paracetamol",
        amount: "2,5",
        unit: "ml",
        antipyretic: false,
      },
      onChange: () => {},
    });
    expect(med).toContain('value="Paracetamol"');
    expect(med).toContain('inputMode="decimal"');
    expect(med).toContain('value="2,5"');
    expect(med).toContain(">Tên thuốc</span>");
  });

  it("the 6 medicine units are a segmented control, not a native select", () => {
    const med = html({
      fields: LOG_FIELDS.medicine,
      values: { name: "Men", amount: "1", unit: "gói", antipyretic: false },
      onChange: () => {},
    });
    expect(med).toContain('aria-label="Đơn vị"');
    expect(med).toMatch(/aria-pressed="true"[^>]*>gói<\/button>/);
    expect(med).toContain(">ống</button>");
    expect(med).not.toContain("<select");
  });

  it("reports changes with the field's key", () => {
    const onChange = vi.fn();
    const values = { wet: true, dirty: false, stoolColor: "" };
    const tree = FieldList({ fields: LOG_FIELDS.diaper, values, onChange });
    const [dirtySwitch] = findElements(tree, (el) => el.props.label === "Bẩn");
    (dirtySwitch.props.onChange as (v: boolean) => void)(true);
    expect(onChange).toHaveBeenLastCalledWith({ ...values, dirty: true });
    const sideTree = FieldList({
      fields: LOG_FIELDS.breast,
      values: { side: "left" },
      onChange,
    });
    const [segmented] = findElements(
      sideTree,
      (el) => el.props.options !== undefined,
    );
    (segmented.props.onChange as (v: string) => void)("right");
    expect(onChange).toHaveBeenLastCalledWith({ side: "right" });
  });
});
