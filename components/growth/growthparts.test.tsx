import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { findElements } from "@/components/ui/testTree";
import type { GrowthAlert } from "@/lib/rules/growthAlerts";
import type { IndicatorSummary } from "@/lib/rules/growthView";
import { ICON_PATHS } from "@/lib/ui/icons";
import { GrowthAlertCard } from "./GrowthAlertCard";
import { GrowthChartCard } from "./GrowthChartCard";
import { GrowthVerdict } from "./GrowthVerdict";
import { PositionBar, ZONE_NORMAL, ZONE_OFF } from "./PositionBar";

const summary = (over: Partial<IndicatorSummary> = {}): IndicatorSummary => ({
  indicator: "wfa",
  title: "Cân nặng",
  value: "6,1 kg",
  chip: { text: "Bình thường", tone: "good" },
  position: 52,
  compare: "Nặng hơn 55 trong 100 bé trai cùng tuổi",
  change: "+1,5 kg sau 46 ngày",
  measuredOn: "2026-11-25",
  ageDays: 76,
  near: null,
  standard: { low: "4,7 kg", mid: "giữa 6,0", high: "7,6 kg" },
  barLabel:
    "Bình thường. Nặng hơn 55 trong 100 bé trai cùng tuổi. Chuẩn từ 4,7 đến 7,6 kg, giữa 6,0.",
  nearLine: null,
  ...over,
});

const alert = (over: Partial<GrowthAlert> = {}): GrowthAlert => ({
  indicator: "wfa",
  kind: "falling",
  level: "yellow",
  title: "Cân nặng tăng chậm lại",
  body: "Bun tăng 250 g trong 46 ngày, khoảng 5 g mỗi ngày.",
  advice: "Nên hỏi bác sĩ ở lần khám tới.",
  chip: "Tăng chậm",
  measuredOn: "2026-11-25",
  previousPercentile: 45,
  ...over,
});

// Spec 2026-11-25 §5.3.
describe("PositionBar", () => {
  const html = renderToStaticMarkup(
    <PositionBar position={52} label="Bình thường. Nặng hơn 55 trong 100" />,
  );

  it("is an image named by the chip and the comparison", () => {
    expect(html).toContain(
      'role="img" aria-label="Bình thường. Nặng hơn 55 trong 100"',
    );
  });

  it("has a thin warn sixth at each end and a taller normal range between", () => {
    expect(html).toContain("flex h-2.5 items-center");
    expect(html).toContain(
      '<span class="w-[16.7%] rounded-l-full h-1.5 bg-warn/35"></span>',
    );
    expect(html).toContain(
      '<span class="flex-1 rounded-full h-2.5 bg-good/45"></span>',
    );
    expect(html).toContain(
      '<span class="w-[16.7%] rounded-r-full h-1.5 bg-warn/35"></span>',
    );
  });

  // The Ban đêm theme gives good and warn the same colour, so the two kinds
  // of zone must also differ in shape: the normal range is the taller one.
  it("the zones differ in height, not only in colour", () => {
    const height = (zone: string) => Number(/\bh-([\d.]+)/.exec(zone)?.[1]);
    expect(height(ZONE_NORMAL)).toBe(2.5);
    expect(height(ZONE_OFF)).toBe(1.5);
  });

  it("puts the 20 px dot at the position", () => {
    expect(html).toContain("size-5");
    expect(html).toContain("border-glass-solid bg-ink");
    expect(html).toContain('style="left:52%"');
  });
});

describe("GrowthVerdict", () => {
  const render = (calm: boolean, summaries = [summary()]) =>
    renderToStaticMarkup(
      <GrowthVerdict
        babyName="Bun"
        measured="Đo gần nhất 25/11 · 2 tháng 15 ngày"
        calm={calm}
        summaries={summaries}
      />,
    );

  it("with no alert: a check, the calm heading and the day of the newest measurement", () => {
    const html = render(true);
    expect(html).toContain(">Bun đang lớn đều</h2>");
    expect(html).toContain("bg-good-soft text-good-ink");
    expect(html).toContain(`d="${ICON_PATHS.check}"`);
    expect(html).toContain(">Đo gần nhất 25/11 · 2 tháng 15 ngày</span>");
  });

  it("with an alert: only the day line, no heading and no check", () => {
    const html = render(false);
    expect(html).not.toContain("đang lớn đều");
    expect(html).not.toContain(ICON_PATHS.check);
    expect(html).toContain(">Đo gần nhất 25/11 · 2 tháng 15 ngày</span>");
  });

  it("each indicator: its name, value, chip, bar and the comparison with the change", () => {
    const html = render(true, [
      summary(),
      summary({
        indicator: "lhfa",
        title: "Chiều dài",
        value: "61,5 cm",
        chip: { text: "Tăng chậm", tone: "warn" },
        position: 28,
        compare: "Dài hơn 9 trong 100 bé trai cùng tuổi",
        change: "trước đó là 45 trong 100",
      }),
    ]);
    expect(html).toContain(">Cân nặng</span>");
    expect(html).toContain(">6,1 kg</span>");
    expect(html).toContain('bg-good-soft text-good-ink">Bình thường</span>');
    expect(html).toContain(
      ">Nặng hơn 55 trong 100 bé trai cùng tuổi · +1,5 kg sau 46 ngày</span>",
    );
    expect(html).toContain('bg-warn-soft text-warn-ink">Tăng chậm</span>');
    expect(html).toContain(
      'aria-label="Tăng chậm. Dài hơn 9 trong 100 bé trai cùng tuổi"',
    );
    expect(html).toContain('style="left:28%"');
    expect(html).toContain(
      ">Dài hơn 9 trong 100 bé trai cùng tuổi · trước đó là 45 trong 100</span>",
    );
    expect(html.match(/role="img"/g)).toHaveLength(2);
  });

  it("without an earlier measurement the comparison stands alone", () => {
    expect(render(true, [summary({ change: null })])).toContain(
      ">Nặng hơn 55 trong 100 bé trai cùng tuổi</span>",
    );
  });

  it("ends with the legend of the two bar zones, drawn as the bar draws them", () => {
    const html = render(true);
    expect(html.indexOf("Thấp hoặc cao hơn chuẩn")).toBeGreaterThan(
      html.indexOf("+1,5 kg sau 46 ngày"),
    );
    expect(html).toContain("border-t border-line");
    expect(html).toContain(
      `<span class="w-3.5 rounded-full ${ZONE_NORMAL}"></span>Bình thường`,
    );
    expect(html).toContain(
      `<span class="w-3.5 rounded-full ${ZONE_OFF}"></span>Thấp hoặc cao hơn chuẩn`,
    );
  });
});

describe("GrowthAlertCard", () => {
  it("yellow: warn colours, the alert icon, title, body, bold advice", () => {
    const html = renderToStaticMarkup(
      <GrowthAlertCard alert={alert()} onWhy={() => {}} />,
    );
    expect(html).toContain("border-warn/35 bg-warn-soft text-warn-ink");
    expect(html).toContain("rounded-full bg-warn text-bg");
    expect(html).toContain(`d="${ICON_PATHS.alert}"`);
    expect(html).toContain(">Cân nặng tăng chậm lại</h2>");
    expect(html).toContain(
      ">Bun tăng 250 g trong 46 ngày, khoảng 5 g mỗi ngày.</p>",
    );
    expect(html).toContain(
      '<p class="text-[15px] leading-5 font-bold">Nên hỏi bác sĩ ở lần khám tới.</p>',
    );
    expect(html).not.toContain("danger");
  });

  it("red: danger colours", () => {
    const html = renderToStaticMarkup(
      <GrowthAlertCard
        alert={alert({ level: "red", kind: "veryLow" })}
        onWhy={() => {}}
      />,
    );
    expect(html).toContain("border-danger/35 bg-danger-soft text-danger-ink");
    expect(html).toContain("rounded-full bg-danger-solid text-on-danger");
    expect(html).not.toContain("warn");
  });

  it("links to the doctor report and asks why, both 44 px tall", () => {
    const onWhy = vi.fn();
    const card = <GrowthAlertCard alert={alert()} onWhy={onWhy} />;
    const html = renderToStaticMarkup(card);
    expect(html).toContain('href="/bao-cao"');
    expect(html).toContain(">Báo cáo cho bác sĩ</a>");
    expect(html.match(/min-h-11/g)).toHaveLength(2);
    const [why] = findElements(
      GrowthAlertCard({ alert: alert(), onWhy }),
      (el) => el.type === "button",
    );
    expect(why.props.children).toBe("Vì sao có cảnh báo này?");
    (why.props.onClick as () => void)();
    expect(onWhy).toHaveBeenCalledOnce();
  });
});

// Spec 2026-11-25 §5.4: what surrounds the lazily loaded chart.
describe("GrowthChartCard", () => {
  const render = (alertTone: "warn" | "danger" | null, shifted = false) =>
    renderToStaticMarkup(
      <GrowthChartCard
        title="Cân nặng theo tháng tuổi"
        babyName="Bun"
        alertTone={alertTone}
        shifted={shifted}
      >
        <div data-chart="" />
      </GrowthChartCard>,
    );

  it("a glass card: the title, the chart, the legend, the source line", () => {
    const html = render(null);
    const order = [
      ">Cân nặng theo tháng tuổi</h2>",
      "data-chart",
      ">Bun</span>",
      ">Vùng bình thường</span>",
      ">Mức giữa</span>",
      "95 trong 100 bé khỏe mạnh nằm trong vùng xanh. Nguồn: WHO Child Growth Standards.",
    ].map((mark) => html.indexOf(mark));
    expect(order.every((i) => i >= 0)).toBe(true);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
    expect(html).toContain("glass");
    expect(html).not.toContain("Lần đo có cảnh báo");
    expect(html).not.toContain("hướng đi");
  });

  it("with an alert the legend names the coloured dot", () => {
    expect(render("warn")).toContain(
      '<span class="size-2.5 rounded-full bg-warn"></span>Lần đo có cảnh báo',
    );
    expect(render("danger")).toContain(
      '<span class="size-2.5 rounded-full bg-danger"></span>Lần đo có cảnh báo',
    );
  });

  it("a falling or rising alert adds the sentence about direction", () => {
    expect(render("warn", true)).toContain(
      "Nguồn: WHO Child Growth Standards. App cảnh báo theo hướng đi của bé, không chỉ theo vị trí.</p>",
    );
  });
});
