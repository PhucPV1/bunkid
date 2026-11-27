import type { ComponentProps } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { findElements } from "@/components/ui/testTree";
import type { Visit } from "@/lib/data/illness";
import type { Baby, PhotoRow } from "@/lib/supabase/rows";
import { VisitsCard, VisitsCardView } from "./VisitsCard";

const state = vi.hoisted(() => ({ online: true }));
vi.mock("@/lib/data/photos", () => ({
  usePhotoUrls: (paths: string[]) => ({
    data: Object.fromEntries(paths.map((path) => [path, `https://x/${path}`])),
  }),
  usePhotoActions: () => ({ remove: { isPending: false, mutate: () => {} } }),
  usePhotosUsage: () => ({ data: 0 }),
}));
vi.mock("@/lib/data/illness", () => ({
  useVisitActions: () => ({}),
  useVisits: () => ({ data: undefined }),
}));
vi.mock("@/lib/hooks/useOnline", () => ({ useOnline: () => state.online }));

const iso = (text: string) =>
  new Date(`${text.replace(" ", "T")}:00+07:00`).toISOString();
const photo = (id: string, visitId: string) =>
  ({ id, visit_id: visitId, storage_path: `f1/b1/${id}.jpg` }) as PhotoRow;
const visit = (
  id: string,
  episodeId: string,
  at: string,
  over: Partial<Visit> = {},
): Visit =>
  ({
    id,
    episode_id: episodeId,
    baby_id: "b1",
    visited_at: iso(at),
    place: null,
    conclusion: null,
    advice: null,
    created_by: "u1",
    created_at: iso(at),
    updated_at: iso(at),
    photos: [],
    ...over,
  }) as Visit;

type ViewProps = ComponentProps<typeof VisitsCardView>;
const viewProps = (over: Partial<ViewProps> = {}): ViewProps => ({
  status: "ready",
  error: null,
  rows: [],
  online: true,
  onRetry: () => {},
  onAdd: () => {},
  onOpen: () => {},
  onPhoto: () => {},
  ...over,
});
const view = (over: Partial<ViewProps> = {}) =>
  renderToStaticMarkup(<VisitsCardView {...viewProps(over)} />);
const row = (over: Partial<ViewProps["rows"][number]> = {}) => ({
  id: "v1",
  heading: "25/11 09:15 · Phòng khám Nhi",
  conclusion: "Viêm họng",
  advice: "Uống nhiều nước.\nTái khám nếu sốt cao.",
  photos: [],
  ...over,
});

beforeEach(() => {
  state.online = true;
});

// Spec 2026-11-26 §8.3.
describe("VisitsCardView", () => {
  it("the title with Thêm; no visit yet: one line", () => {
    const html = view();
    expect(html).toContain(">Lần khám</h2>");
    expect(html).toMatch(/<button(?![^>]*disabled="")[^>]*>.*Thêm<\/button>/);
    expect(html).toContain(">Chưa có lần khám nào.</p>");
  });

  it("a visit: the time and place, the doctor's conclusion under its label, the advice, the photos", () => {
    const html = view({
      rows: [
        row({
          photos: [
            { id: "p1", src: "https://x/p1.jpg" },
            { id: "p2", src: undefined },
          ],
        }),
      ],
    });
    const order = [
      ">25/11 09:15 · Phòng khám Nhi</span>",
      ">Bác sĩ kết luận</span>",
      ">Viêm họng</span>",
      ">Uống nhiều nước.\nTái khám nếu sốt cao.</span>",
    ].map((mark) => html.indexOf(mark));
    expect(order[0]).toBeGreaterThan(-1);
    expect(order).toEqual([...order].sort((a, b) => a - b));
    expect(html).toContain("whitespace-pre-line");
    expect(html.match(/h-\[78px\] w-\[60px\]/g)).toHaveLength(2);
    expect(html.match(/<img/g)).toHaveLength(1);
    expect(html).not.toContain("Chưa có lần khám nào.");
  });

  it("without a conclusion there is no label either", () => {
    const html = view({ rows: [row({ conclusion: null, advice: null })] });
    expect(html).not.toContain("Bác sĩ kết luận");
  });

  it("loading, offline and failed", () => {
    expect(view({ status: "loading" })).toContain("animate-[kb-pulse");
    expect(view({ status: "offline" })).toContain(
      "Cần mạng để tải lần khám. Trang sẽ tự tải khi có mạng lại.",
    );
    const failed = view({ status: "error", error: "Có lỗi xảy ra: boom" });
    expect(failed).toContain(">Có lỗi xảy ra: boom</p>");
    expect(failed).toContain(">Thử lại</button>");
    for (const status of ["loading", "offline", "error"] as const)
      expect(view({ status })).toMatch(/disabled=""[^>]*>.*Thêm<\/button>/);
  });

  it("offline: the note, and Thêm is off", () => {
    const html = view({ online: false });
    expect(html).toContain("Cần kết nối mạng để thay đổi các mục dưới đây.");
    expect(html).toMatch(/disabled=""[^>]*>.*Thêm<\/button>/);
  });

  it("Thêm, a visit and a photo report their taps", () => {
    const onAdd = vi.fn();
    const onOpen = vi.fn();
    const onPhoto = vi.fn();
    const tree = VisitsCardView(
      viewProps({
        rows: [row({ photos: [{ id: "p1", src: "https://x/p1.jpg" }] })],
        onAdd,
        onOpen,
        onPhoto,
      }),
    );
    const buttons = findElements(tree, (el) => el.type === "button");
    for (const button of buttons) (button.props.onClick as () => void)();
    const [add] = findElements(tree, (el) => el.props.onClick === onAdd);
    expect(add).toBeDefined();
    expect(onOpen).toHaveBeenCalledWith("v1");
    expect(onPhoto).toHaveBeenCalledWith("v1", "p1");
  });
});

describe("VisitsCard", () => {
  const baby = { id: "b1", family_id: "f1", name: "Bun" } as unknown as Baby;
  const card = (visits: Record<string, unknown>) =>
    renderToStaticMarkup(
      <VisitsCard
        baby={baby}
        userId="u1"
        isOwner={false}
        episode={{
          id: "e1",
          started_at: iso("2026-11-24 23:30"),
          ended_at: null,
        }}
        visits={visits as never}
      />,
    );

  it("shows the visits of this episode, oldest first, with their photos", () => {
    const html = card({
      data: [
        visit("v2", "e1", "2026-11-26 08:00", { place: "Bệnh viện Nhi" }),
        visit("v9", "e2", "2026-11-25 08:00", { place: "Khác" }),
        visit("v1", "e1", "2026-11-25 09:15", {
          photos: [photo("p1", "v1")],
        }),
      ],
      isPending: false,
      isError: false,
      fetchStatus: "idle",
    });
    expect(html).not.toContain("Khác");
    expect(html.indexOf(">25/11 09:15</span>")).toBeGreaterThan(-1);
    expect(html.indexOf(">25/11 09:15</span>")).toBeLessThan(
      html.indexOf(">26/11 08:00 · Bệnh viện Nhi</span>"),
    );
    expect(html).toContain('src="https://x/f1/b1/p1.jpg"');
  });

  it("waits for the network when the visits never loaded", () => {
    expect(
      card({
        data: undefined,
        isPending: true,
        isError: false,
        fetchStatus: "paused",
      }),
    ).toContain("Cần mạng để tải lần khám.");
  });
});
