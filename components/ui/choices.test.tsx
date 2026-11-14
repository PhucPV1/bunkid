import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { ChipGroup } from "./ChipGroup";
import { Segmented, type ChoiceOption } from "./Segmented";
import { hostElements } from "./testTree";

type Kind = "wet" | "dirty" | "both";
const KINDS: ChoiceOption<Kind>[] = [
  { value: "wet", label: "Ướt" },
  { value: "dirty", label: "Bẩn" },
  { value: "both", label: "Cả hai" },
];

describe("Segmented", () => {
  it("renders a labelled group with one pressed button", () => {
    const html = renderToStaticMarkup(
      <Segmented
        label="Loại tã"
        options={KINDS}
        value="both"
        onChange={() => {}}
      />,
    );
    expect(html).toContain('role="group"');
    expect(html).toContain('aria-label="Loại tã"');
    expect(html).toContain("grid-template-columns:repeat(3, minmax(0, 1fr))");
    expect(html.match(/aria-pressed="true"/g)).toHaveLength(1);
    expect(html.match(/aria-pressed="false"/g)).toHaveLength(2);
    expect(html).toContain("glass");
  });

  it("reports the chosen value", () => {
    const onChange = vi.fn();
    const buttons = hostElements(
      Segmented({ label: "Loại tã", options: KINDS, value: "wet", onChange }),
      "button",
    );
    expect(buttons.map((b) => b.props["aria-pressed"])).toEqual([
      true,
      false,
      false,
    ]);
    (buttons[2].props.onClick as () => void)();
    expect(onChange).toHaveBeenCalledWith("both");
  });

  it("refuses fewer than 2 or more than 4 options", () => {
    expect(() =>
      Segmented({
        label: "x",
        options: KINDS.slice(0, 1),
        value: "wet",
        onChange: () => {},
      }),
    ).toThrow();
    const five = [
      ...KINDS,
      { value: "wet", label: "a" },
      { value: "dirty", label: "b" },
    ] as ChoiceOption<Kind>[];
    expect(() =>
      Segmented({
        label: "x",
        options: five,
        value: "wet",
        onChange: () => {},
      }),
    ).toThrow();
  });
});

describe("ChipGroup", () => {
  const TIMES: ChoiceOption<string>[] = [
    { value: "now", label: "Bây giờ" },
    { value: "5", label: "5 phút trước" },
    { value: "15", label: "15 phút trước" },
    { value: "pick", label: "Chọn giờ…" },
  ];

  it("scrolls sideways with a faded right edge and hides the scrollbar", () => {
    const html = renderToStaticMarkup(
      <ChipGroup
        label="Lúc nào?"
        options={TIMES}
        value="now"
        onChange={() => {}}
      />,
    );
    expect(html).toContain('aria-label="Lúc nào?"');
    expect(html).toContain("overflow-x-auto");
    expect(html).toContain("[scrollbar-width:none]");
    expect(html).toContain("bg-linear-to-l from-bg");
    expect(html).toContain("bg-ink font-semibold text-bg");
  });

  it("reports the chosen value", () => {
    const onChange = vi.fn();
    const buttons = hostElements(
      ChipGroup({ label: "Lúc nào?", options: TIMES, value: "now", onChange }),
      "button",
    );
    expect(buttons).toHaveLength(4);
    (buttons[3].props.onClick as () => void)();
    expect(onChange).toHaveBeenCalledWith("pick");
  });
});
