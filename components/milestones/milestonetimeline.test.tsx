import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { findElements } from "@/components/ui/testTree";
import { MILESTONES } from "@/lib/content/milestones";
import { timelineSteps } from "@/lib/rules/milestones";
import type { MilestoneRow } from "@/lib/supabase/rows";
import { ICON_PATHS } from "@/lib/ui/icons";
import { MilestoneTimeline } from "./MilestoneTimeline";

const groups = MILESTONES.groups;
const codesOf = (months: number) =>
  groups.find((g) => g.months === months)!.items.map((i) => i.code);
const row = (code: string) =>
  ({
    id: `r-${code}`,
    baby_id: "b1",
    milestone_code: code,
    achieved_on: "2026-11-12",
    note: null,
    photo_id: null,
    created_by: "u1",
    created_at: "2026-11-12T00:00:00.000Z",
  }) as MilestoneRow;

// Bun at 5 months: 10 of the 11 two-month items and the first four-month item.
const achieved = [...codesOf(2).slice(0, -1), codesOf(4)[0]];
const byCode = new Map(achieved.map((c) => [c, row(c)]));

const props = (
  over: Partial<Parameters<typeof MilestoneTimeline>[0]> = {},
) => ({
  steps: timelineSteps(groups, 5, new Set(achieved), true, "Bun"),
  openMonths: 4 as number | null,
  domains: MILESTONES.domains,
  byCode,
  pending: new Set<string>(),
  canEdit: () => true,
  onToggle: () => {},
  onOpenItem: () => {},
  ...over,
});

describe("MilestoneTimeline (spec 2026-11-27 §4.3)", () => {
  it("lists all eight month groups, only the open one expanded", () => {
    const html = renderToStaticMarkup(<MilestoneTimeline {...props()} />);
    expect(html.match(/<li class="flex gap-3">/g)).toHaveLength(8);
    expect(html.match(/aria-expanded="true"/g)).toHaveLength(1);
    expect(html.match(/aria-expanded="false"/g)).toHaveLength(7);
    expect(html).toMatch(
      /aria-expanded="true" aria-controls="ms-4"[^>]*>.*Mốc 4 tháng/,
    );
    expect(html).toContain('id="ms-4"');
    expect(html).not.toContain('id="ms-6"');
    expect(html).toContain(`d="${ICON_PATHS.chevronUp}"`);
  });

  it("writes each summary in its colour", () => {
    const html = renderToStaticMarkup(<MilestoneTimeline {...props()} />);
    expect(html).toContain(
      '<span class="text-[13px] font-semibold text-warn">Còn 1 mốc chưa đạt · nên hỏi bác sĩ</span>',
    );
    expect(html).toContain(
      '<span class="text-[13px] text-muted">Bun đang ở đây · đạt 1/13</span>',
    );
    expect(html).toContain(">Sắp tới</span>");
    expect(html).toContain(
      '<span class="text-base font-bold text-muted">Mốc 9 tháng</span>',
    );
    expect(html).toContain(
      '<span class="text-base font-bold text-ink">Mốc 6 tháng</span>',
    );
  });

  it("draws the node of each kind", () => {
    const html = renderToStaticMarkup(<MilestoneTimeline {...props()} />);
    expect(html).toContain("bg-warn text-bg");
    expect(html).toMatch(
      /bg-accent text-on-accent ring-5 ring-accent-tint[^>]*>4</,
    );
    expect(html).toMatch(/border-2 border-muted\/50 bg-glass-solid[^>]*>6</);
    const done = renderToStaticMarkup(
      <MilestoneTimeline
        {...props({
          steps: timelineSteps(groups, 5, new Set(codesOf(2)), true, "Bun"),
        })}
      />,
    );
    expect(done).toContain("bg-good text-bg");
    expect(done).toMatch(
      /size-7[^"]*bg-good text-bg"><svg[^>]*><path d="M20 6 9 17l-5-5"/,
    );
    expect(done).toContain(">Đạt đủ 11 mốc</span>");
  });

  it("splits the open group by domain, in order, with a dot each", () => {
    const html = renderToStaticMarkup(<MilestoneTimeline {...props()} />);
    const heads = [...html.matchAll(/<h3[^>]*>.*?<\/span>([^<]+)<\/h3>/g)].map(
      (m) => m[1],
    );
    expect(heads).toEqual([
      "Xã hội, cảm xúc",
      "Ngôn ngữ, giao tiếp",
      "Nhận thức",
      "Vận động",
    ]);
    for (const dot of [
      "bg-cat-feed",
      "bg-cat-temp",
      "bg-cat-sleep",
      "bg-cat-diaper",
    ])
      expect(html).toContain(dot);
    expect(html).toContain("Tự cười để gây chú ý");
    expect(html).toContain("Đạt ngày 12/11/2026");
  });

  it("shows no summary while the marks are loading", () => {
    const html = renderToStaticMarkup(
      <MilestoneTimeline
        {...props({ steps: timelineSteps(groups, 5, new Set(), false, "Bun") })}
      />,
    );
    for (const text of ["đang ở đây", "Sắp tới", "Sau này", "chưa đạt"])
      expect(html).not.toContain(text);
    expect(html).not.toContain("bg-warn");
    expect(html).not.toContain("text-warn");
  });

  it("toggles a group and opens an item", () => {
    const onToggle = vi.fn();
    const onOpenItem = vi.fn();
    const tree = MilestoneTimeline(props({ onToggle, onOpenItem }));
    const [six] = findElements(
      tree,
      (e) => e.props["aria-controls"] === "ms-6",
    );
    (six.props.onClick as () => void)();
    expect(onToggle).toHaveBeenCalledWith(6);
    const [item] = findElements(
      tree,
      (e) => e.props.title === "Cười khúc khích khi bạn trêu",
    );
    (item.props.onOpen as () => void)();
    expect(onOpenItem).toHaveBeenCalledWith(
      codesOf(4)[1],
      "Cười khúc khích khi bạn trêu",
    );
  });
});
