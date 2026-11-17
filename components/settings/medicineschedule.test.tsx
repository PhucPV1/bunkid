import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { findElements, hostElements } from "@/components/ui/testTree";
import { scheduleRows, type ScheduleLike } from "@/lib/rules/medicineSchedule";
import { ICON_PATHS } from "@/lib/ui/icons";
import {
  AddMedicineForm,
  MedicineScheduleView,
} from "./MedicineScheduleSection";

const saved = (over: Partial<ScheduleLike>): ScheduleLike => ({
  id: "s1",
  name: "Vitamin D",
  remind_at_min: 540,
  enabled: true,
  created_at: "2026-11-17T01:00:00Z",
  ...over,
});
const rows = scheduleRows([
  saved({}),
  saved({
    id: "s2",
    name: "Men tiêu hoá",
    remind_at_min: 1170,
    enabled: false,
  }),
  saved({ id: "s3", name: "Siro sắt", remind_at_min: 480 }),
]);
const view = (
  over: Partial<Parameters<typeof MedicineScheduleView>[0]> = {},
) => ({
  rows,
  busy: false,
  onToggle: () => {},
  onTime: () => {},
  onRemove: () => {},
  onAdd: () => null,
  ...over,
});

describe("MedicineScheduleView (spec 2026-11-17 §4.2)", () => {
  it("lists the presets and the other medicines, with a time only where it is on", () => {
    const html = renderToStaticMarkup(<MedicineScheduleView {...view()} />);
    expect(html).toContain(
      "Tới giờ mà hôm nay chưa ghi thuốc đó thì Kim Bun gửi một thông báo.",
    );
    const names = [...html.matchAll(/data-medicine="([^"]+)"/g)].map(
      (m) => m[1],
    );
    expect(names).toEqual(["Vitamin D", "DHA", "Men tiêu hoá", "Siro sắt"]);
    expect(html.match(/role="switch"/g)).toHaveLength(4);
    expect(html.match(/aria-checked="(true|false)"/g)).toEqual([
      'aria-checked="true"',
      'aria-checked="false"',
      'aria-checked="false"',
      'aria-checked="true"',
    ]);
    // Only the two that are on show their time.
    expect(html.match(/type="time"/g)).toHaveLength(2);
    expect(html).toContain('aria-label="Giờ nhắc Vitamin D"');
    expect(html).toContain('value="09:00"');
    expect(html).toContain('value="08:00"');
    expect(html).not.toContain('value="19:30"');
    expect(html).toContain(`d="${ICON_PATHS.pill}"`);
    // Only the medicine the family added can be removed.
    expect(html.match(/>Xóa<\/button>/g)).toHaveLength(1);
    expect(html).toContain(
      "Lịch vừa bật hoặc vừa đổi sau giờ nhắc của hôm nay sẽ bắt đầu nhắc từ ngày mai.",
    );
  });

  it("switches a row on or off, also a preset that has no row yet", () => {
    const onToggle = vi.fn();
    const switches = findElements(
      MedicineScheduleView(view({ onToggle })),
      (el) => el.props.checked !== undefined,
    );
    (switches[1].props.onChange as (v: boolean) => void)(true);
    expect(onToggle).toHaveBeenCalledWith(rows[1], true);
    expect(rows[1].schedule).toBeNull();
    (switches[0].props.onChange as (v: boolean) => void)(false);
    expect(onToggle).toHaveBeenCalledWith(rows[0], false);
  });

  it("saves a time as soon as it is a full HH:mm, and nothing else", () => {
    const onTime = vi.fn();
    const inputs = hostElements(
      MedicineScheduleView(view({ onTime })),
      "input",
    );
    const change = inputs[0].props.onChange as (e: {
      target: { value: string };
    }) => void;
    change({ target: { value: "" } });
    expect(onTime).not.toHaveBeenCalled();
    change({ target: { value: "19:30" } });
    expect(onTime).toHaveBeenCalledWith(rows[0].schedule, 1170);
  });

  it("removes only through the Xóa button of an added medicine", () => {
    const onRemove = vi.fn();
    const [button] = findElements(
      MedicineScheduleView(view({ onRemove })),
      (el) => el.type === "button" && el.props.children === "Xóa",
    );
    (button.props.onClick as () => void)();
    expect(onRemove).toHaveBeenCalledWith(rows[3].schedule);
  });
});

describe("AddMedicineForm", () => {
  it("has a labelled name field limited to 80 characters and a Thêm button", () => {
    const html = renderToStaticMarkup(
      <AddMedicineForm busy={false} onAdd={() => null} />,
    );
    expect(html).toContain(">Tên thuốc khác</label>");
    expect(html).toContain('maxLength="80"');
    expect(html).toContain('placeholder="Ví dụ: Canxi"');
    expect(html).toContain(">Thêm</button>");
  });
});
