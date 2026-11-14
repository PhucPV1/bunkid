import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { findElements } from "@/components/ui/testTree";
import { ICON_PATHS } from "@/lib/ui/icons";
import { NotificationsGroupView, SnoozeSheet } from "./NotificationsGroup";

const prefs = { feed_reminder: true, wake_window: false, vaccine: true };
const view = (
  overrides: Partial<Parameters<typeof NotificationsGroupView>[0]> = {},
) => ({
  prefs,
  disabled: false,
  snooze: "Không",
  device: <p>Thiết bị</p>,
  onToggle: () => {},
  onOpenSnooze: () => {},
  ...overrides,
});

describe("NotificationsGroupView", () => {
  it("lists the device control, three switches and the snooze row", () => {
    const html = renderToStaticMarkup(<NotificationsGroupView {...view()} />);
    expect(html).toContain(">Thông báo</h2>");
    expect(html).toContain("<p>Thiết bị</p>");
    expect(html.match(/role="switch"/g)).toHaveLength(3);
    expect(html.match(/aria-checked="(true|false)"/g)).toEqual([
      'aria-checked="true"',
      'aria-checked="false"',
      'aria-checked="true"',
    ]);
    for (const label of [
      "Nhắc cữ bú",
      "Nhắc khi bé thức quá lâu",
      "Nhắc lịch tiêm",
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
    expect(switches).toHaveLength(3);
    (switches[1].props.onChange as (v: boolean) => void)(true);
    expect(onToggle).toHaveBeenCalledWith("wake_window", true);
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
