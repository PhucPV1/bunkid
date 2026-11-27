import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { findElements } from "@/components/ui/testTree";
import type { DayRowView, VerdictView } from "@/lib/rules/illnessView";
import { ICON_PATHS } from "@/lib/ui/icons";
import { EpisodeDayList } from "./EpisodeDayList";
import { EpisodeVerdict, QuickLogButtons } from "./EpisodeVerdict";

const view = (over: Partial<VerdictView> = {}): VerdictView => ({
  verdict: { title: "Bun đã hết sốt 19 giờ", tone: "good", icon: "check" },
  sub: "Ngày thứ 3 · bắt đầu 24/11 lúc 23:30",
  rows: [
    { label: "Đo gần nhất", when: "07:05 hôm nay", value: "37,6°C" },
    { label: "Sốt cao nhất", when: "25/11 15:00", value: "39,2°C" },
    { label: "Thuốc hạ sốt", when: "gần nhất 02:00 hôm nay", value: "2 liều" },
  ],
  open: true,
  ...over,
});
const card = (over: Partial<VerdictView> = {}) =>
  renderToStaticMarkup(<EpisodeVerdict view={view(over)} onLog={() => {}} />);

// Spec 2026-11-26 §6.3 item 2.
describe("EpisodeVerdict", () => {
  it("heads the card with a round icon, the verdict and the line under it", () => {
    const html = card();
    expect(html).toContain("glass");
    expect(html).toMatch(
      /size-11[^"]*rounded-full[^"]*bg-good-soft text-good-ink/,
    );
    expect(html).toContain(`d="${ICON_PATHS.check}"`);
    expect(html).toContain(">Bun đã hết sốt 19 giờ</h2>");
    expect(html).toContain(">Ngày thứ 3 · bắt đầu 24/11 lúc 23:30</span>");
  });

  it("the tone and the icon both change with the verdict", () => {
    const fever = card({
      verdict: { title: "Bun đang sốt 39,4°C", tone: "danger", icon: "thermo" },
    });
    expect(fever).toContain("bg-danger-soft text-danger-ink");
    expect(fever).toContain(`d="${ICON_PATHS.thermo}"`);
    const stale = card({
      verdict: { title: "Chưa đo lại sau 38,6°C", tone: "warn", icon: "clock" },
    });
    expect(stale).toContain("bg-warn-soft text-warn-ink");
    expect(stale).toContain(`d="${ICON_PATHS.clock}"`);
    const none = card({
      verdict: { title: "Chưa đo nhiệt độ", tone: "neutral", icon: "thermo" },
    });
    expect(none).toContain("bg-line text-ink");
  });

  it("three rows: label, a small time, the value in bold", () => {
    const html = card();
    for (const text of ["Đo gần nhất", "Sốt cao nhất", "Thuốc hạ sốt"])
      expect(html).toContain(`>${text}</span>`);
    expect(html).toMatch(/text-\[13px\][^>]*text-muted[^>]*>07:05 hôm nay</);
    expect(html).toMatch(/font-bold[^>]*>37,6°C</);
    expect(html).toContain(">gần nhất 02:00 hôm nay</span>");
    expect(html.match(/min-h-11[^"]*border-b/g)).toHaveLength(3);
    expect(html).not.toContain("truncate");
  });

  it("a row without a time has only its value", () => {
    const html = card({
      rows: [
        { label: "Đo gần nhất", when: null, value: "Chưa đo" },
        { label: "Sốt cao nhất", when: null, value: "Chưa đo" },
        { label: "Thuốc hạ sốt", when: null, value: "Chưa dùng" },
      ],
    });
    expect(html).toContain(">Chưa dùng</span>");
    expect(html.match(/text-\[13px\][^>]*text-muted/g)).toHaveLength(1);
  });

  it("an open episode has the three quick logs; a closed one has none", () => {
    expect(card().match(/<button/g)).toHaveLength(3);
    expect(card({ open: false })).not.toContain("<button");
  });
});

describe("QuickLogButtons", () => {
  it("three buttons of at least 44 px that name their log type", () => {
    const html = renderToStaticMarkup(<QuickLogButtons onLog={() => {}} />);
    expect(html).toContain("grid grid-cols-3 gap-2");
    expect(html.match(/<button[^>]*min-h-11/g)).toHaveLength(3);
    for (const text of ["Nhiệt độ", "Thuốc", "Triệu chứng"])
      expect(html).toContain(`>${text}</button>`);
    // "Triệu chứng" needs the room: narrower padding and 14 px text.
    expect(html.match(/px-1! text-sm!/g)).toHaveLength(3);
  });

  it("each button opens the sheet of its type", () => {
    const onLog = vi.fn();
    const buttons = findElements(
      QuickLogButtons({ onLog }),
      (el) => typeof el.props.onClick === "function",
    );
    expect(buttons).toHaveLength(3);
    for (const button of buttons) (button.props.onClick as () => void)();
    expect(onLog.mock.calls).toEqual([
      ["temperature"],
      ["medicine"],
      ["symptom"],
    ]);
  });
});

// Spec §6.3 item 4.
describe("EpisodeDayList", () => {
  const rows: DayRowView[] = [
    {
      day: "2026-11-26",
      title: "Hôm nay · ngày 3",
      detail: "Chưa đo · không dùng thuốc",
      chips: [],
      label: null,
    },
    {
      day: "2026-11-25",
      title: "25/11 · ngày 2",
      detail: "Cao nhất 39,2°C · 2 liều hạ sốt",
      chips: ["Sổ mũi", "Ho", "Quấy"],
      label: { text: "Sốt cao", tone: "danger" },
    },
    {
      day: "2026-11-24",
      title: "24/11 · ngày 1",
      detail: "Cao nhất 38,4°C · không dùng thuốc",
      chips: [],
      label: { text: "Sốt", tone: "warn" },
    },
  ];
  const html = renderToStaticMarkup(<EpisodeDayList rows={rows} />);
  const items = html.split("<li").slice(1);

  it("a titled list with one row per day, none of them a link or a button", () => {
    expect(html).toContain(">Từng ngày</h2>");
    expect(items).toHaveLength(3);
    expect(html).not.toContain("<a ");
    expect(html).not.toContain("<button");
    expect(html).not.toContain("truncate");
  });

  it("the label shares a line with the title only, so the line under it has the full width", () => {
    expect(items[1]).toMatch(
      />25\/11 · ngày 2<\/span><span class="[^"]*bg-danger-soft text-danger-ink[^"]*">Sốt cao<\/span><\/div>/,
    );
    expect(items[1]).toContain(">Cao nhất 39,2°C · 2 liều hạ sốt</span>");
    expect(items[2]).toContain("bg-warn-soft text-warn-ink");
  });

  it("symptom chips are neutral and only there when the day has symptoms", () => {
    expect(items[1].match(/bg-line text-ink/g)).toHaveLength(3);
    expect(items[1]).toContain(">Quấy</span>");
    expect(items[0]).not.toContain("bg-line text-ink");
    expect(items[0]).not.toContain("rounded-full");
  });
});
