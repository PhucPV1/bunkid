import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { findElements } from "@/components/ui/testTree";
import type { GrowthAlert } from "@/lib/rules/growthAlerts";
import type { IndicatorSummary, VerdictHead } from "@/lib/rules/growthView";
import { ICON_PATHS } from "@/lib/ui/icons";
import { GrowthAlertCard } from "./GrowthAlertCard";
import { GrowthChartCard } from "./GrowthChartCard";
import { GrowthVerdict } from "./GrowthVerdict";
import {
  PositionBar,
  StandardLabels,
  ZONE_NORMAL,
  ZONE_OFF,
} from "./PositionBar";

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

// Spec 2026-11-25 §5.6: the norm in numbers, under the bar.
describe("StandardLabels", () => {
  const standard = { low: "56,0 cm", mid: "giữa 60,0", high: "64,0 cm" };
  const LABEL = "absolute -translate-x-1/2 whitespace-nowrap";
  const render = (near: "nearLow" | "nearHigh" | null) =>
    renderToStaticMarkup(<StandardLabels standard={standard} near={near} />);

  it("a 16 px row of small muted labels, hidden from screen readers: the bar's own label says the numbers", () => {
    expect(render(null)).toContain(
      '<span aria-hidden="true" class="relative block h-4 text-xs leading-4 text-muted tabular-nums">',
    );
  });

  it("each label is centred on its point of the bar: the two edges of the norm and the middle", () => {
    const html = render(null);
    expect(html).toContain(
      `<span class="${LABEL} left-[16.7%]">56,0 cm</span>`,
    );
    expect(html).toContain(`<span class="${LABEL} left-1/2">giữa 60,0</span>`);
    expect(html).toContain(
      `<span class="${LABEL} left-[83.3%]">64,0 cm</span>`,
    );
    expect(html).not.toContain("font-bold");
  });

  it("near the low edge: the lowest value of the norm in bold warn", () => {
    const html = render("nearLow");
    expect(html).toContain(
      `<span class="${LABEL} left-[16.7%] font-bold text-warn">56,0 cm</span>`,
    );
    expect(html.match(/font-bold/g)).toHaveLength(1);
  });

  it("near the high edge: the highest value of the norm in bold warn", () => {
    const html = render("nearHigh");
    expect(html).toContain(
      `<span class="${LABEL} left-[83.3%] font-bold text-warn">64,0 cm</span>`,
    );
    expect(html.match(/font-bold/g)).toHaveLength(1);
  });
});

describe("GrowthVerdict", () => {
  const CALM: VerdictHead = { heading: "Bun đang lớn đều", note: null };
  const ALERT: VerdictHead = { heading: null, note: null };
  const REST = "Bé vẫn trong vùng bình thường; nên theo dõi ở các lần đo tới.";
  const NOTE =
    '<p class="rounded-2xl bg-warn-soft px-3 py-2.5 text-sm leading-5 text-warn-ink">';
  const render = (head: VerdictHead, summaries = [summary()]) =>
    renderToStaticMarkup(
      <GrowthVerdict
        head={head}
        measured="Đo gần nhất 25/11 · 2 tháng 15 ngày"
        summaries={summaries}
      />,
    );
  const nearLength = summary({
    indicator: "lhfa",
    title: "Chiều dài",
    value: "56,9 cm",
    chip: { text: "Gần mức thấp", tone: "warn" },
    position: 24.5,
    compare: "Dài hơn 6 trong 100 bé trai cùng tuổi",
    change: "+1,9 cm sau 10 ngày",
    near: "nearLow",
    standard: { low: "56,0 cm", mid: "giữa 60,0", high: "64,0 cm" },
    barLabel:
      "Gần mức thấp. Dài hơn 6 trong 100 bé trai cùng tuổi. Chuẩn từ 56,0 đến 64,0 cm, giữa 60,0.",
    nearLine: "Cách mức thấp nhất của chuẩn 0,9 cm",
  });

  it("with no alert: a check, the calm heading and the day of the newest measurement", () => {
    const html = render(CALM);
    expect(html).toContain(">Bun đang lớn đều</h2>");
    expect(html).toContain("bg-good-soft text-good-ink");
    expect(html).toContain(`d="${ICON_PATHS.check}"`);
    expect(html).toContain(">Đo gần nhất 25/11 · 2 tháng 15 ngày</span>");
  });

  it("with an alert: only the day line, no heading and no check", () => {
    const html = render(ALERT);
    expect(html).not.toContain("<h2");
    expect(html).not.toContain(ICON_PATHS.check);
    expect(html).toContain(">Đo gần nhất 25/11 · 2 tháng 15 ngày</span>");
  });

  it("each indicator: its name, value, chip, bar and the comparison with the change", () => {
    const html = render(CALM, [
      summary(),
      summary({
        indicator: "lhfa",
        title: "Chiều dài",
        value: "61,5 cm",
        chip: { text: "Tăng chậm", tone: "warn" },
        position: 28,
        compare: "Dài hơn 9 trong 100 bé trai cùng tuổi",
        change: "trước đó là 45 trong 100",
        barLabel:
          "Tăng chậm. Dài hơn 9 trong 100 bé trai cùng tuổi. Chuẩn từ 56,0 đến 64,0 cm, giữa 60,0.",
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
      'aria-label="Tăng chậm. Dài hơn 9 trong 100 bé trai cùng tuổi. Chuẩn từ 56,0 đến 64,0 cm, giữa 60,0."',
    );
    expect(html).toContain('style="left:28%"');
    expect(html).toContain(
      ">Dài hơn 9 trong 100 bé trai cùng tuổi · trước đó là 45 trong 100</span>",
    );
    expect(html.match(/role="img"/g)).toHaveLength(2);
  });

  it("without an earlier measurement the comparison stands alone", () => {
    expect(render(CALM, [summary({ change: null })])).toContain(
      ">Nặng hơn 55 trong 100 bé trai cùng tuổi</span>",
    );
  });

  // Spec 2026-11-25 §5.6.
  it("under every bar: the norm in three labels, with or without an alert", () => {
    const html = render(ALERT, [summary(), nearLength]);
    expect(
      html.match(/aria-hidden="true" class="relative block h-4/g),
    ).toHaveLength(2);
    for (const text of ["4,7 kg", "giữa 6,0", "7,6 kg", "56,0 cm", "giữa 60,0"])
      expect(html).toContain(`>${text}</span>`);
    // The labels come right after their bar.
    expect(html.indexOf(">4,7 kg<")).toBeGreaterThan(
      html.indexOf('style="left:52%"'),
    );
    expect(html.indexOf(">4,7 kg<")).toBeLessThan(
      html.indexOf(">Nặng hơn 55 trong 100"),
    );
  });

  it("an indicator near the edge: its edge label in bold, and the distance between the labels and the comparison", () => {
    const html = render(CALM, [summary(), nearLength]);
    expect(html).toContain('font-bold text-warn">56,0 cm</span>');
    const line =
      '<span class="text-[13px] leading-[18px] font-semibold text-warn">Cách mức thấp nhất của chuẩn 0,9 cm</span>';
    expect(html).toContain(line);
    expect(html.indexOf(line)).toBeGreaterThan(html.indexOf(">64,0 cm<"));
    expect(html.indexOf(line)).toBeLessThan(
      html.indexOf(
        ">Dài hơn 6 trong 100 bé trai cùng tuổi · +1,9 cm sau 10 ngày<",
      ),
    );
    // The indicator that is not near has no such line.
    expect(html.match(/font-semibold text-warn"/g)).toHaveLength(1);
  });

  it("something near and no alert: still a check, a heading that says normal, then the note", () => {
    const html = render(
      {
        heading: "Bun phát triển bình thường",
        note: {
          strong: ["Chiều dài đang gần mức thấp của chuẩn."],
          rest: REST,
        },
      },
      [summary(), nearLength],
    );
    expect(html).toContain(">Bun phát triển bình thường</h2>");
    expect(html).toContain(`d="${ICON_PATHS.check}"`);
    const note = `${NOTE}<strong class="font-bold">Chiều dài đang gần mức thấp của chuẩn.</strong> ${REST}</p>`;
    expect(html).toContain(note);
    expect(html.indexOf(note)).toBeGreaterThan(html.indexOf("</h2>"));
    expect(html.indexOf(note)).toBeLessThan(html.indexOf(">Cân nặng</span>"));
  });

  it("near both edges: a bold sentence for each, then the advice once", () => {
    const html = render({
      heading: "Bun phát triển bình thường",
      note: {
        strong: [
          "Chiều dài đang gần mức thấp của chuẩn.",
          "Cân nặng đang gần mức cao của chuẩn.",
        ],
        rest: REST,
      },
    });
    expect(html).toContain(
      `${NOTE}<strong class="font-bold">Chiều dài đang gần mức thấp của chuẩn.</strong> <strong class="font-bold">Cân nặng đang gần mức cao của chuẩn.</strong> ${REST}</p>`,
    );
  });

  it("an alert on one indicator, another near the edge: no heading, the note under the day line", () => {
    const html = render(
      {
        heading: null,
        note: {
          strong: ["Chiều dài đang gần mức thấp của chuẩn."],
          rest: REST,
        },
      },
      [summary({ chip: { text: "Thấp", tone: "warn" } }), nearLength],
    );
    expect(html).not.toContain("<h2");
    expect(html.indexOf(NOTE)).toBeGreaterThan(
      html.indexOf(">Đo gần nhất 25/11 · 2 tháng 15 ngày</span>"),
    );
    expect(html.indexOf(NOTE)).toBeLessThan(html.indexOf(">Cân nặng</span>"));
  });

  it("nothing near: no note", () => {
    expect(render(CALM)).not.toContain(NOTE);
    expect(render(ALERT)).not.toContain(NOTE);
  });

  it("ends with the legend of the two bar zones, drawn as the bar draws them", () => {
    const html = render(CALM);
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
