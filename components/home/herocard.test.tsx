import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { PendingMark } from "@/components/sync/PendingMark";
import { RING_CIRCUMFERENCE } from "@/components/ui/TimerRing";
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
  sub: null,
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

describe("HeroCardView running", () => {
  const breast = row({});

  it("shows the ring, label, clock and who started it", () => {
    const out = html(props({ kind: "running", log: breast }));
    expect(out).toContain("stroke-cat-feed");
    expect(out).toContain(`stroke-dashoffset="${RING_CIRCUMFERENCE * 0.5}"`);
    expect(out).toContain(">Bú trái");
    expect(out).toContain("uppercase");
    expect(out).toContain(">30:00</span>");
    expect(out).toContain(">Mẹ · từ 11:30</span>");
    expect(out).toContain(">Đổi bên</button>");
    expect(out).toContain(">Dừng</button>");
    expect(out).toContain("rounded-[32px]");
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

  it("other timers get one full-width Dừng and a smaller clock after an hour", () => {
    const sleep = row({
      type: "sleep",
      details: {},
      started_at: "2026-11-14T03:57:55.000Z",
    });
    const out = html(props({ kind: "running", log: sleep }));
    expect(out).toContain("stroke-cat-sleep");
    expect(out).toContain(">Ngủ");
    expect(out).toContain(">1:02:05</span>");
    expect(out).toContain("text-[38px]");
    expect(out).not.toContain("Đổi bên");
    expect(out.match(/<button/g)).toHaveLength(1);
    expect(out).toContain("w-full");
  });
});

describe("HeroCardView feed states", () => {
  it("overdue: warn border and label, minutes late, expected time, two feed buttons", () => {
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
    expect(out).toContain("text-warn");
    expect(out).toContain(">Trễ cữ bú</span>");
    expect(out).toContain(">25 phút</span>");
    expect(out).toContain(">Dự kiến lúc 11:35</span>");
    expect(out).toContain(">Bú trái</button>");
    (byText(p, "Bú phải")[0].props.onClick as () => void)();
    expect(onTimer).toHaveBeenCalledWith({ type: "breast", side: "right" });
  });

  it("empty: a sentence, two feed buttons and the sub line", () => {
    const out = html(
      props(
        { kind: "empty" },
        { sub: "Bé đã thức 45 phút · Vitamin D đã uống 08:10" },
      ),
    );
    expect(out).toContain(">Chưa có cữ bú nào gần đây</span>");
    expect(out).toContain(">Bú phải</button>");
    expect(out).toContain(">Bé đã thức 45 phút · Vitamin D đã uống 08:10</p>");
  });

  it("busy disables every button", () => {
    const out = html(props({ kind: "empty" }, { busy: true }));
    expect(out.match(/disabled=""/g)).toHaveLength(2);
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

  it("shows nothing without a hint", () => {
    expect(html(props(overdue))).not.toContain("Nên bú");
    expect(html(props(overdue))).not.toContain("Lần trước");
  });
});
