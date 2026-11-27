import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Baby, EpisodeRow, LogRow } from "@/lib/supabase/rows";
import { ICON_PATHS } from "@/lib/ui/icons";
import { EpisodeDetailPage } from "./EpisodeDetailPage";
import { findElements } from "@/components/ui/testTree";
import { EpisodeBody, EpisodeScreen } from "./EpisodeScreen";

const NOW = new Date("2026-11-26T10:00:00+07:00");
const state = vi.hoisted(() => ({
  episodes: {} as Record<string, unknown>,
  logs: {} as Record<string, unknown>,
  visits: {} as Record<string, unknown>,
  search: "id=open",
}));
const useRangeLogs = vi.hoisted(() => vi.fn());
const useLogsRealtime = vi.hoisted(() => vi.fn());

vi.mock("@/lib/data/illness", () => ({
  useEpisodes: () => state.episodes,
  useEpisodeActions: () => ({
    update: { isPending: false, mutate: () => {} },
    remove: { isPending: false, mutate: () => {} },
  }),
  useVisits: () => state.visits,
  useVisitActions: () => ({}),
}));
vi.mock("@/lib/data/photos", () => ({
  usePhotoUrls: () => ({ data: {} }),
  usePhotoActions: () => ({ remove: { isPending: false, mutate: () => {} } }),
  usePhotosUsage: () => ({ data: 0 }),
}));
vi.mock("@/lib/data/logs", () => ({ useRangeLogs }));
vi.mock("@/lib/data/realtime", () => ({ useLogsRealtime }));
vi.mock("@/lib/hooks/useNow", () => ({ useNow: () => NOW }));
vi.mock("@/components/actions/QuickActions", () => ({
  useQuickActions: () => ({ openInstant: () => {} }),
}));
vi.mock("@/components/ui/Toast", () => ({ useToast: () => () => {} }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: () => {}, replace: () => {} }),
  useSearchParams: () => new URLSearchParams(state.search),
}));
// The gate is stood in for: it hands the page a signed-in member with a baby.
vi.mock("@/components/AuthGate", () => ({
  GateLoading: () => <div data-gate-loading />,
  AuthGate: ({
    need,
    children,
  }: {
    need: string;
    children: (gate: unknown) => unknown;
  }) => (
    <div data-need={need}>
      {
        children({
          session: { user: { id: "u2" } },
          ctx: { baby, member: { role: "member" } },
        }) as never
      }
    </div>
  ),
}));

const iso = (text: string) =>
  new Date(`${text.replace(" ", "T")}:00+07:00`).toISOString();
const baby = { id: "b1", family_id: "f1", name: "Bun" } as unknown as Baby;
const episode = (
  id: string,
  start: string,
  end: string | null,
  createdBy = "u1",
): EpisodeRow => ({
  id,
  baby_id: "b1",
  started_at: iso(start),
  ended_at: end === null ? null : iso(end),
  created_by: createdBy,
  created_at: iso(start),
  updated_at: iso(start),
});
const open = episode("open", "2026-11-24 23:30", null);
const past = episode("past", "2026-10-10 08:00", "2026-10-12 09:00");
const log = (type: string, time: string, details: unknown) =>
  ({
    id: `${type}-${time}`,
    baby_id: "b1",
    type,
    started_at: iso(time),
    ended_at: iso(time),
    details,
    note: null,
    created_by: "u1",
    created_at: iso(time),
    updated_at: iso(time),
  }) as LogRow;
const LOGS = [
  log("temperature", "2026-11-24 23:40", { celsius: 38.4, method: "nach" }),
  log("temperature", "2026-11-25 15:00", { celsius: 39.2, method: "nach" }),
  log("temperature", "2026-11-26 07:05", { celsius: 37.6, method: "nach" }),
  log("medicine", "2026-11-25 15:10", {
    name: "Hapacol",
    amount: 2.5,
    unit: "ml",
    antipyretic: true,
  }),
  log("symptom", "2026-11-25 08:00", { codes: ["cough", "runny_nose"] }),
];

const LOADING = {
  data: undefined,
  isPending: true,
  isError: false,
  error: null,
  fetchStatus: "fetching",
  refetch: () => {},
};
const OFFLINE = { ...LOADING, fetchStatus: "paused" };
const FAILED = {
  ...LOADING,
  isPending: false,
  isError: true,
  error: new Error("boom"),
  fetchStatus: "idle",
};
const loaded = (data: unknown) => ({
  ...LOADING,
  data,
  isPending: false,
  fetchStatus: "idle",
});

function render(
  input: {
    id?: string | null;
    episodes?: Record<string, unknown>;
    logs?: Record<string, unknown>;
    visits?: Record<string, unknown>;
    userId?: string;
    isOwner?: boolean;
  } = {},
) {
  state.episodes = input.episodes ?? loaded([open, past]);
  state.logs = input.logs ?? loaded(LOGS);
  state.visits = input.visits ?? loaded([]);
  return renderToStaticMarkup(
    <EpisodeScreen
      baby={baby}
      userId={input.userId ?? "u2"}
      isOwner={input.isOwner ?? false}
      id={input.id === undefined ? "open" : input.id}
    />,
  );
}

beforeEach(() => {
  useRangeLogs.mockReset();
  useRangeLogs.mockImplementation(() => state.logs);
  useLogsRealtime.mockClear();
  state.search = "id=open";
});

// Spec 2026-11-26 §6.3.
describe("EpisodeScreen", () => {
  it("is titled Đợt ốm, goes back to the list and has the edit pencil", () => {
    const html = render();
    expect(html).toContain(">Đợt ốm</h1>");
    expect(html).toMatch(/<a[^>]*href="\/dot-om"[^>]*>.*Đợt ốm<\/a>/);
    expect(html).toContain('aria-label="Sửa đợt ốm"');
    expect(html).toContain(`d="${ICON_PATHS.pencil}"`);
  });

  it("reads the logs from 8 days before the first day, open-ended, and follows realtime", () => {
    render();
    expect(useRangeLogs).toHaveBeenCalledWith(
      "b1",
      iso("2026-11-16 00:00"),
      null,
      true,
    );
    expect(useLogsRealtime).toHaveBeenCalledWith("b1");
  });

  it("an open episode: verdict, chart, days, the comparison, the visits, the report, then Bé đã khỏi", () => {
    const html = render();
    expect(html).toContain(">Bun đã hết sốt 19 giờ</h2>");
    expect(html).toContain(">Ngày thứ 3 · bắt đầu 24/11 lúc 23:30</span>");
    expect(html).toContain(">39,2°C</span>");
    for (const text of ["Nhiệt độ", "Thuốc", "Triệu chứng"])
      expect(html).toContain(`>${text}</button>`);
    expect(html).toContain(">Nhiệt độ và thuốc hạ sốt</h2>");
    expect(html).toContain(
      'aria-label="Biểu đồ nhiệt độ: 3 lần đo, cao nhất 39,2°C, 1 liều hạ sốt."',
    );
    expect(html).toContain(">Từng ngày</h2>");
    expect(html).toContain(">25/11 · ngày 2</span>");
    expect(html).toContain(">Sổ mũi</span>");
    expect(html).toMatch(/<button[^>]*w-full[^>]*>Bé đã khỏi<\/button>/);
    // No feed, sleep or diaper was logged before the episode.
    expect(html).toContain(">Chưa đủ dữ liệu trước khi ốm để so.</p>");
    const order = [
      ">Bun đã hết sốt 19 giờ</h2>",
      ">Nhiệt độ và thuốc hạ sốt</h2>",
      ">Từng ngày</h2>",
      ">So với thường ngày</h2>",
      ">Lần khám</h2>",
      "Báo cáo cho bác sĩ</a>",
      ">Bé đã khỏi</button>",
    ].map((mark) => html.indexOf(mark));
    expect(order).toEqual([...order].sort((a, b) => a - b));
    expect(order[0]).toBeGreaterThan(-1);
    expect(html).toContain(">Chưa có lần khám nào.</p>");
  });

  // Spec §8.3: the card shows the episode's visits from the page's one read.
  it("the visits card lists this episode's visits", () => {
    const html = render({
      visits: loaded([
        {
          id: "v1",
          episode_id: "open",
          baby_id: "b1",
          visited_at: iso("2026-11-25 09:15"),
          place: "Phòng khám Nhi",
          conclusion: "Viêm họng",
          advice: null,
          created_by: "u1",
          photos: [],
        },
      ]),
    });
    expect(html).toContain(">25/11 09:15 · Phòng khám Nhi</span>");
    expect(html).toContain(">Viêm họng</span>");
    expect(html).not.toContain("Chưa có lần khám nào.");
  });

  // The page's clock moves once a minute; a log saved since its last tick is
  // dated after it and must show at once.
  it("a reading saved after the page's clock last moved is on the card at once", () => {
    const fresh = {
      ...LOGS[0],
      id: "fresh",
      started_at: new Date(NOW.getTime() + 20_000).toISOString(),
      details: { celsius: 38.8, method: "nach" },
    } as LogRow;
    const html = render({ logs: loaded([fresh]) });
    expect(html).toContain(">Bun đang sốt 38,8°C</h2>");
    expect(html).toContain(">Cao nhất 38,8°C · không dùng thuốc</span>");
    expect(html).not.toContain("Chưa đo nhiệt độ");
  });

  it("compares yesterday with the days before the episode, from the same logs", () => {
    const routine = ["2026-11-20", "2026-11-21", "2026-11-22", "2026-11-25"]
      .flatMap((day) =>
        ["02:00", "06:00", "10:00", "14:00"].map((time) =>
          log("breast", `${day} ${time}`, { side: "left" }),
        ),
      )
      .slice(0, -2);
    const html = render({ logs: loaded([...LOGS, ...routine]) });
    expect(html).toContain(
      ">Hôm qua, so với trung bình 7 ngày trước khi ốm</p>",
    );
    expect(html).toContain(">2 cữ · thường 4 cữ</span>");
    expect(html).toContain(">Ít hơn</span>");
  });

  it("a closed episode: Đã khỏi, no quick logs and no Bé đã khỏi; its logs stop after its last day", () => {
    const html = render({ id: "past", logs: loaded([]) });
    expect(html).toContain(">Đã khỏi sau 3 ngày</h2>");
    expect(html).toContain(">10/10 – 12/10</span>");
    expect(html).toContain(">Chưa có lần đo nào trong đợt này.</p>");
    expect(html).toContain(">So với thường ngày</h2>");
    expect(html).toMatch(
      /<a[^>]*href="\/bao-cao\?dot=past"[^>]*>.*Báo cáo cho bác sĩ<\/a>/,
    );
    expect(html).not.toContain("Bé đã khỏi");
    expect(html).not.toContain(">Triệu chứng</button>");
    expect(useRangeLogs).toHaveBeenCalledWith(
      "b1",
      iso("2026-10-02 00:00"),
      iso("2026-10-13 00:00"),
      true,
    );
  });

  it("an id that is not among the baby's episodes: one sentence and the way back", () => {
    for (const id of ["gone", null]) {
      const html = render({ id });
      expect(html).toContain(">Không tìm thấy đợt ốm này</p>");
      expect(html).toMatch(/<a[^>]*href="\/dot-om"[^>]*>Về danh sách<\/a>/);
      expect(html).not.toContain('aria-label="Sửa đợt ốm"');
      expect(html).not.toContain("Bé đã khỏi");
    }
    // No episode: no logs are asked for.
    expect(useRangeLogs).toHaveBeenLastCalledWith("b1", "", null, false);
  });

  it("while the episodes load there are placeholders; offline it says what it waits for", () => {
    const loading = render({ episodes: LOADING });
    expect(loading).toContain("animate-[kb-pulse");
    expect(loading).not.toContain("Không tìm thấy");
    const offline = render({ episodes: OFFLINE });
    expect(offline).toContain(
      "Cần mạng để tải đợt ốm. Trang sẽ tự tải khi có mạng lại.",
    );
    expect(offline).not.toContain("animate-[kb-pulse");
  });

  it("a failed load has Thử lại", () => {
    const html = render({ episodes: FAILED });
    expect(html).toContain('role="alert"');
    expect(html).toContain(">Có lỗi xảy ra: boom</p>");
    expect(html).toContain(">Thử lại</button>");
  });

  it("the episode is known but its logs are not yet: the header stays, the cards wait", () => {
    const loading = render({ logs: LOADING });
    expect(loading).toContain('aria-label="Sửa đợt ốm"');
    expect(loading).toContain("animate-[kb-pulse");
    expect(loading).not.toContain("Chưa đo nhiệt độ");
    expect(loading).not.toContain("Bé đã khỏi");
    expect(render({ logs: OFFLINE })).toContain(
      "Cần mạng để tải bản ghi của đợt ốm. Trang sẽ tự tải khi có mạng lại.",
    );
    expect(render({ logs: FAILED })).toContain(">Thử lại</button>");
  });
});

describe("EpisodeBody", () => {
  const body = (closing: boolean, onClose: () => void = () => {}) =>
    EpisodeBody({
      episode: open,
      logs: LOGS,
      babyName: "Bun",
      now: NOW,
      closing,
      onLog: () => {},
      onClose,
    });

  it("Bé đã khỏi reports the tap, and waits while the change is on its way", () => {
    const onClose = vi.fn();
    const [button] = findElements(
      body(false, onClose),
      (el) => el.props.children === "Bé đã khỏi",
    );
    (button.props.onClick as () => void)();
    expect(onClose).toHaveBeenCalledOnce();
    expect(renderToStaticMarkup(body(true))).toMatch(
      /aria-busy="true"[^>]*>Bé đã khỏi</,
    );
  });

  // Spec §6.3 item 7 and §9 (board "Đợt ốm · A"): a full-width link styled
  // as the main button, with the document icon, above "Bé đã khỏi".
  it("Báo cáo cho bác sĩ opens the report on this episode", () => {
    const html = renderToStaticMarkup(body(false));
    expect(html).toMatch(
      /<a class="[^"]*bg-accent[^"]*min-h-\[50px\][^"]*w-full[^"]*" href="\/bao-cao\?dot=open">/,
    );
    expect(html).toMatch(
      new RegExp(`d="${ICON_PATHS.doc}".*Báo cáo cho bác sĩ</a>`),
    );
  });

  it("hands the quick-log type on from the verdict card", () => {
    const onLog = vi.fn();
    const [verdict] = findElements(
      EpisodeBody({
        episode: open,
        logs: LOGS,
        babyName: "Bun",
        now: NOW,
        closing: false,
        onLog,
        onClose: () => {},
      }),
      (el) => "view" in el.props && "onLog" in el.props,
    );
    (verdict.props.onLog as (type: string) => void)("symptom");
    expect(onLog).toHaveBeenCalledWith("symptom");
  });
});

// Spec §6.1.
describe("EpisodeDetailPage", () => {
  it("takes the id from the address and hands it to the screen behind the gate", () => {
    state.episodes = loaded([open, past]);
    state.logs = loaded(LOGS);
    state.search = "id=past";
    const html = renderToStaticMarkup(<EpisodeDetailPage />);
    expect(html).toContain('data-need="baby"');
    expect(html).toContain(">Đã khỏi sau 3 ngày</h2>");
    expect(html).not.toContain("data-gate-loading");
  });

  it("an address without an id shows the not-found state", () => {
    state.episodes = loaded([open, past]);
    state.logs = loaded(LOGS);
    state.search = "";
    expect(renderToStaticMarkup(<EpisodeDetailPage />)).toContain(
      ">Không tìm thấy đợt ốm này</p>",
    );
  });
});
