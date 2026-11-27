import type { ComponentProps, FormEvent } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { findElements } from "@/components/ui/testTree";
import type { EpisodeRow } from "@/lib/supabase/rows";
import { EpisodeSheet, EpisodeSheetView } from "./EpisodeSheet";

const actions = vi.hoisted(() => ({
  update: { isPending: false, mutate: vi.fn() },
  remove: { isPending: false, mutate: vi.fn() },
}));
vi.mock("@/lib/data/illness", () => ({ useEpisodeActions: () => actions }));

const iso = (text: string) =>
  new Date(`${text.replace(" ", "T")}:00+07:00`).toISOString();
const row = (id: string, start: string, end: string | null): EpisodeRow => ({
  id,
  baby_id: "b1",
  started_at: iso(start),
  ended_at: end === null ? null : iso(end),
  created_by: "u1",
  created_at: iso(start),
  updated_at: iso(start),
});
const old = row("old", "2026-11-10 08:00", "2026-11-12 08:00");
const last = row("last", "2026-11-20 08:00", "2026-11-22 09:30");
const open = row("open", "2026-11-25 08:00", null);

type ViewProps = ComponentProps<typeof EpisodeSheetView>;
const viewProps = (over: Partial<ViewProps> = {}): ViewProps => ({
  formId: "f1",
  raw: { start: "2026-11-20T08:00", end: "2026-11-22T09:30" },
  errors: {},
  message: null,
  dirty: false,
  saving: false,
  busy: false,
  canReopen: false,
  canDelete: false,
  onRaw: () => {},
  onSubmit: () => {},
  onReopen: () => {},
  onDelete: () => {},
  onClose: () => {},
  ...over,
});
const view = (over: Partial<ViewProps> = {}) =>
  renderToStaticMarkup(<EpisodeSheetView {...viewProps(over)} />);

beforeEach(() => {
  actions.update.isPending = false;
  actions.remove.isPending = false;
});

// Spec 2026-11-26 §6.4.
describe("EpisodeSheetView", () => {
  it("a closed episode: Bắt đầu and Kết thúc, and Lưu submits the form", () => {
    const html = view();
    expect(html).toContain("<dialog");
    expect(html).toContain(">Sửa đợt ốm</h2>");
    expect(html).toContain(">Bắt đầu</span>");
    expect(html).toContain(">Kết thúc</span>");
    expect(html.match(/type="datetime-local"/g)).toHaveLength(2);
    expect(html).toContain('value="2026-11-20T08:00"');
    expect(html).toContain('value="2026-11-22T09:30"');
    expect(html).toContain('<form id="f1"');
    expect(html).toMatch(
      /<button[^>]*form="f1"[^>]*type="submit"[^>]*min-h-14![^>]*>Lưu<\/button>/,
    );
    expect(html).not.toContain("Mở lại đợt ốm");
    expect(html).not.toContain("Xóa đợt ốm");
  });

  it("an open episode has no Kết thúc", () => {
    const html = view({ raw: { start: "2026-11-25T08:00", end: null } });
    expect(html).toContain(">Bắt đầu</span>");
    expect(html).not.toContain("Kết thúc");
    expect(html.match(/type="datetime-local"/g)).toHaveLength(1);
  });

  it("an error sits under its own field", () => {
    const html = view({
      errors: {
        started_at: "Giờ bắt đầu ở tương lai.",
        ended_at: "Giờ kết thúc phải sau giờ bắt đầu.",
      },
    });
    const start = html.indexOf(">Bắt đầu</span>");
    const startError = html.indexOf(">Giờ bắt đầu ở tương lai.</span>");
    const end = html.indexOf(">Kết thúc</span>");
    const endError = html.indexOf(">Giờ kết thúc phải sau giờ bắt đầu.</span>");
    expect(start).toBeLessThan(startError);
    expect(startError).toBeLessThan(end);
    expect(end).toBeLessThan(endError);
    expect(html.match(/text-\[13px\] text-danger/g)).toHaveLength(2);
  });

  it("Mở lại đợt ốm and Xóa đợt ốm show only when they are allowed", () => {
    const html = view({ canReopen: true, canDelete: true });
    expect(html).toContain(">Mở lại đợt ốm</button>");
    expect(html).toMatch(/text-danger![^>]*>Xóa đợt ốm<\/button>/);
    expect(html.indexOf(">Lưu<")).toBeLessThan(html.indexOf(">Mở lại đợt ốm<"));
    expect(html.indexOf(">Mở lại đợt ốm<")).toBeLessThan(
      html.indexOf(">Xóa đợt ốm<"),
    );
  });

  it("a refusal is announced above the buttons; the buttons wait while a change is on its way", () => {
    const html = view({
      message: "Trùng thời gian với một đợt ốm khác.",
      canReopen: true,
      canDelete: true,
      busy: true,
    });
    expect(html).toMatch(
      /role="alert"[^>]*>Trùng thời gian với một đợt ốm khác.<\/p>/,
    );
    expect(
      html.match(
        /<button[^>]*disabled=""[^>]*>(Lưu|Mở lại đợt ốm|Xóa đợt ốm)</g,
      ),
    ).toHaveLength(3);
  });

  it("the fields and the buttons report to the sheet", () => {
    const onRaw = vi.fn();
    const onSubmit = vi.fn();
    const onReopen = vi.fn();
    const onDelete = vi.fn();
    const tree = EpisodeSheetView(
      viewProps({
        canReopen: true,
        canDelete: true,
        onRaw,
        onSubmit,
        onReopen,
        onDelete,
      }),
    );
    const inputs = findElements(tree, (el) => el.type === "input");
    expect(inputs).toHaveLength(2);
    const change = (index: number, value: string) =>
      (inputs[index].props.onChange as (event: unknown) => void)({
        target: { value },
      });
    change(0, "2026-11-20T07:00");
    expect(onRaw).toHaveBeenLastCalledWith({
      start: "2026-11-20T07:00",
      end: "2026-11-22T09:30",
    });
    change(1, "2026-11-22T10:00");
    expect(onRaw).toHaveBeenLastCalledWith({
      start: "2026-11-20T08:00",
      end: "2026-11-22T10:00",
    });
    const [form] = findElements(tree, (el) => el.type === "form");
    const event = { preventDefault: () => {} } as FormEvent;
    (form.props.onSubmit as (event: FormEvent) => void)(event);
    expect(onSubmit).toHaveBeenCalledWith(event);
    const press = (label: string) => {
      const [button] = findElements(tree, (el) => el.props.children === label);
      (button.props.onClick as () => void)();
    };
    press("Mở lại đợt ốm");
    press("Xóa đợt ốm");
    expect(onReopen).toHaveBeenCalledOnce();
    expect(onDelete).toHaveBeenCalledOnce();
  });
});

describe("EpisodeSheet", () => {
  const sheet = (
    episode: EpisodeRow,
    episodes: EpisodeRow[],
    canDelete = false,
  ) =>
    renderToStaticMarkup(
      <EpisodeSheet
        babyId="b1"
        userId="u1"
        episode={episode}
        episodes={episodes}
        canDelete={canDelete}
        onClose={() => {}}
        onDeleted={() => {}}
      />,
    );

  it("opens on the episode's own times, in Vietnam time", () => {
    const html = sheet(last, [old, last]);
    expect(html).toContain('value="2026-11-20T08:00"');
    expect(html).toContain('value="2026-11-22T09:30"');
    expect(
      sheet(open, [old, last, open]).match(/datetime-local/g),
    ).toHaveLength(1);
  });

  it("offers Mở lại đợt ốm only for the latest closed episode while none is open", () => {
    expect(sheet(last, [old, last])).toContain(">Mở lại đợt ốm</button>");
    expect(sheet(old, [old, last])).not.toContain("Mở lại đợt ốm");
    expect(sheet(last, [old, last, open])).not.toContain("Mở lại đợt ốm");
    expect(sheet(open, [old, last, open])).not.toContain("Mở lại đợt ốm");
  });

  it("offers Xóa đợt ốm only to whoever may delete", () => {
    expect(sheet(last, [old, last], true)).toContain(">Xóa đợt ốm</button>");
    expect(sheet(last, [old, last], false)).not.toContain("Xóa đợt ốm");
  });

  it("every button waits while a change is being queued", () => {
    actions.update.isPending = true;
    const html = sheet(last, [old, last], true);
    expect(html).toMatch(/aria-busy="true"[^>]*>Lưu</);
    expect(
      html.match(/<button[^>]*disabled=""[^>]*>(Mở lại đợt ốm|Xóa đợt ốm)</g),
    ).toHaveLength(2);
  });
});
