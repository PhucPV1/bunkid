import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { findElements } from "@/components/ui/testTree";
import { ICON_PATHS } from "@/lib/ui/icons";
import {
  NotificationsGroupView,
  QuietHoursSheet,
  SNOOZE_HINT,
  SnoozeSheet,
} from "./NotificationsGroup";

const prefs = {
  feed_reminder: true,
  wake_window: false,
  vaccine: true,
  medicine: true,
  timer_alert: false,
  growth_alert: true,
  growth_measure: false,
};
const view = (
  overrides: Partial<Parameters<typeof NotificationsGroupView>[0]> = {},
) => ({
  prefs,
  holdFeed: false,
  quiet: "Tắt",
  medicine: "2 thuốc",
  disabled: false,
  snooze: "Không",
  device: <p>Thiết bị</p>,
  onToggle: () => {},
  onToggleHold: () => {},
  onOpenQuiet: () => {},
  onOpenSnooze: () => {},
  ...overrides,
});

describe("NotificationsGroupView", () => {
  it("lists the device control, eight switches, quiet hours and the snooze row", () => {
    const html = renderToStaticMarkup(<NotificationsGroupView {...view()} />);
    expect(html).toContain(">Thông báo</h2>");
    expect(html).toContain("<p>Thiết bị</p>");
    expect(html.match(/role="switch"/g)).toHaveLength(8);
    expect(html.match(/aria-checked="(true|false)"/g)).toEqual([
      'aria-checked="true"',
      'aria-checked="false"',
      'aria-checked="true"',
      'aria-checked="true"',
      'aria-checked="false"',
      'aria-checked="true"',
      'aria-checked="false"',
      'aria-checked="false"',
    ]);
    for (const label of [
      "Nhắc cữ bú",
      "Nhắc khi bé thức quá lâu",
      "Nhắc lịch tiêm",
      "Nhắc thuốc",
      "Nhắc timer chạy quá lâu",
      "Cảnh báo tăng trưởng",
      "Nhắc đo định kỳ",
      "Không nhắc bú khi bé đang ngủ",
      "Giờ yên lặng",
      "Tạm tắt nhắc",
    ])
      expect(html).toContain(`>${label}</span>`);
    expect(html).toContain(">Không</span>");
    expect(html).toContain("bg-cat-diaper");
    expect(html).toContain(`d="${ICON_PATHS.bell}"`);
    expect(html).toContain(`d="${ICON_PATHS.pause}"`);
  });

  it("saves a switch change for its preference", () => {
    const onToggle = vi.fn();
    const switches = findElements(
      NotificationsGroupView(view({ onToggle })),
      (el) => el.props.checked !== undefined,
    );
    expect(switches).toHaveLength(8);
    (switches[1].props.onChange as (v: boolean) => void)(true);
    expect(onToggle).toHaveBeenCalledWith("wake_window", true);
    // Spec 2026-11-25 §8.1: the two growth switches save their own keys.
    (switches[5].props.onChange as (v: boolean) => void)(false);
    expect(onToggle).toHaveBeenLastCalledWith("growth_alert", false);
    (switches[6].props.onChange as (v: boolean) => void)(true);
    expect(onToggle).toHaveBeenLastCalledWith("growth_measure", true);
  });

  it("opens the snooze sheet from its row, unless disabled", () => {
    const onOpenSnooze = vi.fn();
    const [row] = findElements(
      NotificationsGroupView(view({ onOpenSnooze })),
      (el) => el.props.label === "Tạm tắt nhắc",
    );
    (row.props.onClick as () => void)();
    expect(onOpenSnooze).toHaveBeenCalledOnce();
    const [locked] = findElements(
      NotificationsGroupView(view({ disabled: true })),
      (el) => el.props.label === "Tạm tắt nhắc",
    );
    expect(locked.props.onClick).toBeUndefined();
  });
});

describe("NotificationsGroupView — spec 2026-11-17 §4.4", () => {
  it("keeps the rows in the spec's order", () => {
    const html = renderToStaticMarkup(<NotificationsGroupView {...view()} />);
    const order = [
      "Nhắc cữ bú",
      "Nhắc khi bé thức quá lâu",
      "Nhắc lịch tiêm",
      "Nhắc thuốc",
      "Nhắc timer chạy quá lâu",
      "Cảnh báo tăng trưởng",
      "Nhắc đo định kỳ",
      "Không nhắc bú khi bé đang ngủ",
      "Giờ yên lặng",
      "Lịch nhắc thuốc",
      "Tạm tắt nhắc",
    ].map((label) => html.indexOf(`>${label}</span>`));
    expect(order.every((at) => at >= 0)).toBe(true);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
    expect(html).toContain(`d="${ICON_PATHS.pill}"`);
    expect(html).toContain(`d="${ICON_PATHS.clock}"`);
    expect(html).toContain(`d="${ICON_PATHS.alert}"`);
    expect(html).toContain(`d="${ICON_PATHS.ruler}"`);
    expect(html).toContain(`d="${ICON_PATHS.bottle}"`);
    expect(html).toContain(`d="${ICON_PATHS.moon}"`);
  });

  it("the hold switch carries the newborn note and saves its own value", () => {
    const html = renderToStaticMarkup(<NotificationsGroupView {...view()} />);
    expect(html).toContain(
      "Bé sơ sinh những tuần đầu thường cần đánh thức để bú. Hỏi bác sĩ trước khi bật.",
    );
    const onToggleHold = vi.fn();
    const onToggle = vi.fn();
    const switches = findElements(
      NotificationsGroupView(view({ onToggleHold, onToggle })),
      (el) => el.props.checked !== undefined,
    );
    expect(switches[7].props.label).toBe("Không nhắc bú khi bé đang ngủ");
    (switches[7].props.onChange as (v: boolean) => void)(true);
    expect(onToggleHold).toHaveBeenCalledWith(true);
    expect(onToggle).not.toHaveBeenCalled();
    (switches[3].props.onChange as (v: boolean) => void)(false);
    expect(onToggle).toHaveBeenCalledWith("medicine", false);
  });

  it("the quiet-hours row shows its value and opens the sheet, unless disabled", () => {
    const html = renderToStaticMarkup(
      <NotificationsGroupView {...view({ quiet: "22:00–06:00" })} />,
    );
    expect(html).toContain(">22:00–06:00</span>");
    const onOpenQuiet = vi.fn();
    const [row] = findElements(
      NotificationsGroupView(view({ onOpenQuiet })),
      (el) => el.props.label === "Giờ yên lặng",
    );
    (row.props.onClick as () => void)();
    expect(onOpenQuiet).toHaveBeenCalledOnce();
    const [locked] = findElements(
      NotificationsGroupView(view({ disabled: true })),
      (el) => el.props.label === "Giờ yên lặng",
    );
    expect(locked.props.onClick).toBeUndefined();
  });

  it("Lịch nhắc thuốc links to its page and shows how many are on", () => {
    const html = renderToStaticMarkup(<NotificationsGroupView {...view()} />);
    expect(html).toContain('href="/cai-dat/nhac-thuoc"');
    expect(html).toContain(">2 thuốc</span>");
    expect(html).toContain(`d="${ICON_PATHS.calendar}"`);
    // While the list is still loading the row has no value.
    const loading = renderToStaticMarkup(
      <NotificationsGroupView {...view({ medicine: "" })} />,
    );
    expect(loading).toContain(">Lịch nhắc thuốc</span>");
    expect(loading).not.toContain("thuốc</span><svg");
  });

  it("the snooze hint names the four reminders it pauses", () => {
    expect(SNOOZE_HINT).toBe(
      "Tạm tắt nhắc bú, nhắc thức, nhắc thuốc và nhắc timer trên mọi máy của bạn. Nhắc tiêm vẫn gửi.",
    );
  });
});

describe("QuietHoursSheet", () => {
  it("shows the switch, both times, the three notes and Lưu", () => {
    const html = renderToStaticMarkup(
      <QuietHoursSheet
        value={{
          quiet_enabled: true,
          quiet_start_min: 1320,
          quiet_end_min: 360,
        }}
        busy={false}
        onClose={() => {}}
        onSave={() => {}}
      />,
    );
    expect(html).toContain(">Giờ yên lặng</h2>");
    expect(html).toContain('aria-label="Bật giờ yên lặng"');
    expect(html).toMatch(/role="switch"[^>]*aria-checked="true"/);
    expect(html.match(/type="time"/g)).toHaveLength(2);
    expect(html).toContain('value="22:00"');
    expect(html).toContain('value="06:00"');
    expect(html).toContain(">Từ</label>");
    expect(html).toContain(">Đến</label>");
    expect(html).toContain(
      "nhắc bú, nhắc thức, nhắc thuốc hằng ngày, nhắc timer.",
    );
    expect(html).toContain("nhắc tiêm và nhắc sau liều hạ sốt.");
    expect(html).toContain(
      "Hết giờ yên lặng mà vẫn quá giờ bú thì nhắc ngay lúc đó.",
    );
    expect(html).toContain(">Lưu</button>");
  });
});

describe("SnoozeSheet", () => {
  it("offers 2, 4 and 8 hours and explains the current state", () => {
    const html = renderToStaticMarkup(
      <SnoozeSheet
        open
        onClose={() => {}}
        status="Tạm tắt nhắc bú và nhắc thức trên mọi máy của bạn. Nhắc tiêm vẫn gửi."
        snoozed={false}
        busy={false}
        onPick={() => {}}
        onResume={() => {}}
      />,
    );
    expect(html).toContain(">Tạm tắt nhắc</h2>");
    for (const hours of [2, 4, 8])
      expect(html).toContain(`>${hours} giờ</button>`);
    expect(html).toContain("Nhắc tiêm vẫn gửi.");
    expect(html).not.toContain("Bật lại ngay");
  });

  it("offers Bật lại ngay while paused", () => {
    const html = renderToStaticMarkup(
      <SnoozeSheet
        open
        onClose={() => {}}
        status="Đang tạm tắt nhắc đến 22:00"
        snoozed
        busy={false}
        onPick={() => {}}
        onResume={() => {}}
      />,
    );
    expect(html).toContain(">Bật lại ngay</button>");
  });
});
