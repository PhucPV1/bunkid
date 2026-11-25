import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { HOLDING } from "@/lib/content/holding";
import { ICON_PATHS } from "@/lib/ui/icons";
import { HoldingScreen } from "./HoldingScreen";

describe("HoldingScreen", () => {
  it("a stage picker, one glass card per position, Xem video with a play icon", () => {
    const html = renderToStaticMarkup(<HoldingScreen ageDays={30} />);
    const stage = HOLDING.stages.find((s) => s.code === "0_3")!;
    expect(html).toContain('href="/tien-ich"');
    expect(html).toContain('aria-label="Giai đoạn"');
    const name = stage.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    expect(html).toMatch(
      new RegExp(`aria-pressed="true"[^>]*>${name}</button>`),
    );
    expect(html.match(/<section class="glass/g)).toHaveLength(
      stage.positions.length,
    );
    expect(html.match(/>Xem video</g)).toHaveLength(stage.positions.length);
    expect(html).toContain(`d="${ICON_PATHS.play}"`);
    expect(html).not.toContain('role="tablist"');
    expect(html).not.toContain("rounded-2xl border");
  });
});
