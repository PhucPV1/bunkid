import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { CONDITIONS } from "@/lib/content/conditions";
import { ICON_PATHS } from "@/lib/ui/icons";
import { ConditionsScreen } from "./ConditionsScreen";

describe("ConditionsScreen", () => {
  it("a header back to Sức khỏe, triage and 115 buttons, and one glass article per condition", () => {
    const html = renderToStaticMarkup(<ConditionsScreen />);
    expect(html).toContain('href="/suc-khoe"');
    expect(html).toContain(`>${CONDITIONS.title}</h1>`);
    expect(html).toContain('href="/trieu-chung"');
    expect(html).toContain('href="tel:115"');
    expect(html).toContain("bg-danger-solid");
    expect(html.match(/<details[^>]*class="group glass/g)).toHaveLength(
      CONDITIONS.articles.length,
    );
    expect(html).toContain(`d="${ICON_PATHS.chevronRight}"`);
    expect(html).toContain(">Khi nào đi khám ngay</h3>");
    expect(html).not.toContain("rounded-2xl border");
    expect(html).not.toContain("bg-alarm");
  });
});
