import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { findElements } from "@/components/ui/testTree";
import type { VaccineGroup } from "@/lib/content/vaccineSchema";
import type { ScheduleItem } from "@/lib/rules/vaccines";
import { ICON_PATHS } from "@/lib/ui/icons";
import { DoseGrid } from "./DoseGrid";

const item = (
  code: string,
  doseNo: number,
  state: string,
  over: Record<string, unknown> = {},
) =>
  ({
    dose: {
      code,
      doseNo,
      name: `${code.toUpperCase()} mũi ${doseNo}`,
      protects: ["X"],
      program: "tcmr",
      ...(over.dose as object),
    },
    due: "2026-10-29",
    state,
    record: null,
    unchosen: false,
    pastMaxAge: false,
    ...over,
  }) as unknown as ScheduleItem;

const groups: VaccineGroup[] = [
  {
    code: "rota",
    name: "Tiêu chảy do Rota",
    series: [{ code: "rotarix", name: "Rotarix", program: "dich_vu" }],
  },
];

const doneBcg = item("bcg", 1, "done", {
  record: {
    vaccine_code: "bcg",
    dose_no: 1,
    status: "done",
    given_on: "2026-09-20",
    due_on_override: null,
  },
});
const rota = item("rotarix", 1, "later", {
  unchosen: true,
  dose: { group: "rota", series: "rotarix" },
});
const items = [
  doneBcg,
  item("pcv", 1, "overdue"),
  rota,
  item("pcv", 2, "upcoming"),
  item("pcv", 4, "later"),
];

const render = (
  list: ScheduleItem[],
  over: { pending?: Set<string>; onChoose?: () => void } = {},
) =>
  renderToStaticMarkup(
    <DoseGrid
      items={list}
      groups={groups}
      pending={over.pending ?? new Set()}
      onOpen={() => {}}
      onChoose={over.onChoose}
    />,
  );

const cell = (html: string, name: string) => {
  const at = html.indexOf(`aria-label="${name}`);
  expect(at, name).toBeGreaterThan(-1);
  const start = html.lastIndexOf("<button", at);
  return html.slice(start, html.indexOf("</button>", at) + 9);
};

// Spec 2026-11-19 §7.2.
describe("DoseGrid", () => {
  it("a real table in a glass shell that scrolls sideways, no glass inside it", () => {
    const html = render(items);
    expect(html).toMatch(
      /^<div[^>]*><div class="glass [^"]*\brelative\b[^"]*\boverflow-hidden\b[^"]*\brounded-\[22px\]/,
    );
    expect(html).toMatch(/<div class="overflow-x-auto"><table/);
    expect(html.match(/(?:class="|\s)glass(?=[\s"])/g)).toHaveLength(1);
  });

  it("header: Vắc xin, then Mũi 1 … Mũi {columns}", () => {
    const html = render(items);
    const head = html.slice(html.indexOf("<thead"), html.indexOf("</thead>"));
    const titles = [...head.matchAll(/<th[^>]*>([^<]*)<\/th>/g)].map(
      (m) => m[1],
    );
    expect(titles).toEqual(["Vắc xin", "Mũi 1", "Mũi 2", "Mũi 3", "Mũi 4"]);
    expect(head).toMatch(
      /<th scope="col" class="sticky left-0 [^"]*\bbg-glass-solid\b[^"]*\bw-\[108px\][^"]*\btext-\[13px\] leading-\[18px\] font-semibold text-muted\b/,
    );
    expect(head).toMatch(
      /<th scope="col" class="[^"]*\bw-\[78px\][^"]*">Mũi 1<\/th>/,
    );
  });

  it("row labels stick to the left on solid glass, at most three lines", () => {
    const html = render(items);
    expect(html).toMatch(
      /<th scope="row" class="sticky left-0 [^"]*\bbg-glass-solid\b[^"]*\bw-\[108px\][^"]*"><span class="line-clamp-3 text-\[13px\] leading-\[18px\] font-medium text-ink">BCG<\/span><\/th>/,
    );
    expect(html).toContain(">PCV</span></th>");
  });

  it("a done cell: green, check icon, the day it was given", () => {
    const html = cell(render(items), "BCG mũi 1:");
    expect(html).toContain('aria-label="BCG mũi 1: Đã tiêm 20/09/2026"');
    expect(html).toMatch(
      /^<button type="button" [^>]*class="[^"]*\bw-\[70px\] min-h-14\b[^"]*\brounded-\[14px\][^"]*\bbg-good-soft text-good-ink"/,
    );
    expect(html).toContain(`d="${ICON_PATHS.check}"`);
    expect(html).toContain('width="12"');
    expect(html).toMatch(/font-semibold[^"]*">.*Đã tiêm<\/span>/);
    expect(html).toContain(
      '<span class="text-[12px] leading-4 tabular-nums">20/09/2026</span>',
    );
  });

  it("a done cell with no date: one line", () => {
    const html = render([item("bcg", 1, "done")]);
    expect(html).toContain('aria-label="BCG mũi 1: Đã tiêm"');
    expect(html).not.toContain("tabular-nums");
  });

  it("each case gets its tone", () => {
    const html = render([
      item("a", 1, "skipped"),
      item("b", 1, "overdue", { pastMaxAge: true }),
      item("c", 1, "overdue"),
      item("d", 1, "upcoming"),
      item("e", 1, "later"),
    ]);
    expect(cell(html, "A mũi 1:")).toMatch(/bg-muted\/10 text-muted"/);
    expect(cell(html, "A mũi 1:")).toContain('aria-label="A mũi 1: Bỏ qua"');
    expect(cell(html, "B mũi 1:")).toContain(
      'aria-label="B mũi 1: Quá tuổi 29/10/2026"',
    );
    expect(cell(html, "B mũi 1:")).toMatch(/bg-danger-soft text-danger-ink"/);
    expect(cell(html, "C mũi 1:")).toContain(
      'aria-label="C mũi 1: Trễ hẹn 29/10/2026"',
    );
    expect(cell(html, "C mũi 1:")).toMatch(/bg-danger-soft text-danger-ink"/);
    expect(cell(html, "D mũi 1:")).toMatch(/bg-warn-soft text-warn-ink"/);
    expect(cell(html, "D mũi 1:")).toContain(">Sắp tới");
    expect(cell(html, "E mũi 1:")).toMatch(/bg-muted\/10 text-ink"/);
    expect(cell(html, "E mũi 1:")).toContain(">Chưa tiêm");
    expect(html).not.toContain(`d="${ICON_PATHS.check}"`);
  });

  it("a cell with no dose stays empty", () => {
    const html = render(items);
    const pcv = html.slice(html.indexOf(">PCV</span>"));
    const row = pcv.slice(0, pcv.indexOf("</tr>"));
    expect(row.match(/<td/g)).toHaveLength(4);
    expect(row.match(/<button/g)).toHaveLength(3);
    expect(row).toMatch(/<td class="[^"]*"><\/td>/);
  });

  it("a pending dose carries the pending mark", () => {
    const html = render(items, { pending: new Set(["pcv#2"]) });
    expect(html.match(/aria-label="Chờ đồng bộ"/g)).toHaveLength(1);
    expect(cell(html, "PCV mũi 2:")).toContain('aria-label="Chờ đồng bộ"');
  });

  it("unchosen group, owner: a dashed button across the dose columns", () => {
    const html = render(items, { onChoose: () => {} });
    expect(html).toContain(">Tiêu chảy do Rota</span></th>");
    expect(html).toMatch(
      /<td colSpan="4" [^>]*><button type="button" class="[^"]*\bmin-h-14\b[^"]*\brounded-\[14px\] border border-dashed border-muted\b[^"]*\btext-\[13px\][^"]*\bfont-semibold\b[^"]*"><span class="sticky left-\[124px\] flex items-center gap-1">Chưa chọn loại<svg/,
    );
    expect(html).toContain(`d="${ICON_PATHS.chevronRight}"`);
    expect(html).not.toContain("Rotarix");
  });

  it("unchosen group, not the owner: plain muted text", () => {
    const html = render(items);
    const row = html.slice(html.indexOf(">Tiêu chảy do Rota</span>"));
    const td = row.slice(row.indexOf("<td"), row.indexOf("</td>"));
    expect(td).toContain('colSpan="4"');
    expect(td).not.toContain("<button");
    expect(td).toMatch(
      /class="[^"]*\bpx-3\b[^"]*\btext-muted\b[^"]*"><span class="sticky left-\[124px\] inline-block">Chưa chọn loại</,
    );
    expect(html).not.toContain(ICON_PATHS.chevronRight);
  });

  it("a right fade only with more than three dose columns", () => {
    const fade = /bg-linear-to-l from-glass-solid/;
    expect(render(items)).toMatch(fade);
    expect(render(items)).toMatch(/aria-hidden="true" class="[^"]*\bw-6\b/);
    expect(render(items.slice(0, 4))).not.toMatch(fade);
  });

  it("with the fade, the table ends in 20 px of room so the last column clears it", () => {
    expect(render(items)).toMatch(/<table class="[^"]*\bpr-5\b/);
    expect(render(items.slice(0, 4))).not.toMatch(
      /<table class="[^"]*\bpr-5\b/,
    );
  });

  it("the unchosen button starts its text next to the label column", () => {
    const html = render(items, { onChoose: () => {} });
    const button =
      /<td colSpan="4" [^>]*><button type="button" class="([^"]*)"/.exec(
        html,
      )?.[1];
    expect(button).toContain("justify-start");
    expect(button).not.toContain("justify-center");
  });

  it("the unchosen text sticks right after the label column while the table scrolls", () => {
    // 108 px label column + 4 px cell padding + 12 px inside the box.
    const sticky = /<span class="sticky left-\[124px\] [^"]*">Chưa chọn loại/g;
    expect(render(items, { onChoose: () => {} }).match(sticky)).toHaveLength(1);
    expect(render(items).match(sticky)).toHaveLength(1);
    const button =
      /<td colSpan="4" [^>]*><button type="button" class="([^"]*)"/.exec(
        render(items, { onChoose: () => {} }),
      )?.[1];
    expect(button).toMatch(/\bpx-3\b/);
  });

  it("a legend of four under the table", () => {
    const html = render(items);
    const legend = html.slice(html.indexOf("</table>"));
    expect(legend).toMatch(
      /<ul class="[^"]*\btext-\[12px\][^"]*\btext-muted\b/,
    );
    const entries = [
      ...legend.matchAll(
        /<li[^>]*><span aria-hidden="true" class="size-2\.5 rounded-\[3px\] ([^"]+)"><\/span>([^<]+)<\/li>/g,
      ),
    ].map((m) => [m[1], m[2]]);
    expect(entries).toEqual([
      ["bg-good-soft", "Đã tiêm"],
      ["bg-danger-soft", "Trễ hẹn"],
      ["bg-warn-soft", "Sắp tới"],
      ["bg-muted/10", "Chưa tiêm"],
    ]);
  });

  it("opens the tapped dose; the unchosen button calls onChoose", () => {
    const onOpen = vi.fn();
    const onChoose = vi.fn();
    const buttons = findElements(
      DoseGrid({ items, groups, pending: new Set(), onOpen, onChoose }),
      (el) => el.type === "button",
    );
    expect(buttons).toHaveLength(5);
    (buttons[1].props.onClick as () => void)();
    expect(onOpen).toHaveBeenCalledExactlyOnceWith(items[1]);
    (buttons[4].props.onClick as () => void)();
    expect(onChoose).toHaveBeenCalledOnce();
  });
});
