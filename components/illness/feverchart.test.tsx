import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { LogLike } from "@/lib/rules/describeLog";
import { type EpisodeLike, feverChartModel } from "@/lib/rules/illness";
import { FeverChart, FeverChartCard } from "./FeverChart";

const vn = (text: string) => new Date(`${text.replace(" ", "T")}:00+07:00`);
const iso = (text: string) => vn(text).toISOString();
const episode = (start: string): EpisodeLike => ({
  id: "ep1",
  started_at: iso(start),
  ended_at: null,
});
const temp = (time: string, celsius: number): LogLike => ({
  type: "temperature",
  started_at: iso(time),
  ended_at: iso(time),
  details: { celsius, method: "nach" },
});
const dose = (time: string): LogLike => ({
  type: "medicine",
  started_at: iso(time),
  ended_at: iso(time),
  details: { name: "Hapacol", amount: 2.5, unit: "ml", antipyretic: true },
});

const threeDays = feverChartModel(
  [
    temp("2026-11-24 23:40", 38.4),
    temp("2026-11-25 15:00", 39.2),
    temp("2026-11-26 09:00", 37.6),
    dose("2026-11-25 15:10"),
    dose("2026-11-26 02:00"),
  ],
  episode("2026-11-24 23:30"),
  vn("2026-11-26 10:00"),
)!;

// Spec 2026-11-26 §6.5.
describe("FeverChart", () => {
  const html = renderToStaticMarkup(<FeverChart chart={threeDays} />);

  it("is one image with the model's description", () => {
    expect(html).toMatch(/^<svg[^>]*role="img"/);
    expect(html).toContain(
      'aria-label="Biểu đồ nhiệt độ: 3 lần đo, cao nhất 39,2°C, 2 liều hạ sốt."',
    );
    expect(html).toContain('viewBox="0 0 330 204"');
  });

  it("draws a dot per reading on one line, the newest one larger", () => {
    expect(html.match(/<circle/g)).toHaveLength(3);
    expect(html.match(/<circle[^>]*r="4"/g)).toHaveLength(2);
    expect(html.match(/<circle[^>]*r="6.5"/g)).toHaveLength(1);
    expect(html.match(/<polyline/g)).toHaveLength(1);
    expect(html).toContain('stroke="var(--color-cat-temp)"');
  });

  it("labels the highest and the newest reading, with a halo in the card's colour", () => {
    expect(html).toMatch(/<text[^>]*data-point-label[^>]*>39,2<\/text>/);
    expect(html).toMatch(/<text[^>]*data-point-label[^>]*>37,6<\/text>/);
    expect(html.match(/data-point-label/g)).toHaveLength(2);
    expect(html).toMatch(
      /data-point-label[^>]*stroke="var\(--color-glass-solid\)"/,
    );
  });

  it("marks each dose with a diamond in the medicine colour, under the plot", () => {
    expect(html.match(/data-dose/g)).toHaveLength(2);
    expect(html).toMatch(
      /<path[^>]*data-dose[^>]*fill="var\(--color-cat-med\)"/,
    );
  });

  it("shades the fever zone, names it and dashes the 38 line", () => {
    expect(html).toMatch(/<rect[^>]*fill="var\(--color-danger\)"/);
    expect(html).toMatch(/<text[^>]*text-anchor="end"[^>]*>Sốt<\/text>/);
    expect(html).toMatch(/<line[^>]*stroke-dasharray="4 4"/);
    expect(html.match(/stroke-dasharray="4 4"/g)).toHaveLength(1);
  });

  it("names the whole degrees and the days, with a line at each day border", () => {
    for (const degree of [36, 37, 38, 39, 40])
      expect(html).toContain(`>${degree}</text>`);
    expect(html).toContain(">°C</text>");
    for (const day of ["24/11", "25/11", "Hôm nay"])
      expect(html).toContain(`>${day}</text>`);
    expect(html.match(/data-day-border/g)).toHaveLength(2);
  });

  it("uses no colour of its own", () => {
    expect(html).not.toMatch(/#[0-9a-fA-F]{3,6}\b/);
  });

  it("draws two readings and two doses logged at the same minute, each once", () => {
    const chart = feverChartModel(
      [
        temp("2026-11-25 20:00", 38.5),
        temp("2026-11-25 20:00", 39.5),
        temp("2026-11-25 22:00", 38.2),
        dose("2026-11-25 20:10"),
        dose("2026-11-25 20:10"),
      ],
      episode("2026-11-25 08:00"),
      vn("2026-11-25 23:00"),
    )!;
    const twins = renderToStaticMarkup(<FeverChart chart={chart} />);
    expect(twins.match(/<circle/g)).toHaveLength(3);
    expect(twins.match(/data-dose/g)).toHaveLength(2);
    expect(twins.match(/data-point-label/g)).toHaveLength(2);
    // No two siblings share a key (the server renderer does not report it;
    // the browser does, and may then drop or repeat one of them).
    const children: unknown[] = FeverChart({ chart }).props.children;
    for (const list of children) {
      if (!Array.isArray(list)) continue;
      const keys = list
        .filter((child) => child !== null && typeof child === "object")
        .map((child: { key: string | null }) => child.key);
      expect(new Set(keys).size).toBe(keys.length);
    }
  });

  it("a single reading has a dot and no line", () => {
    const one = renderToStaticMarkup(
      <FeverChart
        chart={feverChartModel(
          [temp("2026-11-25 12:00", 38.6)],
          episode("2026-11-25 08:00"),
          vn("2026-11-25 20:00"),
        )!}
      />,
    );
    expect(one.match(/<circle/g)).toHaveLength(1);
    expect(one).not.toContain("<polyline");
  });
});

describe("FeverChartCard", () => {
  it("titles the chart and explains its three marks", () => {
    const html = renderToStaticMarkup(<FeverChartCard chart={threeDays} />);
    expect(html).toContain(">Nhiệt độ và thuốc hạ sốt</h2>");
    expect(html).toContain("<svg");
    for (const text of ["Nhiệt độ", "Liều hạ sốt", "Từ 38°C là sốt"])
      expect(html).toContain(`${text}</span>`);
    expect(html).not.toContain("7 ngày gần nhất");
    expect(html).not.toContain("Chưa có lần đo nào");
  });

  it("says so when only the last 7 days are drawn", () => {
    const long = feverChartModel(
      [temp("2026-11-21 09:00", 38.8)],
      episode("2026-11-18 08:00"),
      vn("2026-11-27 10:00"),
    )!;
    const html = renderToStaticMarkup(<FeverChartCard chart={long} />);
    expect(html).toContain(">7 ngày gần nhất</p>");
    expect(html.indexOf("</svg>")).toBeLessThan(
      html.indexOf(">7 ngày gần nhất</p>"),
    );
  });

  it("without a reading: only the title and one sentence", () => {
    const html = renderToStaticMarkup(<FeverChartCard chart={null} />);
    expect(html).toContain(">Nhiệt độ và thuốc hạ sốt</h2>");
    expect(html).toContain(">Chưa có lần đo nào trong đợt này.</p>");
    expect(html).not.toContain("<svg");
    expect(html).not.toContain("Liều hạ sốt");
  });
});

// Spec §6.5 from M5: a band above the plot holds the word of each visit.
describe("FeverChart with visits", () => {
  const withVisits = feverChartModel(
    [temp("2026-11-25 12:00", 38.6)],
    episode("2026-11-25 08:00"),
    vn("2026-11-25 20:00"),
    [vn("2026-11-25 12:00").getTime(), vn("2026-11-25 13:00").getTime()],
  )!;
  const html = renderToStaticMarkup(<FeverChart chart={withVisits} />);

  it("is 16 units taller: the band sits above the drawing", () => {
    expect(html).toContain('viewBox="0 -16 330 220"');
  });

  it("draws a dashed line per visit and one word where it fits", () => {
    expect(html.match(/<line[^>]*data-visit/g)).toHaveLength(2);
    expect(html).toMatch(/<line[^>]*data-visit[^>]*stroke-dasharray="3 3"/);
    expect(html.match(/>Khám<\/text>/g)).toHaveLength(1);
    expect(html).toMatch(/<text[^>]*x="178"[^>]*y="-4"[^>]*>Khám<\/text>/);
  });

  it("without a visit the chart is as before", () => {
    const plain = renderToStaticMarkup(<FeverChart chart={threeDays} />);
    expect(plain).toContain('viewBox="0 0 330 204"');
    expect(plain).not.toContain("Khám");
    expect(plain).not.toMatch(/<text[^>]*stroke=[^>]*>Sốt<\/text>/);
  });

  it("where every place of the word Sốt is crossed, it has the labels' halo", () => {
    const crossed = feverChartModel(
      [temp("2026-11-25 01:00", 39.8), temp("2026-11-25 09:00", 38.6)],
      episode("2026-11-25 00:10"),
      vn("2026-11-25 23:50"),
      [vn("2026-11-25 12:00").getTime(), vn("2026-11-25 23:00").getTime()],
    )!;
    expect(renderToStaticMarkup(<FeverChart chart={crossed} />)).toMatch(
      /<text[^>]*stroke="var\(--color-glass-solid\)"[^>]*>Sốt<\/text>/,
    );
    expect(html).not.toMatch(/<text[^>]*stroke=[^>]*>Sốt<\/text>/);
  });
});
