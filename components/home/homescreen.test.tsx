import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SyncBarProvider } from "@/components/sync/SyncSlot";
import type { Baby, LogRow } from "@/lib/supabase/rows";
import { HomeScreen } from "./HomeScreen";

const NOW = vi.hoisted(() => new Date("2026-11-14T05:00:00Z")); // 12:00 giờ VN
const state = vi.hoisted(() => ({
  logs: {} as Record<string, unknown>,
  actionError: null as Error | null,
  // The handler HomeScreen gave to the "Khác" button.
  onMore: null as ((event?: unknown) => void) | null,
}));
const openActionSheet = vi.hoisted(() => vi.fn());

vi.mock("@/lib/hooks/useNow", () => ({ useNow: () => NOW }));
vi.mock("@/lib/data/logs", () => ({
  useRecentLogs: () => state.logs,
  useFirstLogAt: () => ({ data: null }),
}));
vi.mock("@/lib/data/realtime", () => ({ useLogsRealtime: () => {} }));
vi.mock("@/lib/data/family", () => ({ useMembers: () => ({ data: [] }) }));
vi.mock("@/lib/data/emergency", () => ({ useEmergencyContacts: () => {} }));
vi.mock("@/lib/hooks/useOutboxEntries", () => ({ useOutboxEntries: () => [] }));
vi.mock("@/components/actions/QuickActions", () => ({
  useQuickActions: () => ({
    running: [],
    busy: false,
    error: state.actionError,
    pressTimer: () => {},
    stopTimer: () => {},
    openInstant: () => {},
    openActionSheet,
  }),
}));
vi.mock("./QuickLogGrid", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./QuickLogGrid")>();
  type Props = Parameters<typeof actual.QuickLogGrid>[0];
  return {
    QuickLogGrid: (props: Props) => {
      state.onMore = props.onMore;
      return actual.QuickLogGrid(props);
    },
  };
});
vi.mock("@/components/sync/SyncBar", () => ({
  SyncBar: ({ userId }: { userId: string }) => <p>sync:{userId}</p>,
}));

const baby = {
  id: "b1",
  family_id: "f1",
  name: "Bun",
  dob: "2026-09-10",
  feed_interval_min: 180,
} as Baby;

function render(logs: Record<string, unknown>) {
  state.logs = { refetch: () => {}, error: null, ...logs };
  return renderToStaticMarkup(
    <QueryClientProvider client={new QueryClient()}>
      <SyncBarProvider userId="u1">
        <HomeScreen baby={baby} userId="u1" />
      </SyncBarProvider>
    </QueryClientProvider>,
  );
}

const at = (time: string) => `2026-11-14T${time}:00.000Z`;
const row = (
  id: string,
  type: string,
  start: string,
  end: string | null,
  details: unknown = {},
): LogRow =>
  ({
    id,
    baby_id: "b1",
    type,
    started_at: at(start),
    ended_at: end === null ? null : at(end),
    details,
    note: null,
    created_by: "u1",
    created_at: at(start),
    updated_at: at(start),
  }) as LogRow;
const bottle = (id: string, time: string) =>
  row(id, "bottle", time, time, { ml: 90, milk: "formula" });
// A fever, a tummy timer past its limit, a running sleep, a feed two hours
// ago, a wet diaper and today's Vitamin D.
const DAY: LogRow[] = [
  row("s1", "sleep", "04:30", null),
  row("t1", "tummy", "04:00", null),
  bottle("f1", "03:00"),
  row("d1", "diaper", "04:00", "04:00", { wet: true, dirty: false }),
  row("m1", "medicine", "01:10", "01:10", {
    name: "Vitamin D",
    amount: 1,
    unit: "giọt",
    antipyretic: false,
  }),
  row("c1", "temperature", "04:50", "04:50", { celsius: 38.5, method: "nach" }),
];
const loaded = (data: LogRow[]) =>
  render({ data, isPending: false, isError: false, fetchStatus: "idle" });

function expectInOrder(html: string, marks: string[]) {
  const found = marks.map((mark) => html.indexOf(mark));
  expect(found[0], marks[0]).toBeGreaterThan(-1);
  for (let i = 1; i < marks.length; i += 1)
    expect(found[i], marks[i]).toBeGreaterThan(found[i - 1]);
}

beforeEach(() => {
  state.actionError = null;
  state.onMore = null;
  openActionSheet.mockClear();
});

describe("HomeScreen", () => {
  it("while logs load: header, sync line, then the home shapes and nothing else", () => {
    const html = render({
      data: undefined,
      isPending: true,
      isError: false,
      fetchStatus: "fetching",
    });
    expect(html.indexOf("<p>sync:u1</p>")).toBeGreaterThan(
      html.indexOf("</header>"),
    );
    expect(html).toContain('aria-busy="true"');
    expect(html).toContain("h-[300px]");
    expect(html.match(/kb-pulse/g)).toHaveLength(8);
    expect(html).not.toContain("Thay tã");
  });

  it("a load error replaces the hero with a retry card; logging buttons stay", () => {
    const html = render({
      data: undefined,
      isPending: false,
      isError: true,
      error: new Error("boom"),
      fetchStatus: "idle",
    });
    expect(html).toContain('role="alert"');
    expect(html).toContain(">Thử lại</button>");
    expect(html).toContain("Thay tã");
    expect(html).not.toContain("Gần đây");
    expect(html).not.toContain('aria-busy="true"');
    expect(html).not.toContain("Cữ bú tiếp");
  });

  it("offline at start (paused fetch) keeps the full page so logs can go to the outbox", () => {
    const html = render({
      data: undefined,
      isPending: true,
      isError: false,
      fetchStatus: "paused",
    });
    expect(html).not.toContain('aria-busy="true"');
    expect(html).toContain("Thay tã");
    expect(html).toContain("Gần đây");
    expect(html).not.toContain("Cữ bú tiếp");
    expect(html).not.toContain(">24 giờ qua<");
  });
});

// Spec 2026-11-19 §3.6.
describe("HomeScreen with logs", () => {
  it("stacks the blocks 14 px apart, in the spec's order", () => {
    state.actionError = new Error("boom");
    const html = loaded(DAY);
    expect(html).toMatch(/^<main class="[^"]*\bgap-3\.5\b[^"]*">/);
    expect(html).not.toContain("gap-[18px]");
    expectInOrder(html, [
      "</header>",
      "cần đi khám ngay",
      "Còn đang nằm sấp không?",
      ">Đang ngủ<",
      "Nằm sấp · 1 giờ 00 phút · Ai đó",
      ">Cữ bú tiếp<",
      "Vitamin D đã uống 08:10",
      ">Bấm giờ<",
      ">Ghi nhanh<",
      "Có lỗi xảy ra: boom",
      ">24 giờ qua<",
      ">Gần đây<",
    ]);
  });

  it("shows the three status tiles and the Vitamin D time, not the Vitamin D button", () => {
    const html = loaded(DAY);
    expect(html).toContain(">13:00</span>");
    expect(html).toContain(">còn 1g</span>");
    expect(html).toContain(">Bú gần nhất</span>");
    expect(html).toContain(">bình · 90 ml</span>");
    expect(html).toContain(">Tã gần nhất</span>");
    expect(html).toContain(">ướt</span>");
    expect(html).toContain(">Vitamin D đã uống 08:10</p>");
    expect(html).not.toContain("Ghi Vitamin D hôm nay");
  });

  it("keeps the Vitamin D button in its place, and no Vitamin D line, until the dose is logged", () => {
    state.actionError = new Error("boom");
    const html = loaded(DAY.filter((log) => log.type !== "medicine"));
    expect(html).not.toContain("Vitamin D đã uống");
    expectInOrder(html, [
      ">Ghi nhanh<",
      "Có lỗi xảy ra: boom",
      "Ghi Vitamin D hôm nay",
      ">24 giờ qua<",
    ]);
  });

  it("draws no hero card when there is nothing to say: the tiles follow the header", () => {
    const html = loaded([bottle("f1", "04:00")]);
    expect(html).not.toContain("rounded-[32px]");
    expect(html).toContain(">14:00</span>");
    expect(html).toContain(">còn 2g</span>");
    expectInOrder(html, ["</header>", ">Cữ bú tiếp<", ">Bấm giờ<"]);
  });

  it("shows only the non-zero totals, and no totals line when both are zero", () => {
    expect(loaded(DAY)).toContain(">Bình 90 ml</p>");
    const html = loaded([DAY[3]]);
    expect(html).toContain(">24 giờ qua<");
    expect(html).not.toMatch(/<p[^>]*>(Bình|Tã bẩn) /);
  });

  // Spec 2026-11-19 §5.4.
  it("Khác opens the + sheet with only the Khác group, whatever the click passes", () => {
    loaded(DAY);
    state.onMore?.({ type: "click" });
    expect(openActionSheet.mock.calls).toEqual([[["other"]]]);
  });
});
