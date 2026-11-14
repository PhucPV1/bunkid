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
});
