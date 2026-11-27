import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { hostElements } from "@/components/ui/testTree";
import { SymptomFields } from "./SymptomFields";
import { SymptomPickerView } from "./SymptomPicker";

type ViewProps = Parameters<typeof SymptomPickerView>[0];
const props = (extra: Partial<ViewProps> = {}): ViewProps => ({
  value: "",
  onChange: () => {},
  ageDays: 76,
  expanded: false,
  onExpanded: () => {},
  ...extra,
});
const view = (extra: Partial<ViewProps> = {}) =>
  renderToStaticMarkup(<SymptomPickerView {...props(extra)} />);
const chipsOf = (html: string) =>
  [...html.matchAll(/aria-pressed="(true|false)"[^>]*>([^<]+)<\/button>/g)].map(
    (m) => [m[2], m[1] === "true"],
  );

// Spec 2026-11-26 §3.5.
describe("SymptomPickerView", () => {
  it("collapsed: the eight common chips by short name and one button to see the rest", () => {
    const html = view();
    expect(html).toContain(">Hay gặp</span>");
    expect(html).toContain('role="group" aria-label="Hay gặp"');
    expect(chipsOf(html)).toEqual([
      ["Sốt", false],
      ["Sổ mũi", false],
      ["Ho", false],
      ["Khò khè", false],
      ["Trớ sữa", false],
      ["Nôn", false],
      ["Tiêu chảy", false],
      ["Quấy", false],
    ]);
    expect(html).toMatch(
      /aria-expanded="false"[^>]*>Xem tất cả 22 triệu chứng<\/button>/,
    );
    expect(html).not.toContain(">Hô hấp</span>");
    expect(html.match(/min-h-11/g)).toHaveLength(9);
    expect(html).not.toContain("…");
  });

  it("a picked chip is filled and ticked, so it does not rely on colour", () => {
    const html = view({ value: "runny_nose,cough" });
    expect(chipsOf(html).slice(0, 3)).toEqual([
      ["Sốt", false],
      ["✓ Sổ mũi", true],
      ["✓ Ho", true],
    ]);
    expect(html).toMatch(/bg-ink[^"]*"[^>]*>✓ Ho<\/button>|bg-ink[^>]*>✓ Ho</);
    expect(html).toMatch(/glass[^>]*>Sốt</);
  });

  it("expanded: the other chips under their group names, and the button reads Thu gọn", () => {
    const html = view({ expanded: true });
    expect(html).toMatch(/aria-expanded="true"[^>]*>Thu gọn<\/button>/);
    expect(
      [...html.matchAll(/role="group" aria-label="([^"]+)"/g)].map((m) => m[1]),
    ).toEqual([
      "Hay gặp",
      "Hô hấp",
      "Tiêu hóa",
      "Da",
      "Hành vi, ăn bú",
      "Khác",
    ]);
    expect(chipsOf(html)).toHaveLength(22);
    expect(html).toContain(">Ho ông ổng</button>");
    expect(html).toContain(">Mảng trắng miệng</button>");
    // 76 days old: Chảy dãi starts at 90 days.
    expect(html).not.toContain("Chảy dãi");
    expect(html.indexOf("Thu gọn")).toBeLessThan(
      html.indexOf(">Hô hấp</span>"),
    );
  });

  it("collapsed: a picked chip that is not common stays in sight after the common ones", () => {
    const html = view({ value: "cough,gassy" });
    expect(chipsOf(html)).toHaveLength(9);
    expect(chipsOf(html)[8]).toEqual(["✓ Đầy hơi", true]);
    const open = view({ value: "cough,gassy", expanded: true });
    expect(open.match(/Đầy hơi/g)).toHaveLength(1);
  });

  it("a picked chip outside the baby's age still shows; a code the content lost does not", () => {
    const html = view({ value: "drooling,gone_code" });
    expect(chipsOf(html)[8]).toEqual(["✓ Chảy dãi", true]);
    expect(html).not.toContain("gone_code");
    expect(html).toContain(">Xem tất cả 23 triệu chứng</button>");
  });

  it("no age given: every symptom is offered", () => {
    expect(view({ ageDays: null })).toContain(
      ">Xem tất cả 23 triệu chứng</button>",
    );
  });

  it("a chip toggles its code; the button toggles the list", () => {
    const onChange = vi.fn();
    const onExpanded = vi.fn();
    const buttons = hostElements(
      SymptomPickerView(props({ value: "cough", onChange, onExpanded })),
      "button",
    );
    expect(buttons).toHaveLength(9);
    (buttons[1].props.onClick as () => void)();
    expect(onChange).toHaveBeenLastCalledWith("runny_nose,cough");
    (buttons[2].props.onClick as () => void)();
    expect(onChange).toHaveBeenLastCalledWith("");
    (buttons[8].props.onClick as () => void)();
    expect(onExpanded).toHaveBeenCalledWith(true);
    for (const button of buttons) expect(button.props.type).toBe("button");
  });

  it("spec 2026-11-27 §5.3: a locked chip stays on, is marked disabled and does nothing", () => {
    const onChange = vi.fn();
    const html = view({ value: "fever,cough", locked: ["fever"] });
    expect(html).toMatch(
      /aria-pressed="true" aria-disabled="true" class="[^"]*opacity-50[^"]*">✓ Sốt<\/button>/,
    );
    expect(html).toMatch(/aria-pressed="true" class="[^"]*">✓ Ho<\/button>/);
    const buttons = hostElements(
      SymptomPickerView(
        props({ value: "fever,cough", locked: ["fever"], onChange }),
      ),
      "button",
    );
    (buttons[0].props.onClick as () => void)();
    expect(onChange).not.toHaveBeenCalled();
    (buttons[2].props.onClick as () => void)();
    expect(onChange).toHaveBeenCalledWith("fever");
  });

  it("a code the content lost survives a toggle", () => {
    const onChange = vi.fn();
    const buttons = hostElements(
      SymptomPickerView(props({ value: "gone_code", onChange })),
      "button",
    );
    (buttons[0].props.onClick as () => void)();
    expect(onChange).toHaveBeenCalledWith("fever,gone_code");
  });
});

describe("SymptomFields", () => {
  const html = (values: Record<string, string>) =>
    renderToStaticMarkup(
      <SymptomFields values={values} onChange={() => {}} ageDays={76} />,
    );

  it("a hint line, the chips, then a note of at most 200 characters", () => {
    const empty = html({ codes: "", note: "" });
    expect(empty).toContain(">Bấm những gì bé đang có.</p>");
    expect(empty).toContain(">Hay gặp</span>");
    expect(empty).toContain(">Ghi chú (không bắt buộc)</span>");
    expect(empty).toMatch(/<textarea[^>]*rows="3"[^>]*maxLength="200"/);
    expect(empty.indexOf(">Hay gặp</span>")).toBeLessThan(
      empty.indexOf(">Ghi chú (không bắt buộc)</span>"),
    );
  });

  it("says how many are picked and shows the note", () => {
    const picked = html({ codes: "runny_nose,cough", note: "Ho về đêm" });
    expect(picked).toContain(">Bấm những gì bé đang có. Đã chọn 2.</p>");
    expect(picked).toContain(">Ho về đêm</textarea>");
  });
});
