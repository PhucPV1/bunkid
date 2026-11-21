import type { ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  Bar,
  BarChart,
  type BarShapeProps,
  Rectangle,
  ReferenceArea,
  ReferenceLine,
  YAxis,
} from "recharts";
import { describe, expect, it } from "vitest";
import { findElements, type TreeProps } from "@/components/ui/testTree";
import { StatsChart } from "./StatsChart";

type Props = Parameters<typeof StatsChart>[0];

const rows = [
  { label: "12", primary: 13.5, secondary: null },
  { label: "13", primary: 15.2, secondary: null },
  { label: "14", primary: 6, secondary: null },
];
const props = (over: Partial<Props> = {}): Props => ({
  rows,
  unit: "giờ",
  norm: null,
  primaryName: "Giờ ngủ",
  secondaryName: null,
  decimals: true,
  color: "var(--color-cat-sleep)",
  secondaryColor: null,
  ...over,
});
const diaper = props({
  rows: rows.map((row, i) => ({ ...row, primary: 5 + i, secondary: i })),
  unit: "tã",
  primaryName: "Tã ướt",
  secondaryName: "Tã bẩn",
  decimals: false,
  color: "var(--color-cat-diaper)",
  secondaryColor: "var(--color-muted)",
});
const BAND = { min: 14, max: 17 };
const LINE = { min: 8 };

// ResponsiveContainer draws nothing without a measured size, so these tests
// read the elements StatsChart returns instead of the rendered chart.
const parts = (p: Props, type: unknown) =>
  findElements(StatsChart(p), (el) => el.type === type);
// What recharts would draw for row `row` of this <Bar>; `index` is its place
// among the bars that are drawn.
const drawn = (bar: ReactElement<TreeProps>, row: number, index = row) =>
  (bar.props.shape as (bar: BarShapeProps) => ReactElement<TreeProps>)({
    x: 10,
    y: 20,
    width: 30,
    height: 40,
    fill: bar.props.fill,
    originalDataIndex: row,
    index,
  } as BarShapeProps);

// Spec 2026-11-19 §8.
describe("StatsChart", () => {
  it("writes the unit as a 12 px muted caption in the chart's top-left corner", () => {
    const html = renderToStaticMarkup(<StatsChart {...props()} />);
    expect(html).toMatch(
      /^<div class="relative h-60 w-full"><p class="absolute top-0 left-0 text-\[12px\] leading-4 text-muted">giờ<\/p>/,
    );
    expect(renderToStaticMarkup(<StatsChart {...diaper} />)).toContain(
      'text-muted">tã</p>',
    );
    // The chart leaves its top 24 px to the caption.
    const [chart] = parts(props(), BarChart);
    expect(chart.props.margin).toMatchObject({ top: 24 });
  });

  it("shades the norm from min to max when it has a max", () => {
    const areas = parts(props({ norm: BAND }), ReferenceArea);
    expect(areas).toHaveLength(1);
    expect(areas[0].props).toMatchObject({
      y1: 14,
      y2: 17,
      fill: "var(--color-good)",
      fillOpacity: 0.12,
    });
    expect(areas[0].props.x1).toBeUndefined();
    expect(areas[0].props.x2).toBeUndefined();
    expect(parts(props({ norm: BAND }), ReferenceLine)).toHaveLength(0);
    expect(parts(props({ norm: null }), ReferenceArea)).toHaveLength(0);
  });

  it("draws a dashed line at the minimum when the norm has no max", () => {
    const lines = parts(props({ norm: LINE }), ReferenceLine);
    expect(lines).toHaveLength(1);
    expect(lines[0].props).toMatchObject({
      y: 8,
      stroke: "var(--color-good)",
      strokeDasharray: "4 3",
    });
    expect(parts(props({ norm: LINE }), ReferenceArea)).toHaveLength(0);
    expect(parts(props({ norm: null }), ReferenceLine)).toHaveLength(0);
  });

  it("makes the Y axis reach the band or the line", () => {
    // recharts stretches an automatic domain to a reference element that asks
    // for it, and only when the axis has no fixed domain of its own.
    const overflow = (p: Props, type: unknown) =>
      parts(p, type).map((el) => el.props.ifOverflow);
    expect(overflow(props({ norm: BAND }), ReferenceArea)).toEqual([
      "extendDomain",
    ]);
    expect(overflow(props({ norm: LINE }), ReferenceLine)).toEqual([
      "extendDomain",
    ]);
    const [axis] = parts(props({ norm: BAND }), YAxis);
    expect(axis.props.domain).toBeUndefined();
    expect(axis.props.allowDataOverflow).toBeUndefined();
  });

  it("draws today's bar, the last row, at 0.45 opacity and the others in full", () => {
    const [bar] = parts(props(), Bar);
    expect(rows.map((_, i) => drawn(bar, i).props.fillOpacity)).toEqual([
      1, 1, 0.45,
    ]);
    const today = drawn(bar, 2);
    expect(today.type).toBe(Rectangle);
    expect(today.props).toMatchObject({
      x: 10,
      y: 20,
      width: 30,
      height: 40,
      fill: "var(--color-cat-sleep)",
    });
    // Today is found by its row, also when recharts skipped a bar before it.
    expect(drawn(bar, 2, 1).props.fillOpacity).toBe(0.45);
    expect(drawn(bar, 1, 2).props.fillOpacity).toBe(1);
  });

  it("fades both of today's bars on the diaper tab", () => {
    const bars = parts(diaper, Bar);
    expect(bars.map((bar) => bar.props.fill)).toEqual([
      "var(--color-cat-diaper)",
      "var(--color-muted)",
    ]);
    for (const bar of bars)
      expect(rows.map((_, i) => drawn(bar, i).props.fillOpacity)).toEqual([
        1, 1, 0.45,
      ]);
  });
});
