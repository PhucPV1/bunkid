import { type ComponentProps, createRef } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { findElements, hostElements } from "@/components/ui/testTree";
import { symptomDay, type SymptomLog } from "@/lib/rules/symptomDay";
import { ICON_PATHS } from "@/lib/ui/icons";
import { DayStrip, SymptomDaySheetView } from "./SymptomDaySheet";

const iso = (text: string) =>
  new Date(`${text.replace(" ", "T")}:00+07:00`).toISOString();
const log = (
  id: string,
  time: string,
  details: unknown,
  createdBy = "me",
): SymptomLog => ({
  id,
  type: "symptom",
  started_at: iso(time),
  ended_at: iso(time),
  details,
  note: null,
  created_by: createdBy,
});
const mine = (createdBy: string) => createdBy === "me";

// Spec 2026-11-27 §4.3.
describe("DayStrip", () => {
  const strip = (
    over: Partial<ComponentProps<typeof DayStrip>> = {},
  ): ComponentProps<typeof DayStrip> => ({
    label: "Ngày nào? · đợt ốm từ 25/11",
    days: [
      { day: "2026-11-25", top: "Ngày 1", bottom: "25/11" },
      { day: "2026-11-26", top: "Ngày 2", bottom: "26/11" },
      { day: "2026-11-27", top: "Hôm nay", bottom: "27/11" },
    ],
    selected: "2026-11-26",
    marked: ["2026-11-25", "2026-11-26"],
    other: null,
    min: "2026-09-10",
    max: "2026-11-27",
    onPick: () => {},
    ...over,
  });

  it("a label, one 64 px cell per day, the picked one filled, a dot on logged days, then Khác", () => {
    const html = renderToStaticMarkup(<DayStrip {...strip()} />);
    expect(html).toContain(">Ngày nào? · đợt ốm từ 25/11</span>");
    expect(html).toContain('role="group" aria-label="Ngày nào?"');
    expect(html).toContain("overflow-x-auto");
    const cells = html.split("<button").slice(1);
    expect(cells).toHaveLength(3);
    for (const cell of cells) {
      expect(cell).toContain("w-16");
      expect(cell).toContain("min-h-16");
      expect(cell).toContain("rounded-[18px]");
    }
    expect(cells[0]).toMatch(/aria-pressed="false" class="[^"]*glass/);
    expect(cells[1]).toMatch(
      /aria-pressed="true" class="[^"]*bg-accent text-on-accent/,
    );
    expect(cells[1]).toContain(">Ngày 2</span>");
    expect(cells[1]).toContain(">26/11</span>");
    expect(cells[0]).toContain("size-1.5 rounded-full bg-accent");
    expect(cells[1]).toContain("size-1.5 rounded-full bg-on-accent");
    expect(cells[2]).not.toContain("size-1.5");
    expect(cells[0]).toContain('<span class="sr-only">, đã ghi</span>');
    expect(html).toContain(`d="${ICON_PATHS.calendar}"`);
    expect(html).toMatch(
      /<input type="date" aria-label="Chọn ngày khác" min="2026-09-10" max="2026-11-27" class="[^"]*opacity-0[^"]*" value=""\/>/,
    );
    expect(html).toMatch(/>Khác<\/span><input/);
  });

  it("a day outside the strip: Khác is filled and shows that day", () => {
    const html = renderToStaticMarkup(
      <DayStrip {...strip({ selected: "2026-11-10", other: "2026-11-10" })} />,
    );
    expect(html).not.toContain('aria-pressed="true"');
    expect(html).toMatch(/<label class="[^"]*bg-accent text-on-accent/);
    expect(html).toMatch(/>10\/11<\/span><input[^>]*value="2026-11-10"/);
  });

  it("the scrolling row takes the ref its sheet scrolls with; cells stay oldest → today → Khác", () => {
    const scrollRef = createRef<HTMLDivElement>();
    const rows = hostElements(DayStrip(strip({ scrollRef })), "div").filter(
      (el) => el.props.role === "group",
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].props.ref).toBe(scrollRef);
    const html = renderToStaticMarkup(<DayStrip {...strip()} />);
    expect(html.indexOf(">Ngày 1</span>")).toBeLessThan(
      html.indexOf(">Hôm nay</span>"),
    );
    expect(html.indexOf(">Hôm nay</span>")).toBeLessThan(
      html.indexOf(">Khác</span>"),
    );
  });

  it("a cell or the date field picks a day", () => {
    const onPick = vi.fn();
    const tree = DayStrip(strip({ onPick }));
    const buttons = hostElements(tree, "button");
    (buttons[2].props.onClick as () => void)();
    expect(onPick).toHaveBeenLastCalledWith("2026-11-27");
    const [input] = hostElements(tree, "input");
    const change = input.props.onChange as (event: {
      target: { value: string };
    }) => void;
    change({ target: { value: "2026-11-02" } });
    expect(onPick).toHaveBeenLastCalledWith("2026-11-02");
    change({ target: { value: "" } });
    expect(onPick).toHaveBeenCalledTimes(2);
  });
});

// Spec 2026-11-27 §4.2, §5.
describe("SymptomDaySheetView", () => {
  const day = (logs: SymptomLog[] = [], date = "2026-11-25") =>
    symptomDay(logs, date, mine);
  const props = (
    over: Partial<ComponentProps<typeof SymptomDaySheetView>> = {},
  ): ComponentProps<typeof SymptomDaySheetView> => ({
    title: "Triệu chứng",
    sub: null,
    strip: null,
    status: "ready",
    day: day(),
    picked: "",
    note: "",
    ageDays: 76,
    dirty: false,
    saving: false,
    message: null,
    deletable: false,
    onPicked: () => {},
    onNote: () => {},
    onSave: () => {},
    onDelete: () => {},
    onClose: () => {},
    ...over,
  });
  const render = (
    over: Partial<ComponentProps<typeof SymptomDaySheetView>> = {},
  ) => renderToStaticMarkup(<SymptomDaySheetView {...props(over)} />);
  const saveButton = (html: string) =>
    html.match(/<button[^>]*>Lưu<\/button>/)?.[0] ?? "";

  it("an empty day: the plain hint, the chips, the note; Lưu off until a chip is on", () => {
    const html = render();
    expect(html).toContain(">Triệu chứng</h2>");
    expect(html).toContain("bg-cat-med/15 text-cat-med");
    expect(html).toContain(">Bấm những gì bé có trong ngày.</p>");
    expect(html).toContain(">Hay gặp</span>");
    expect(html).toContain(">Ghi chú (không bắt buộc)</span>");
    expect(html).toMatch(/<textarea rows="3" maxLength="200" disabled=""/);
    expect(html).toContain(">Bật ít nhất một triệu chứng để ghi chú.</p>");
    expect(saveButton(html)).toContain('disabled=""');
    expect(html).not.toContain("Xóa triệu chứng ngày này");
    const on = render({ picked: "cough" });
    expect(saveButton(on)).not.toContain('disabled=""');
    expect(on).not.toMatch(/<textarea[^>]*disabled=""/);
    expect(on).not.toContain("Bật ít nhất một triệu chứng");
  });

  it("a day with symptoms: the line saying what was logged", () => {
    const html = render({
      day: day([
        log("a", "2026-11-25 08:00", { codes: ["cough", "runny_nose"] }),
      ]),
      picked: "runny_nose,cough",
    });
    expect(html).toContain(
      ">Ngày này đã ghi Sổ mũi, Ho. Bấm để thêm hoặc bỏ rồi Lưu.</p>",
    );
    expect(html).toContain("bg-accent-tint");
  });

  it("another's chips are locked, with a line saying why; their notes show under the field", () => {
    const html = render({
      day: day([
        log(
          "c",
          "2026-11-25 09:00",
          { codes: ["fever"], note: "bà ghi" },
          "ba",
        ),
      ]),
      picked: "fever",
    });
    expect(html).toMatch(/aria-disabled="true"[^>]*>✓ Sốt<\/button>/);
    expect(html).toContain(
      ">Chip mờ do người khác ghi, chỉ họ hoặc chủ gia đình bỏ được.</p>",
    );
    expect(html).toContain(">Người khác ghi: bà ghi</p>");
    // Only another's chip is on: the note waits for one of the viewer's own.
    expect(html).toMatch(/<textarea[^>]*disabled=""/);
    expect(saveButton(html)).not.toContain('disabled=""');
  });

  it("loading and a load error: no chips, no note, Lưu off", () => {
    const loading = render({ status: "loading", picked: "cough" });
    expect(loading).toContain(">Đang tải…</p>");
    expect(loading).not.toContain(">Hay gặp</span>");
    expect(loading).not.toContain("<textarea");
    expect(saveButton(loading)).toContain('disabled=""');
    const failed = render({ status: "error", picked: "cough" });
    expect(failed).toContain(
      'role="alert" class="text-[15px] text-danger">Không tải được triệu chứng đã ghi</p>',
    );
    expect(saveButton(failed)).toContain('disabled=""');
  });

  it("the fixed day: its title, its line, no strip, and the delete button when allowed", () => {
    const html = render({
      title: "Triệu chứng · 25/11",
      sub: "Ngày 1 của đợt ốm · cả ngày",
      picked: "cough",
      deletable: true,
    });
    expect(html).toContain(">Triệu chứng · 25/11</h2>");
    expect(html).toContain(">Ngày 1 của đợt ốm · cả ngày</p>");
    expect(html).not.toContain('aria-label="Ngày nào?"');
    expect(html).toMatch(
      /<button type="button" class="[^"]*min-h-11[^"]*text-danger[^"]*">Xóa triệu chứng ngày này<\/button>/,
    );
    expect(html.indexOf(">Lưu</button>")).toBeLessThan(
      html.indexOf(">Xóa triệu chứng ngày này</button>"),
    );
  });

  it("the delete button waits while a save or delete is on its way", () => {
    const html = render({ picked: "cough", deletable: true, saving: true });
    expect(html).toMatch(
      /<button type="button" disabled=""[^>]*>Xóa triệu chứng ngày này<\/button>/,
    );
  });

  it("the strip mode draws the strip above the hint", () => {
    const html = render({
      strip: {
        label: "Ngày nào?",
        days: [{ day: "2026-11-25", top: "Hôm nay", bottom: "25/11" }],
        selected: "2026-11-25",
        marked: [],
        other: null,
        min: "2026-09-10",
        max: "2026-11-25",
        onPick: () => {},
      },
    });
    expect(html.indexOf('aria-label="Ngày nào?"')).toBeLessThan(
      html.indexOf(">Bấm những gì bé có trong ngày.</p>"),
    );
  });

  it("a message is an alert above Lưu", () => {
    const html = render({
      picked: "cough",
      message: "Ghi chú dài quá 200 ký tự",
    });
    expect(html).toContain(
      'role="alert" class="text-[15px] text-danger">Ghi chú dài quá 200 ký tự</p>',
    );
  });

  it("Lưu, Xóa and the note call back", () => {
    const onSave = vi.fn();
    const onDelete = vi.fn();
    const onNote = vi.fn();
    const tree = SymptomDaySheetView(
      props({ picked: "cough", deletable: true, onSave, onDelete, onNote }),
    );
    const buttons = findElements(
      tree,
      (el) => typeof el.props.onClick === "function",
    );
    const save = buttons.find((el) => el.props.children === "Lưu");
    const remove = buttons.find(
      (el) => el.props.children === "Xóa triệu chứng ngày này",
    );
    (save?.props.onClick as () => void)();
    (remove?.props.onClick as () => void)();
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onDelete).toHaveBeenCalledTimes(1);
    const [textarea] = findElements(tree, (el) => el.type === "textarea");
    (textarea.props.onChange as (event: { target: { value: string } }) => void)(
      { target: { value: "ho" } },
    );
    expect(onNote).toHaveBeenCalledWith("ho");
  });
});
