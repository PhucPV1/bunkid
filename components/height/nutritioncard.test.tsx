import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { findElements } from "@/components/ui/testTree";
import { NUTRITION } from "@/lib/content/nutrition";
import { ICON_PATHS } from "@/lib/ui/icons";
import {
  NextStagePopup,
  NutritionCard,
  NutritionCardView,
} from "./NutritionCard";

const [FIRST, SECOND, , LAST] = NUTRITION.stages;
const view = (over: Partial<Parameters<typeof NutritionCardView>[0]> = {}) => ({
  current: FIRST,
  next: SECOND,
  sources: NUTRITION.sources,
  onOpenNext: () => {},
  ...over,
});

// Spec 2026-11-25 §7.3.
describe("NutritionCardView", () => {
  it("is titled with the stage and lists its lines, each with a green check", () => {
    const html = renderToStaticMarkup(<NutritionCardView {...view()} />);
    expect(html).toContain(">Dinh dưỡng 0–6 tháng</h2>");
    expect(html).toContain("glass");
    for (const item of FIRST.items) expect(html).toContain(`>${item}</span>`);
    expect(html.split(`d="${ICON_PATHS.check}"`)).toHaveLength(
      FIRST.items.length + 1,
    );
    expect(html).toContain("text-good");
  });

  it("the lines are not buttons; the only button opens the next stage", () => {
    const onOpenNext = vi.fn();
    const html = renderToStaticMarkup(<NutritionCardView {...view()} />);
    expect(html.match(/<button/g)).toHaveLength(1);
    expect(html).not.toContain("<a ");
    expect(html).toContain(">Giai đoạn kế: 6–12 tháng</span>");
    expect(html).toContain(`d="${ICON_PATHS.chevronRight}"`);
    const [button] = findElements(
      NutritionCardView(view({ onOpenNext })),
      (el) => el.type === "button",
    );
    (button.props.onClick as () => void)();
    expect(onOpenNext).toHaveBeenCalledOnce();
  });

  it("the last stage has no next row", () => {
    const html = renderToStaticMarkup(
      <NutritionCardView {...view({ current: LAST, next: null })} />,
    );
    expect(html).toContain(">Dinh dưỡng 2–5 tuổi</h2>");
    expect(html).not.toContain("Giai đoạn kế");
    expect(html).not.toContain("<button");
  });

  it("names the sources under the group, separated by commas", () => {
    const html = renderToStaticMarkup(<NutritionCardView {...view()} />);
    expect(html).toContain(
      ">Nguồn: WHO – Infant and young child feeding, WHO – Guideline for complementary feeding 6–23 months (2023), Viện Dinh dưỡng Quốc gia.</p>",
    );
  });
});

describe("NextStagePopup", () => {
  it("is titled with the next stage and lists its lines", () => {
    const html = renderToStaticMarkup(
      <NextStagePopup stage={SECOND} onClose={() => {}} />,
    );
    expect(html).toContain(">Dinh dưỡng 6–12 tháng</h2>");
    for (const item of SECOND.items) expect(html).toContain(`>${item}</li>`);
    expect(html).toContain(">Đã hiểu</button>");
  });
});

describe("NutritionCard", () => {
  it("draws the stage of the age, with the popup closed", () => {
    const html = renderToStaticMarkup(<NutritionCard ageDays={67} />);
    expect(html).toContain(">Dinh dưỡng 0–6 tháng</h2>");
    expect(html).toContain(">Giai đoạn kế: 6–12 tháng</span>");
    expect(html).not.toContain("<dialog");
  });

  it("past day 1856 it draws nothing", () => {
    expect(renderToStaticMarkup(<NutritionCard ageDays={1857} />)).toBe("");
  });
});
