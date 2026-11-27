import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { findElements } from "@/components/ui/testTree";
import type {
  CloseReminderView,
  HomeEpisodeView,
} from "@/lib/rules/illnessView";
import { ICON_PATHS } from "@/lib/ui/icons";
import { CloseReminder, EpisodeCard } from "./EpisodeHomeCards";

const card = (over: Partial<HomeEpisodeView> = {}) =>
  renderToStaticMarkup(
    <EpisodeCard
      view={{
        href: "/dot-om/chi-tiet?id=ab-12",
        title: "Đang ốm · ngày 3",
        sub: "Hết sốt 19 giờ · 37,4°C lúc 07:05",
        ...over,
      }}
      onLog={() => {}}
    />,
  );

// Spec 2026-11-26 §7.1 (board "Hôm nay · C").
describe("EpisodeCard", () => {
  it("its top row leads to the episode: a thermometer, the title, the state, an arrow", () => {
    const html = card();
    expect(html).toMatch(/^<section class="glass[^"]*rounded-\[26px\]/);
    expect(html).toMatch(
      /<a[^>]*href="\/dot-om\/chi-tiet\?id=ab-12"[^>]*>.*Đang ốm · ngày 3.*Hết sốt 19 giờ · 37,4°C lúc 07:05.*<\/a>/,
    );
    expect(html).toMatch(/size-11[^"]*rounded-full[^"]*bg-cat-temp\/15/);
    expect(html).toContain(`d="${ICON_PATHS.thermo}"`);
    expect(html).toContain(`d="${ICON_PATHS.chevronRight}"`);
    expect(html).toMatch(/font-bold[^>]*>Đang ốm · ngày 3</);
    expect(html).toMatch(/text-muted[^>]*>Hết sốt 19 giờ/);
    expect(html).not.toContain("truncate");
  });

  it("the link is a touch target of at least 44 px", () => {
    expect(card()).toMatch(/<a[^>]*class="[^"]*min-h-11/);
  });

  it("no line under the title while the episode's logs load", () => {
    const html = card({ sub: null });
    expect(html).toContain(">Đang ốm · ngày 3</span>");
    expect(html).not.toContain("text-[13px]");
  });

  it("the three quick logs, as on the episode's page", () => {
    const html = card();
    expect(html.match(/<button[^>]*min-h-11/g)).toHaveLength(3);
    for (const text of ["Nhiệt độ", "Thuốc", "Triệu chứng"])
      expect(html).toContain(`>${text}</button>`);
    const onLog = vi.fn();
    const [buttons] = findElements(
      EpisodeCard({
        view: { href: "/x", title: "t", sub: null },
        onLog,
      }),
      (el) => "onLog" in el.props,
    );
    (buttons.props.onLog as (type: string) => void)("medicine");
    expect(onLog).toHaveBeenCalledWith("medicine");
  });
});

const SUB =
  "Đợt ốm bắt đầu 24/11 xong chưa? Đóng lại thì các bản ghi sau đó không tính vào đợt này nữa.";
const reminderView = (
  over: Partial<CloseReminderView> = {},
): CloseReminderView => ({
  title: "Bun đã 48 giờ không sốt",
  sub: SUB,
  tone: "good",
  icon: "check",
  ...over,
});

// Spec §7.3.
describe("CloseReminder", () => {
  const render = (busy = false, over: Partial<CloseReminderView> = {}) =>
    renderToStaticMarkup(
      <CloseReminder
        view={reminderView(over)}
        busy={busy}
        onClose={() => {}}
        onSnooze={() => {}}
      />,
    );

  it("a glass card: the round icon, the title, the question under it", () => {
    const html = render();
    expect(html).toMatch(/^<section class="glass[^"]*rounded-\[26px\]/);
    expect(html).toMatch(
      /size-10[^"]*rounded-full[^"]*bg-good-soft text-good-ink/,
    );
    expect(html).toContain(`d="${ICON_PATHS.check}"`);
    expect(html).toMatch(/<h2[^>]*>Bun đã 48 giờ không sốt<\/h2>/);
    expect(html).toContain(`>${SUB}</p>`);
    expect(html).not.toContain("truncate");
  });

  it("the icon and tone change with the case, so night still tells them apart", () => {
    const unchecked = render(false, {
      title: "48 giờ qua chưa đo lại nhiệt độ",
      tone: "warn",
      icon: "clock",
    });
    expect(unchecked).toContain("bg-warn-soft text-warn-ink");
    expect(unchecked).toContain(`d="${ICON_PATHS.clock}"`);
    expect(render(false, { tone: "neutral", icon: "thermo" })).toContain(
      "bg-line text-ink",
    );
  });

  it("Bé đã khỏi first, then Chưa, side by side, 44 px tall", () => {
    const html = render();
    expect(html).toContain("grid grid-cols-2 gap-2");
    expect(html).toMatch(/<button[^>]*bg-accent[^>]*>Bé đã khỏi<\/button>/);
    expect(html).toMatch(/<button[^>]*glass[^>]*>Chưa<\/button>/);
    expect(html.indexOf(">Bé đã khỏi<")).toBeLessThan(html.indexOf(">Chưa<"));
    expect(html.match(/<button[^>]*min-h-11/g)).toHaveLength(2);
  });

  it("each button reports its tap; Bé đã khỏi waits while the change is on its way", () => {
    const onClose = vi.fn();
    const onSnooze = vi.fn();
    const buttons = findElements(
      CloseReminder({ view: reminderView(), busy: false, onClose, onSnooze }),
      (el) => typeof el.props.onClick === "function",
    );
    for (const button of buttons) (button.props.onClick as () => void)();
    expect(onClose).toHaveBeenCalledOnce();
    expect(onSnooze).toHaveBeenCalledOnce();
    expect(render(true)).toMatch(/aria-busy="true"[^>]*>Bé đã khỏi</);
  });
});
