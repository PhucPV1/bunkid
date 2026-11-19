import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { PendingMark } from "@/components/sync/PendingMark";
import { findElements } from "@/components/ui/testTree";
import type { HeroState } from "@/lib/rules/hero";
import type { LogRow } from "@/lib/supabase/rows";
import { ICON_PATHS } from "@/lib/ui/icons";
import { HeroCardView } from "./HeroCard";

const NOW = new Date("2026-11-14T05:00:00Z"); // 12:00 giờ VN
const row = (over: Partial<LogRow>): LogRow =>
  ({
    id: "l1",
    baby_id: "b1",
    type: "breast",
    started_at: "2026-11-14T04:30:00.000Z",
    ended_at: null,
    details: { side: "left" },
    note: null,
    created_by: "u1",
    created_at: "2026-11-14T04:30:00.000Z",
    updated_at: "2026-11-14T04:30:00.000Z",
    ...over,
  }) as LogRow;

const props = (
  state: HeroState<LogRow>,
  over: Partial<Parameters<typeof HeroCardView>[0]> = {},
) => ({
  state,
  now: NOW,
  who: "Mẹ",
  pending: false,
  busy: false,
  onTimer: () => {},
  onStop: () => {},
  ...over,
});
const html = (p: Parameters<typeof HeroCardView>[0]) =>
  renderToStaticMarkup(<HeroCardView {...p} />);
const byText = (p: Parameters<typeof HeroCardView>[0], text: string) =>
  findElements(HeroCardView(p), (el) => el.props.children === text);
const BIG_40 = "text-[40px] leading-[44px]";
const BIG_32 = "text-[32px] leading-[38px]";
// The class of the element whose whole content is `text`.
const classOf = (out: string, text: string) =>
  out.match(new RegExp(`class="([^"]*)">${text}</`))?.[1] ?? "";

// Spec 2026-11-19 §3.2: the compact card.
describe("HeroCardView running", () => {
  const breast = row({});
  const sleep = row({
    type: "sleep",
    details: {},
    started_at: "2026-11-14T03:57:55.000Z",
  });

  it("is a hero glass card: 14 px padding, rows 10 px apart, top row 12 px", () => {
    const out = html(props({ kind: "running", log: breast }));
    expect(out).toMatch(/^<section class="glass rounded-\[32px\] [^"]*">/);
    expect(out).toContain("flex flex-col gap-2.5 p-3.5");
    expect(out).toContain('<div class="flex items-center gap-3">');
    expect(out).not.toContain("<circle");
  });

  it("shows a filled 56 px circle, label, clock and who started it", () => {
    const out = html(props({ kind: "running", log: breast }));
    expect(out).toContain("size-14");
    expect(out).toContain("bg-cat-feed ring-4 ring-cat-feed/30 text-bg");
    expect(out).toContain(`d="${ICON_PATHS.heart}"`);
    expect(classOf(out, "Đang bú trái")).toContain("uppercase");
    expect(classOf(out, "30:00")).toContain(BIG_40);
    expect(classOf(out, "Mẹ")).toBe("truncate");
    expect(out).toContain(">· từ 11:30</span>");
    expect(out).not.toContain('aria-label="Chờ đồng bộ"');
  });

  it("marks a timer that still waits to sync", () => {
    const out = html(
      props({ kind: "running", log: breast }, { pending: true }),
    );
    expect(out.match(/aria-label="Chờ đồng bộ"/g)).toHaveLength(1);
  });

  it("breast: a row of two buttons, Đổi bên secondary and Dừng primary", () => {
    const out = html(props({ kind: "running", log: breast }));
    expect(out).toContain("grid-cols-2");
    expect(classOf(out, "Đổi bên")).toContain("glass");
    expect(classOf(out, "Dừng")).toContain("bg-accent");
    expect(out.match(/<button/g)).toHaveLength(2);
  });

  it("Đổi bên presses the other side, Dừng stops this log", () => {
    const onTimer = vi.fn();
    const onStop = vi.fn();
    const p = props({ kind: "running", log: breast }, { onTimer, onStop });
    (byText(p, "Đổi bên")[0].props.onClick as () => void)();
    expect(onTimer).toHaveBeenCalledWith({ type: "breast", side: "right" });
    (byText(p, "Dừng")[0].props.onClick as () => void)();
    expect(onStop).toHaveBeenCalledWith(breast);
  });

  it("other timers: one large Dừng at the right of the top row, no button row", () => {
    const onStop = vi.fn();
    const p = props({ kind: "running", log: sleep }, { onStop });
    const out = html(p);
    expect(out).toContain("bg-cat-sleep ring-4 ring-cat-sleep/30 text-bg");
    expect(out).toContain(`d="${ICON_PATHS.moon}"`);
    expect(out).toContain(">Đang ngủ</span>");
    expect(out).not.toContain("Đổi bên");
    expect(out).not.toContain("grid-cols-2");
    expect(out.match(/<button/g)).toHaveLength(1);
    expect(classOf(out, "Dừng")).toContain("bg-accent");
    expect(classOf(out, "Dừng")).toContain("min-h-[50px]");
    expect(classOf(out, "Dừng")).toContain("shrink-0");
    expect(out).toMatch(/<\/button><\/div><\/section>$/);
    (byText(p, "Dừng")[0].props.onClick as () => void)();
    expect(onStop).toHaveBeenCalledWith(sleep);
  });

  it("names every timer", () => {
    const label = (over: Partial<LogRow>) =>
      html(props({ kind: "running", log: row(over) }));
    expect(label({ details: { side: "right" } })).toContain(">Đang bú phải<");
    expect(label({ type: "pump", details: {} })).toContain(">Đang hút sữa<");
    expect(label({ type: "tummy", details: {} })).toContain(">Đang nằm sấp<");
  });

  it("the clock is 40/44 up to five characters, 32/38 beyond", () => {
    const clock = (started_at: string, text: string) =>
      classOf(html(props({ kind: "running", log: row({ started_at }) })), text);
    expect(clock("2026-11-14T04:00:01.000Z", "59:59")).toContain(BIG_40);
    expect(clock("2026-11-14T04:00:00.000Z", "1:00:00")).toContain(BIG_32);
    expect(clock("2026-11-14T03:57:55.000Z", "1:02:05")).toContain(BIG_32);
  });
});

describe("HeroCardView other states", () => {
  it("overdue: warn border, circle and label, minutes late, expected time, two feed buttons", () => {
    const onTimer = vi.fn();
    const p = props(
      {
        kind: "overdue",
        due: new Date("2026-11-14T04:35:00Z"),
        lateMinutes: 25,
      },
      { onTimer },
    );
    const out = html(p);
    expect(out).toContain("border-warn!");
    expect(out).toContain("size-14");
    expect(out).toContain("bg-warn-soft text-warn-ink");
    expect(out).toContain(`d="${ICON_PATHS.clock}"`);
    expect(classOf(out, "Trễ cữ bú")).toMatch(/\btext-warn\b(?!-)/);
    expect(classOf(out, "Trễ cữ bú")).toContain("uppercase");
    expect(classOf(out, "25 phút")).toContain(BIG_32);
    expect(out).toContain(">Dự kiến lúc 11:35</span>");
    expect(out).toContain("grid-cols-2");
    expect(out).toContain(">Bú trái</button>");
    (byText(p, "Bú phải")[0].props.onClick as () => void)();
    expect(onTimer).toHaveBeenCalledWith({ type: "breast", side: "right" });
  });

  it("awake: a sun on the sleep tint, whole minutes awake, since when, no buttons", () => {
    const out = html(
      props({ kind: "awake", since: new Date("2026-11-14T03:34:20Z") }),
    );
    expect(out).toContain("size-14");
    expect(out).toContain("bg-cat-sleep/15 text-cat-sleep");
    expect(out).toContain(`d="${ICON_PATHS.sun}"`);
    expect(classOf(out, "Đang thức")).toContain("uppercase");
    expect(classOf(out, "1 giờ 25 phút")).toContain(BIG_32);
    expect(out).toContain(">từ 10:34</span>");
    expect(out).not.toContain("<button");
    expect(out).not.toContain("border-warn!");
  });

  it("empty: only a sentence and two feed buttons", () => {
    const out = html(props({ kind: "empty" }));
    expect(classOf(out, "Chưa có cữ bú nào gần đây")).toContain(
      "text-[17px] leading-[22px] font-semibold",
    );
    expect(out).not.toContain("size-14");
    expect(out).not.toContain("uppercase");
    expect(out).not.toContain("<svg");
    expect(out).toContain("grid-cols-2");
    expect(out).toContain(">Bú trái</button>");
    expect(out).toContain(">Bú phải</button>");
  });

  it("none: draws nothing", () => {
    expect(html(props({ kind: "none" }))).toBe("");
  });

  it("busy disables every button", () => {
    const disabled = (state: HeroState<LogRow>) =>
      html(props(state, { busy: true })).match(/disabled=""/g);
    expect(disabled({ kind: "empty" })).toHaveLength(2);
    expect(disabled({ kind: "running", log: row({}) })).toHaveLength(2);
    expect(
      disabled({ kind: "running", log: row({ type: "sleep", details: {} }) }),
    ).toHaveLength(1);
  });
});

describe("PendingMark", () => {
  it("is a clock icon, not an emoji", () => {
    const out = renderToStaticMarkup(<PendingMark pending />);
    expect(out).toContain('aria-label="Chờ đồng bộ"');
    expect(out).toContain(`d="${ICON_PATHS.clock}"`);
    expect(out).not.toContain("⏳");
    expect(renderToStaticMarkup(<PendingMark pending={false} />)).toBe("");
  });
});

describe("HeroCardView next-side hint (spec 2026-11-17 §5.3)", () => {
  const nextSide = {
    suggest: "right" as const,
    last: "left" as const,
    lastAt: "2026-11-14T03:05:00.000Z", // 10:05 giờ VN
  };
  const overdue: HeroState<LogRow> = {
    kind: "overdue",
    due: new Date("2026-11-14T04:48:00Z"),
    lateMinutes: 12,
  };

  it("labels the suggested button and says which side was last", () => {
    const out = html(props(overdue, { nextSide }));
    expect(out.match(/Nên bú/g)).toHaveLength(1);
    expect(out).toMatch(/Bú phải<span[^>]*bg-accent[^>]*>Nên bú<\/span>/);
    expect(out).toContain("Lần trước: trái lúc 10:05");
    const empty = html(props({ kind: "empty" }, { nextSide }));
    expect(empty).toMatch(/Bú phải<span[^>]*>Nên bú<\/span>/);
  });

  it("keeps both buttons pressable", () => {
    const onTimer = vi.fn();
    const buttons = findElements(
      HeroCardView(props(overdue, { nextSide, onTimer })),
      (el) => typeof el.props.onClick === "function",
    );
    expect(buttons).toHaveLength(2);
    buttons.forEach((b) => (b.props.onClick as () => void)());
    expect(onTimer.mock.calls).toEqual([
      [{ type: "breast", side: "left" }],
      [{ type: "breast", side: "right" }],
    ]);
  });

  it("shows nothing without a hint, and nothing while the baby is awake", () => {
    expect(html(props(overdue))).not.toContain("Nên bú");
    expect(html(props(overdue))).not.toContain("Lần trước");
    const awake = html(
      props(
        { kind: "awake", since: new Date("2026-11-14T04:00:00Z") },
        { nextSide },
      ),
    );
    expect(awake).not.toContain("Nên bú");
    expect(awake).not.toContain("Lần trước");
  });
});
