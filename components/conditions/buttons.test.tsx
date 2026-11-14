import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ConditionsScreen } from "./ConditionsScreen";

describe("ConditionsScreen buttons", () => {
  it("triage and 115 stack as two full-width buttons", () => {
    const html = renderToStaticMarkup(<ConditionsScreen />);
    expect(html).toMatch(
      /<div class="flex flex-col gap-2\.5"><a [^>]*href="\/trieu-chung"/,
    );
    expect(html).toMatch(
      /class="[^"]*w-full[^"]*" href="\/trieu-chung"|href="\/trieu-chung" class="[^"]*w-full/,
    );
    expect(html).toMatch(/href="tel:115" class="[^"]*w-full/);
    expect(html).not.toContain("flex-1");
  });
});
