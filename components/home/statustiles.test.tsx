import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { StatusTile } from "@/lib/rules/status";
import { StatusTiles } from "./StatusTiles";

const tiles: StatusTile[] = [
  { label: "Cữ bú tiếp", value: "14:00", note: "còn 2g", tone: "good" },
  { label: "Bú gần nhất", value: "11:00", note: "trái · 15p", tone: "muted" },
  { label: "Tã gần nhất", value: "—", note: "chưa ghi", tone: "muted" },
];
const html = (list: StatusTile[], vitaminD: string | null = null) =>
  renderToStaticMarkup(<StatusTiles tiles={list} vitaminD={vitaminD} />);
// The class of the element whose whole content is `text`.
const classOf = (out: string, text: string) =>
  out.match(new RegExp(`class="([^"]*)">${text}</`))?.[1] ?? "";

// Spec 2026-11-19 §3.3.
describe("StatusTiles", () => {
  it("draws three glass tiles in a 3-column grid, 8 px apart", () => {
    const out = html(tiles);
    expect(out).toContain('<div class="grid grid-cols-3 gap-2">');
    expect(out.match(/class="glass rounded-\[24px\] [^"]*"/g)).toHaveLength(3);
    expect(out.match(/px-3 py-2\.5/g)).toHaveLength(3);
    const labels = [...out.matchAll(/text-muted">([^<]+)<\/span><span/g)];
    expect(labels.map((m) => m[1])).toEqual([
      "Cữ bú tiếp",
      "Bú gần nhất",
      "Tã gần nhất",
    ]);
  });

  it("sets label 12/16 muted, value 20/26 bold, note 12/16 semibold, none wrapping", () => {
    const out = html(tiles);
    expect(classOf(out, "Cữ bú tiếp")).toBe(
      "text-xs leading-4 whitespace-nowrap text-muted",
    );
    expect(classOf(out, "14:00")).toBe(
      "text-xl leading-[26px] font-bold whitespace-nowrap text-ink tabular-nums",
    );
    expect(classOf(out, "còn 2g")).toContain(
      "text-xs leading-4 font-semibold whitespace-nowrap",
    );
    expect(out.match(/whitespace-nowrap/g)).toHaveLength(9);
  });

  it("colours the note by tone", () => {
    const out = html(tiles);
    expect(classOf(out, "còn 2g")).toContain("text-good");
    expect(classOf(out, "trái · 15p")).toContain("text-muted");
    expect(out).not.toContain("text-warn");
    expect(out).not.toContain("border-warn!");
  });

  it("a late feed gets a warn note and a warn border on its tile only", () => {
    const late: StatusTile[] = [
      { label: "Cữ bú tiếp", value: "11:30", note: "trễ 30p", tone: "warn" },
      tiles[1],
      tiles[2],
    ];
    const out = html(late);
    expect(classOf(out, "trễ 30p")).toContain("text-warn");
    expect(out.match(/border-warn!/g)).toHaveLength(1);
    expect(out).toMatch(
      /class="glass [^"]*border-warn![^"]*"><span[^>]*>Cữ bú/,
    );
  });

  it("adds the Vitamin D line right under the tiles once today's dose is logged", () => {
    const out = html(tiles, "08:10");
    expect(out).toContain(
      '</div><p class="px-1 text-[13px] leading-[18px] text-muted">Vitamin D đã uống 08:10</p></div>',
    );
    expect(html(tiles, null)).not.toContain("Vitamin D");
    expect(html(tiles, null)).not.toContain("<p");
  });
});
