import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SyncBarProvider } from "@/components/sync/SyncSlot";
import type { Baby, EpisodeRow, LogRow } from "@/lib/supabase/rows";
import { HomeScreen } from "./HomeScreen";

const NOW = vi.hoisted(() => new Date("2026-11-14T05:00:00Z")); // 12:00 giờ VN
const state = vi.hoisted(() => ({
  logs: {} as Record<string, unknown>,
  actionError: null as Error | null,
  // The handler HomeScreen gave to the "Khác" button.
  onMore: null as ((event?: unknown) => void) | null,
  // The baby's illness episodes (useEpisodes) and the open one's logs.
  episodes: { data: undefined } as { data: EpisodeRow[] | undefined },
  rangeLogs: { data: undefined } as { data: LogRow[] | undefined },
  // Times kept on the device, by key.
  stored: {} as Record<string, number>,
  // What HomeScreen handed to the banners and to the episode cards.
  banners: null as Record<string, unknown> | null,
  card: null as Record<string, unknown> | null,
  reminder: null as Record<string, unknown> | null,
}));
const openActionSheet = vi.hoisted(() => vi.fn());
const openInstant = vi.hoisted(() => vi.fn());
const useRangeLogs = vi.hoisted(() => vi.fn());
const startEpisode = vi.hoisted(() => vi.fn());
const updateEpisode = vi.hoisted(() => vi.fn());
const markStored = vi.hoisted(() => vi.fn());
const toast = vi.hoisted(() => vi.fn());

vi.mock("@/lib/hooks/useNow", () => ({ useNow: () => NOW }));
vi.mock("@/lib/data/logs", () => ({
  useRecentLogs: () => state.logs,
  useFirstLogAt: () => ({ data: null }),
  useRangeLogs,
}));
vi.mock("@/lib/data/illness", () => ({
  useEpisodes: () => state.episodes,
  useEpisodeActions: () => ({
    start: { isPending: false, mutate: startEpisode },
    update: { isPending: false, mutate: updateEpisode },
  }),
}));
// The hook reads the device after the first render; here it has been read.
vi.mock("@/lib/hooks/useStoredTime", () => ({
  useStoredTime: (key: string | null) => ({
    at: key === null ? null : (state.stored[key] ?? null),
    mark: (now: Date) => markStored(key, now),
  }),
}));
vi.mock("@/components/ui/Toast", () => ({ useToast: () => toast }));
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
    openInstant,
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
vi.mock("./AlertBanners", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./AlertBanners")>();
  type Props = Parameters<typeof actual.AlertBanners>[0];
  return {
    AlertBanners: (props: Props) => {
      state.banners = props;
      return actual.AlertBanners(props);
    },
  };
});
vi.mock("./EpisodeHomeCards", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./EpisodeHomeCards")>();
  type CardProps = Parameters<typeof actual.EpisodeCard>[0];
  type ReminderProps = Parameters<typeof actual.CloseReminder>[0];
  return {
    EpisodeCard: (props: CardProps) => {
      state.card = props;
      return actual.EpisodeCard(props);
    },
    CloseReminder: (props: ReminderProps) => {
      state.reminder = props;
      return actual.CloseReminder(props);
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
  state.episodes = { data: undefined };
  state.rangeLogs = { data: undefined };
  state.stored = {};
  state.banners = null;
  state.card = null;
  state.reminder = null;
  for (const mock of [
    openActionSheet,
    openInstant,
    startEpisode,
    updateEpisode,
    markStored,
    toast,
  ])
    mock.mockClear();
  useRangeLogs.mockReset();
  useRangeLogs.mockImplementation(() => state.rangeLogs);
});

// The loading shapes follow the page of spec 2026-11-19 §3: hero 104, three
// 80 px tiles, two rows of five 58 px circles under a label, then two sections
// with a 44 px title row each: three 96 px stat tiles, and four list rows.
// 25 pulsing blocks in all.
function expectHomeShapes(html: string) {
  expect(html).toContain(
    '<div aria-busy="true" class="flex flex-col gap-3.5">',
  );
  expect(html).not.toContain("h-[300px]");
  expect(html.match(/h-\[104px\] rounded-\[32px\]/g)).toHaveLength(1);
  expect(html.match(/h-20 rounded-\[24px\]/g)).toHaveLength(3);
  expect(html).toContain("grid grid-cols-3 gap-2");
  expect(html.match(/h-\[18px\]/g)).toHaveLength(2);
  expect(html.match(/size-\[58px\] rounded-full/g)).toHaveLength(10);
  expect(html.match(/grid grid-cols-5 gap-1/g)).toHaveLength(2);
  expect(html).not.toContain("h-[92px]");
  expect(html.match(/h-24 rounded-\[24px\]/g)).toHaveLength(3);
  expect(html.match(/h-\[60px\]/g)).toHaveLength(4);
  // A 44 px title row opens "24 giờ qua" and "Gần đây".
  const title = '<div class="flex h-11 items-center px-1">';
  expect(html.split(title)).toHaveLength(3);
  expect(html.indexOf(title)).toBeLessThan(html.indexOf("h-24 rounded-[24px]"));
  expect(html.lastIndexOf(title)).toBeGreaterThan(
    html.lastIndexOf("h-24 rounded-[24px]"),
  );
  expect(html.lastIndexOf(title)).toBeLessThan(html.indexOf("h-[60px]"));
  expect(html.match(/kb-pulse/g)).toHaveLength(25);
  expectInOrder(html, [
    "h-[104px]",
    "h-20 rounded-[24px]",
    "size-[58px]",
    "h-24 rounded-[24px]",
    "h-[60px]",
  ]);
}

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
    expect(html).not.toContain("Thay tã");
    expectHomeShapes(html);
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

const episode = (
  id: string,
  start: string,
  end: string | null = null,
): EpisodeRow => ({
  id,
  baby_id: "b1",
  started_at: start,
  ended_at: end,
  created_by: "u1",
  created_at: start,
  updated_at: start,
});
const QUESTION =
  "Mở một đợt ốm để gom nhiệt độ, thuốc và triệu chứng vào một chỗ?";
// DAY has a fever of 38,5 at 11:50; the baby is 65 days old, so the banner
// is the red one for babies under 3 months.
const FEVER_BANNER = "Bé dưới 3 tháng sốt ≥ 38°C: cần đi khám ngay.";

// Spec 2026-11-26 §7.2 and §5.5.
describe("HomeScreen: the invite to start an illness episode", () => {
  it("rides on the fever banner when the baby has no open episode", () => {
    state.episodes = {
      data: [episode("old", "2026-11-01T01:00:00Z", "2026-11-03T01:00:00Z")],
    };
    const html = loaded(DAY);
    expect(html.indexOf(FEVER_BANNER)).toBeLessThan(html.indexOf(QUESTION));
    expect(state.banners?.invite).toMatchObject({
      alertKey: "fever-infant",
      busy: false,
    });
    // No open episode: no card, no reminder, and the open episode's logs are
    // not read.
    expect(html).not.toContain("Đang ốm");
    expect(useRangeLogs).toHaveBeenLastCalledWith("b1", "", null, false);
  });

  it("is not offered before the episodes are known, nor after Không on this device", () => {
    expect(loaded(DAY)).not.toContain(QUESTION);
    expect(state.banners?.invite).toBeNull();
    state.episodes = { data: [] };
    state.stored = {
      "kb.illness.inviteDismissedAt.b1": NOW.getTime() - 3_600_000,
    };
    expect(loaded(DAY)).not.toContain(QUESTION);
  });

  it("Bắt đầu đợt ốm starts at the first fever reading and stays on Hôm nay; Không is kept on this device", () => {
    state.episodes = { data: [] };
    loaded(DAY);
    const invite = state.banners?.invite as {
      onStart: () => void;
      onDismiss: () => void;
    };
    invite.onStart();
    expect(startEpisode).toHaveBeenCalledOnce();
    const [variables, options] = startEpisode.mock.calls[0];
    expect(variables).toEqual({ startedAt: at("04:50") });
    expect(options.onSuccess).toBeUndefined();
    options.onError(new Error("boom"));
    expect(toast).toHaveBeenCalledWith("Có lỗi xảy ra: boom");
    invite.onDismiss();
    expect(markStored).toHaveBeenCalledWith(
      "kb.illness.inviteDismissedAt.b1",
      NOW,
    );
  });
});

// Spec §7.1 and §7.3.
describe("HomeScreen with an open illness episode", () => {
  // Opened two days ago, at 09:00 Vietnam time.
  const open = episode("ep1", "2026-11-12T02:00:00Z");

  it("the card sits under the banners and the long timer, above the hero; no invite", () => {
    state.episodes = { data: [open] };
    state.rangeLogs = { data: DAY };
    const html = loaded(DAY);
    expectInOrder(html, [
      "cần đi khám ngay",
      "Còn đang nằm sấp không?",
      ">Đang ốm · ngày 3</span>",
      "Đang sốt · 38,5°C\u00a0lúc\u00a011:50",
      ">Đang ngủ<",
    ]);
    expect(html).toContain('href="/dot-om/chi-tiet?id=ep1"');
    expect(html).not.toContain(QUESTION);
    expect(useRangeLogs).toHaveBeenLastCalledWith(
      "b1",
      "2026-11-12T02:00:00Z",
      null,
      true,
    );
    // Fever 10 minutes ago: nothing to remind.
    expect(html).not.toContain("48 giờ");
  });

  it("the three buttons of the card open the quick-log sheets", () => {
    state.episodes = { data: [open] };
    state.rangeLogs = { data: DAY };
    loaded(DAY);
    (state.card?.onLog as (type: string) => void)("symptom");
    expect(openInstant).toHaveBeenCalledWith("symptom");
  });

  it("the card has no state line while the episode's logs load", () => {
    state.episodes = { data: [open] };
    const html = loaded(DAY);
    expect(html).toContain(">Đang ốm · ngày 3</span>");
    expect(html).not.toContain("Đang sốt ·");
    expect(html).not.toContain("48 giờ");
  });

  it("48 quiet hours: the reminder right under the card; Bé đã khỏi closes, Chưa waits a day", () => {
    state.episodes = { data: [open] };
    state.rangeLogs = { data: [] };
    const html = loaded([]);
    expectInOrder(html, [
      ">Đang ốm · ngày 3</span>",
      "48 giờ qua không có triệu chứng hay liều hạ sốt nào",
      "Đợt ốm bắt đầu 12/11 xong chưa?",
      ">Bé đã khỏi</button>",
      ">Chưa</button>",
      ">Bấm giờ<",
    ]);
    const reminder = state.reminder as {
      onClose: () => void;
      onSnooze: () => void;
    };
    reminder.onClose();
    expect(updateEpisode).toHaveBeenCalledOnce();
    const [variables, options] = updateEpisode.mock.calls[0];
    expect(variables).toEqual({
      id: "ep1",
      patch: { ended_at: NOW.toISOString() },
    });
    options.onSuccess();
    expect(toast).toHaveBeenCalledWith("Đã đóng đợt ốm");
    reminder.onSnooze();
    expect(markStored).toHaveBeenCalledWith(
      "kb.illness.closeSnoozedAt.ep1",
      NOW,
    );
  });

  it("no reminder for a day after Chưa on this device", () => {
    state.episodes = { data: [open] };
    state.rangeLogs = { data: [] };
    state.stored = {
      "kb.illness.closeSnoozedAt.ep1": NOW.getTime() - 3_600_000,
    };
    expect(loaded([])).not.toContain("48 giờ");
  });
});
