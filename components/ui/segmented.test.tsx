import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Segmented } from "./Segmented";

const noop = () => {};

describe("Segmented label size", () => {
  it("3–4 options: 13 px on one line", () => {
    const html = renderToStaticMarkup(
      <Segmented
        label="Đo ở"
        options={[
          { value: "nach", label: "Nách" },
          { value: "tran", label: "Trán" },
          { value: "tai", label: "Tai" },
          { value: "hau_mon", label: "Hậu môn" },
        ]}
        value="nach"
        onChange={noop}
      />,
    );
    expect(html.match(/text-\[13px\]/g)).toHaveLength(4);
    expect(html.match(/truncate/g)).toHaveLength(4);
    expect(html).not.toContain("text-[15px]");
  });

  it("2 options keep 15 px", () => {
    const html = renderToStaticMarkup(
      <Segmented
        label="Sữa"
        options={[
          { value: "a", label: "Sữa mẹ" },
          { value: "b", label: "Sữa công thức" },
        ]}
        value="a"
        onChange={noop}
      />,
    );
    expect(html.match(/text-\[15px\]/g)).toHaveLength(2);
    expect(html).toContain("truncate");
  });

  it("5–6 options: still 13 px, one line each", () => {
    const html = renderToStaticMarkup(
      <Segmented
        label="Đơn vị"
        options={["ml", "mg", "giọt", "viên", "gói", "ống"].map((u) => ({
          value: u,
          label: u,
        }))}
        value="ml"
        onChange={noop}
      />,
    );
    expect(html.match(/text-\[13px\]/g)).toHaveLength(6);
    expect(html.match(/truncate/g)).toHaveLength(6);
    expect(html).toContain("repeat(6, minmax(0, 1fr))");
  });

  it("refuses more than 6 options", () => {
    const seven = ["a", "b", "c", "d", "e", "f", "g"].map((v) => ({
      value: v,
      label: v,
    }));
    expect(() =>
      renderToStaticMarkup(
        <Segmented label="x" options={seven} value="a" onChange={noop} />,
      ),
    ).toThrow("Segmented needs 2–6 options, got 7");
  });
});

// Spec 2026-11-25 §5.3: an indicator with an alert carries a dot.
describe("Segmented option dot", () => {
  const html = renderToStaticMarkup(
    <Segmented
      label="Chỉ số"
      options={[
        { value: "wfa", label: "Cân nặng", dot: "warn" },
        { value: "lhfa", label: "Chiều dài" },
        { value: "hcfa", label: "Vòng đầu", dot: "danger" },
      ]}
      value="wfa"
      onChange={noop}
    />,
  );
  const DOT = "ml-1.5 inline-block size-2 rounded-full align-middle";

  it("draws an 8 px dot after the label, named for screen readers", () => {
    expect(html).toContain(
      `Cân nặng<span role="img" aria-label="có cảnh báo" class="${DOT} bg-warn"></span></button>`,
    );
    expect(html).toContain(
      `Vòng đầu<span role="img" aria-label="có cảnh báo" class="${DOT} bg-danger"></span></button>`,
    );
  });

  it("an option without a dot is drawn as before", () => {
    expect(html).toContain(">Chiều dài</button>");
    expect(html.match(/có cảnh báo/g)).toHaveLength(2);
  });
});
