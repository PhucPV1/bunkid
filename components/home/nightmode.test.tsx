import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { useNightMode } from "@/lib/hooks/useTheme";

function Probe() {
  const { night, toggle } = useNightMode();
  return <span>{`${night},${typeof toggle}`}</span>;
}

describe("useNightMode", () => {
  it("starts as day on the server and exposes a toggle", () => {
    expect(renderToStaticMarkup(<Probe />)).toBe("<span>false,function</span>");
  });
});
