import type { ComponentProps, FormEvent } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { findElements } from "@/components/ui/testTree";
import type { Visit } from "@/lib/data/illness";
import type { PhotoRow } from "@/lib/supabase/rows";
import { VisitSheet, VisitSheetView } from "./VisitSheet";

const state = vi.hoisted(() => ({
  online: true,
  usage: 0,
  visits: undefined as unknown,
}));
const action = () => ({ isPending: false, mutate: vi.fn() });
const actions = vi.hoisted(() => ({
  add: { isPending: false, mutate: vi.fn() },
  update: { isPending: false, mutate: vi.fn() },
  remove: { isPending: false, mutate: vi.fn() },
  removePhoto: { isPending: false, mutate: vi.fn() },
}));

vi.mock("@/lib/data/illness", () => ({
  useVisitActions: () => actions,
  useVisits: () => ({ data: state.visits }),
}));
vi.mock("@/lib/data/photos", () => ({
  usePhotosUsage: () => ({ data: state.usage }),
  usePhotoUrls: (paths: string[]) => ({
    data: Object.fromEntries(paths.map((path) => [path, `https://x/${path}`])),
  }),
}));
vi.mock("@/lib/hooks/useOnline", () => ({ useOnline: () => state.online }));

const iso = (text: string) =>
  new Date(`${text.replace(" ", "T")}:00+07:00`).toISOString();
const episode = {
  id: "e1",
  started_at: iso("2026-11-24 23:30"),
  ended_at: null,
};
const photo = (id: string, createdBy: string) =>
  ({
    id,
    visit_id: "v1",
    created_by: createdBy,
    storage_path: `f1/b1/${id}.jpg`,
  }) as PhotoRow;
const saved = (photos: PhotoRow[], createdBy = "u2"): Visit =>
  ({
    id: "v1",
    episode_id: "e1",
    baby_id: "b1",
    visited_at: iso("2026-11-25 09:15"),
    place: "Phòng khám Nhi",
    conclusion: "Viêm họng",
    advice: "Uống nhiều nước",
    created_by: createdBy,
    created_at: iso("2026-11-25 09:15"),
    updated_at: iso("2026-11-25 09:15"),
    photos,
  }) as Visit;

type ViewProps = ComponentProps<typeof VisitSheetView>;
const viewProps = (over: Partial<ViewProps> = {}): ViewProps => ({
  formId: "f1",
  raw: { at: "2026-11-25T09:15", place: "", conclusion: "", advice: "" },
  error: null,
  message: null,
  failed: 0,
  photos: [],
  room: true,
  full: false,
  online: true,
  saving: false,
  busy: false,
  deletion: "hidden",
  dirty: false,
  inputKey: 0,
  onRaw: () => {},
  onSubmit: () => {},
  onRetry: () => {},
  onPick: () => {},
  onDeletePhoto: () => {},
  onDelete: () => {},
  onClose: () => {},
  ...over,
});
const view = (over: Partial<ViewProps> = {}) =>
  renderToStaticMarkup(<VisitSheetView {...viewProps(over)} />);
const tiles = (n: number, pending = false) =>
  Array.from({ length: n }, (_, i) => ({
    key: `p${i}`,
    src: `https://x/p${i}.jpg`,
    deletable: true,
    pending,
  }));

beforeEach(() => {
  state.online = true;
  state.usage = 0;
  state.visits = undefined;
  for (const name of ["add", "update", "remove", "removePhoto"] as const)
    Object.assign(actions[name], action());
});

// Spec 2026-11-26 §8.4.
describe("VisitSheetView", () => {
  it("the sheet: its line, the four fields, the photos, then Lưu", () => {
    const html = view();
    expect(html).toContain(">Lần khám</h2>");
    expect(html).toContain(">Chỉ cần ngày giờ. Các ô khác điền được sau.</p>");
    const order = [
      ">Lúc khám</span>",
      ">Nơi khám</span>",
      ">Bác sĩ kết luận</span>",
      ">Lời dặn</span>",
      ">Ảnh đơn thuốc, giấy khám</span>",
      ">Lưu</button>",
    ].map((mark) => html.indexOf(mark));
    expect(order[0]).toBeGreaterThan(-1);
    expect(order).toEqual([...order].sort((a, b) => a - b));
    expect(html).toContain('type="datetime-local"');
    expect(html).toContain('value="2026-11-25T09:15"');
    expect(html).toMatch(/<input[^>]*maxLength="80"/);
    expect(html).toMatch(/<input[^>]*maxLength="120"/);
    expect(html).toMatch(/<textarea[^>]*rows="3"[^>]*maxLength="500"/);
    expect(html).toMatch(/<input[^>]*type="file"[^>]*accept="image\/\*"/);
    expect(html).toMatch(/>Thêm<input[^>]*type="file"/);
    expect(html).not.toContain("Xóa lần khám");
    expect(html).not.toContain('role="alert"');
  });

  it("an error sits under Lúc khám", () => {
    const html = view({ error: "Lúc khám nằm ngoài đợt ốm." });
    const at = html.indexOf(">Lúc khám</span>");
    const error = html.indexOf(">Lúc khám nằm ngoài đợt ốm.</span>");
    expect(at).toBeLessThan(error);
    expect(error).toBeLessThan(html.indexOf(">Nơi khám</span>"));
  });

  it("Lưu waits for a time", () => {
    const html = view({
      raw: { at: "", place: "", conclusion: "", advice: "" },
    });
    expect(html).toMatch(/<button[^>]*disabled=""[^>]*>Lưu<\/button>/);
  });

  it("up to six photos: the sixth hides Thêm", () => {
    expect(view({ photos: tiles(5) }).match(/<img/g)).toHaveLength(5);
    const html = view({ photos: tiles(6), room: false });
    expect(html.match(/<img/g)).toHaveLength(6);
    expect(html).not.toContain(">Thêm<");
    expect(html).not.toContain('type="file"');
  });

  it("a photo has a delete button only when it may be deleted", () => {
    const photos = [
      { ...tiles(1)[0], deletable: false },
      { ...tiles(2)[1], deletable: true },
    ];
    expect(view({ photos }).match(/aria-label="Xóa ảnh"/g)).toHaveLength(1);
  });

  it("a photo not sent yet has a dashed outline, so it shows which ones wait", () => {
    const html = view({
      photos: [...tiles(1), { ...tiles(2, true)[1] }],
    });
    expect(html.match(/outline-dashed/g)).toHaveLength(1);
    expect(html.indexOf("outline-dashed")).toBeGreaterThan(
      html.indexOf('src="https://x/p0.jpg"'),
    );
  });

  it("a full store hides Thêm and says why", () => {
    const html = view({ full: true });
    expect(html).not.toContain(">Thêm<");
    expect(html).toContain(
      "Kho ảnh đã đầy. Xóa bớt ảnh ở trang Ảnh để thêm ảnh mới.",
    );
    expect(view({ full: true, room: false })).not.toContain("Kho ảnh");
  });

  it("photos that did not go up: an error card that tries again", () => {
    const onRetry = vi.fn();
    const html = view({ failed: 2, onRetry });
    expect(html).toContain("Lần khám đã lưu, còn 2 ảnh chưa tải được.");
    expect(html).toContain(">Thử lại</button>");
    const tree = VisitSheetView(viewProps({ failed: 2, onRetry }));
    const [card] = findElements(tree, (el) => el.props.onRetry !== undefined);
    (card.props.onRetry as () => void)();
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it("while a save is on its way the error card waits, so Thử lại cannot start a second one", () => {
    const html = view({ failed: 2, busy: true, saving: true });
    expect(html).not.toContain("Lần khám đã lưu");
    expect(html).not.toContain(">Thử lại</button>");
    expect(html).toMatch(/aria-busy="true"[^>]*>Lưu</);
  });

  it("offline: a note; Lưu, Thêm and the deletes are off; a photo not sent yet can still go", () => {
    const html = view({
      online: false,
      deletion: "allowed",
      photos: [...tiles(1), { ...tiles(2, true)[1] }],
    });
    expect(html).toContain("Cần kết nối mạng để thay đổi các mục dưới đây.");
    expect(html).toMatch(/<button[^>]*disabled=""[^>]*>Lưu<\/button>/);
    expect(html).toMatch(/<input[^>]*type="file"[^>]*disabled=""/);
    expect(html).toMatch(/<button[^>]*disabled=""[^>]*>Xóa lần khám<\/button>/);
    const deletes = html.match(/<button[^>]*aria-label="Xóa ảnh"[^>]*>/g) ?? [];
    expect(deletes).toHaveLength(2);
    expect(deletes[0]).toContain('disabled=""');
    expect(deletes[1]).not.toContain('disabled=""');
  });

  it("Xóa lần khám: on, or off with the reason", () => {
    expect(view({ deletion: "allowed" })).toMatch(
      /<button(?![^>]*disabled="")[^>]*text-danger![^>]*>Xóa lần khám<\/button>/,
    );
    const blocked = view({ deletion: "blocked" });
    expect(blocked).toMatch(
      /<button[^>]*disabled=""[^>]*>Xóa lần khám<\/button>/,
    );
    expect(blocked).toContain(
      ">Còn ảnh do người khác thêm. Nhờ người đó hoặc chủ gia đình xóa trước.</p>",
    );
  });

  it("a refusal is announced above the buttons", () => {
    expect(view({ message: "Mất kết nối mạng, thử lại sau." })).toMatch(
      /role="alert"[^>]*>Mất kết nối mạng, thử lại sau.<\/p>/,
    );
  });

  it("the fields, the photo picker and the buttons report to the sheet", () => {
    const onRaw = vi.fn();
    const onSubmit = vi.fn();
    const onPick = vi.fn();
    const onDeletePhoto = vi.fn();
    const onDelete = vi.fn();
    const props = viewProps({
      photos: tiles(1),
      deletion: "allowed",
      onRaw,
      onSubmit,
      onPick,
      onDeletePhoto,
      onDelete,
    });
    const tree = VisitSheetView(props);
    const change = (type: string, index: number, value: unknown) => {
      const fields = findElements(tree, (el) => el.type === type);
      (fields[index].props.onChange as (event: unknown) => void)({
        target: value,
      });
    };
    change("input", 0, { value: "2026-11-25T10:00" });
    expect(onRaw).toHaveBeenLastCalledWith({
      ...props.raw,
      at: "2026-11-25T10:00",
    });
    change("input", 1, { value: "Nhà" });
    expect(onRaw).toHaveBeenLastCalledWith({ ...props.raw, place: "Nhà" });
    change("input", 2, { value: "Sốt siêu vi" });
    expect(onRaw).toHaveBeenLastCalledWith({
      ...props.raw,
      conclusion: "Sốt siêu vi",
    });
    change("textarea", 0, { value: "Tái khám nếu sốt cao" });
    expect(onRaw).toHaveBeenLastCalledWith({
      ...props.raw,
      advice: "Tái khám nếu sốt cao",
    });
    const file = { name: "a.jpg" } as File;
    change("input", 3, { files: [file] });
    expect(onPick).toHaveBeenCalledWith(file);
    change("input", 3, { files: [] });
    expect(onPick).toHaveBeenCalledOnce();
    const [form] = findElements(tree, (el) => el.type === "form");
    const event = { preventDefault: () => {} } as FormEvent;
    (form.props.onSubmit as (event: FormEvent) => void)(event);
    expect(onSubmit).toHaveBeenCalledWith(event);
    const [x] = findElements(
      tree,
      (el) => el.props["aria-label"] === "Xóa ảnh",
    );
    (x.props.onClick as () => void)();
    expect(onDeletePhoto).toHaveBeenCalledWith("p0");
    const [remove] = findElements(
      tree,
      (el) => el.props.children === "Xóa lần khám",
    );
    (remove.props.onClick as () => void)();
    expect(onDelete).toHaveBeenCalledOnce();
  });
});

describe("VisitSheet", () => {
  const sheet = (visit: Visit | null, userId = "u2", isOwner = false) =>
    renderToStaticMarkup(
      <VisitSheet
        baby={{ id: "b1", family_id: "f1" }}
        userId={userId}
        isOwner={isOwner}
        episode={episode}
        visit={visit}
        onClose={() => {}}
      />,
    );

  it("a new visit opens on now, with Thêm and no delete", () => {
    vi.useFakeTimers({ now: new Date("2026-11-26T10:00:30+07:00") });
    const html = sheet(null);
    vi.useRealTimers();
    expect(html).toContain('value="2026-11-26T10:00"');
    expect(html).toMatch(/>Thêm<input[^>]*type="file"/);
    expect(html).not.toContain("Xóa lần khám");
  });

  it("a saved visit opens on its values and its photos", () => {
    const visit = saved([photo("p1", "u2"), photo("p2", "u1")]);
    state.visits = [visit];
    const html = sheet(visit);
    expect(html).toContain('value="2026-11-25T09:15"');
    expect(html).toContain('value="Phòng khám Nhi"');
    expect(html).toContain('value="Viêm họng"');
    expect(html).toContain(">Uống nhiều nước</textarea>");
    expect(html).toContain('src="https://x/f1/b1/p1.jpg"');
    expect(html).toContain('src="https://x/f1/b1/p2.jpg"');
    // u2 added p1 and the visit; p2 is u1's.
    expect(html.match(/aria-label="Xóa ảnh"/g)).toHaveLength(1);
    expect(html).toMatch(/disabled=""[^>]*>Xóa lần khám<\/button>/);
    expect(html).toContain("Còn ảnh do người khác thêm.");
  });

  it("the owner may delete every photo and the visit", () => {
    const visit = saved([photo("p1", "u2"), photo("p2", "u1")]);
    const html = sheet(visit, "u9", true);
    expect(html.match(/aria-label="Xóa ảnh"/g)).toHaveLength(2);
    expect(html).toMatch(
      /<button(?![^>]*disabled="")[^>]*>Xóa lần khám<\/button>/,
    );
  });

  it("six photos hide Thêm; a full store hides it too", () => {
    const six = saved(
      Array.from({ length: 6 }, (_, i) => photo(`p${i}`, "u2")),
    );
    expect(sheet(six)).not.toContain(">Thêm<");
    state.usage = 1000 * 1024 ** 2;
    expect(sheet(null)).toContain("Kho ảnh đã đầy.");
  });

  it("offline, Lưu is off", () => {
    state.online = false;
    expect(sheet(null)).toMatch(/disabled=""[^>]*>Lưu<\/button>/);
  });
});
