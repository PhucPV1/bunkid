import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Baby, EpisodeRow, LogRow } from "@/lib/supabase/rows";
import { ICON_PATHS } from "@/lib/ui/icons";
import { findElements } from "@/components/ui/testTree";
import { EpisodeListBody, EpisodeListScreen } from "./EpisodeListScreen";

const NOW = new Date("2026-11-26T10:00:00+07:00");
const state = vi.hoisted(() => ({
  episodes: {} as Record<string, unknown>,
  logs: {} as Record<string, unknown>,
}));
const useRangeLogs = vi.hoisted(() => vi.fn());
const useLogsRealtime = vi.hoisted(() => vi.fn());

vi.mock("@/lib/data/illness", () => ({
  useEpisodes: () => state.episodes,
  useEpisodeActions: () => ({
    start: { isPending: false, mutate: () => {} },
  }),
}));
vi.mock("@/lib/data/logs", () => ({ useRangeLogs }));
vi.mock("@/lib/data/realtime", () => ({ useLogsRealtime }));
vi.mock("@/lib/hooks/useNow", () => ({ useNow: () => NOW }));
vi.mock("@/components/ui/Toast", () => ({ useToast: () => () => {} }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: () => {} }),
}));

const iso = (text: string) =>
  new Date(`${text.replace(" ", "T")}:00+07:00`).toISOString();
const baby = { id: "b1", family_id: "f1", name: "Bun" } as unknown as Baby;
const episode = (
  id: string,
  start: string,
  end: string | null,
): EpisodeRow => ({
  id,
  baby_id: "b1",
  started_at: iso(start),
  ended_at: end === null ? null : iso(end),
  created_by: "u1",
  created_at: iso(start),
  updated_at: iso(start),
});
const open = episode("open", "2026-11-24 23:30", null);
const october = episode("oct", "2026-10-10 08:00", "2026-10-13 09:00");
const september = episode("sep", "2026-09-28 08:00", "2026-10-02 09:00");
const fever = {
  id: "t1",
  baby_id: "b1",
  type: "temperature",
  started_at: iso("2026-11-26 09:00"),
  ended_at: iso("2026-11-26 09:00"),
  details: { celsius: 38.5, method: "nach" },
} as unknown as LogRow;

const LOADING = {
  data: undefined,
  isPending: true,
  isError: false,
  error: null,
  fetchStatus: "fetching",
  refetch: () => {},
};
const loaded = (data: unknown) => ({
  ...LOADING,
  data,
  isPending: false,
  fetchStatus: "idle",
});

function render(
  episodes: Record<string, unknown>,
  logs: Record<string, unknown> = loaded([fever]),
) {
  state.episodes = episodes;
  state.logs = logs;
  return renderToStaticMarkup(<EpisodeListScreen baby={baby} userId="u1" />);
}

beforeEach(() => {
  useRangeLogs.mockReset();
  useRangeLogs.mockImplementation(() => state.logs);
});

// Spec 2026-11-26 §6.2.
describe("EpisodeListScreen", () => {
  it("is titled Đợt ốm, goes back to Sức khỏe and follows realtime", () => {
    useLogsRealtime.mockClear();
    const html = render(loaded([open]));
    expect(useLogsRealtime).toHaveBeenCalledWith("b1");
    expect(html).toContain(">Đợt ốm</h1>");
    expect(html).toMatch(/<a[^>]*href="\/suc-khoe"[^>]*>.*Sức khỏe<\/a>/);
  });

  it("an open episode: a card that leads to its page, with its state as a chip", () => {
    const html = render(loaded([september, open, october]));
    expect(html).toContain(">Đang diễn ra</h2>");
    expect(html).toMatch(
      /<a[^>]*class="glass [^"]*"[^>]*href="\/dot-om\/chi-tiet\?id=open"/,
    );
    expect(html).toContain("bg-cat-temp/15 text-cat-temp");
    expect(html).toContain(`d="${ICON_PATHS.thermo}"`);
    // The chip sits under the title, so the title keeps one line at 375 px.
    expect(html).toMatch(
      />Từ 24\/11 · ngày thứ 3<\/span><span class="[^"]*bg-warn-soft text-warn-ink[^"]*">Đang sốt<\/span><\/span>/,
    );
    expect(html).toContain(`d="${ICON_PATHS.chevronRight}"`);
    expect(html).not.toContain("Bắt đầu đợt ốm");
    expect(useRangeLogs).toHaveBeenCalledWith(
      "b1",
      open.started_at,
      null,
      true,
    );
  });

  it("past episodes: one row each, newest first, each leading to its page", () => {
    const html = render(loaded([september, open, october]));
    expect(html).toContain(">Đã qua</h2>");
    const first = html.indexOf(">10/10 – 13/10 · 4 ngày</span>");
    const second = html.indexOf(">28/09 – 02/10 · 5 ngày</span>");
    expect(first).toBeGreaterThan(-1);
    expect(first).toBeLessThan(second);
    expect(html).toContain('href="/dot-om/chi-tiet?id=oct"');
    expect(html).toContain('href="/dot-om/chi-tiet?id=sep"');
    expect(html.indexOf(">Đang diễn ra</h2>")).toBeLessThan(
      html.indexOf(">Đã qua</h2>"),
    );
  });

  it("no chip until the open episode's logs have loaded, or when nothing was measured", () => {
    for (const logs of [LOADING, loaded([])]) {
      const html = render(loaded([open]), logs);
      expect(html).toContain(">Từ 24/11 · ngày thứ 3</span>");
      expect(html).not.toContain("Đang sốt");
      expect(html).toContain(`d="${ICON_PATHS.chevronRight}"`);
    }
  });

  it("nothing open: the button to start one, and no logs are asked for", () => {
    const html = render(loaded([october]));
    expect(html).toContain(">Đang diễn ra</h2>");
    expect(html).toMatch(/<button[^>]*w-full[^>]*>Bắt đầu đợt ốm<\/button>/);
    expect(html).toContain(">Đã qua</h2>");
    expect(useRangeLogs).toHaveBeenCalledWith("b1", "", null, false);
  });

  it("only an open episode: no Đã qua", () => {
    expect(render(loaded([open]))).not.toContain("Đã qua");
  });

  it("no episode at all: the empty state with its line and the start button", () => {
    const html = render(loaded([]));
    expect(html).toContain(">Chưa có đợt ốm nào</p>");
    expect(html).toContain(
      ">Khi bé ốm, mở một đợt để gom nhiệt độ, thuốc và triệu chứng vào một chỗ.</p>",
    );
    expect(html).toContain(">Bắt đầu đợt ốm</button>");
    expect(html).not.toContain("Đang diễn ra");
    expect(html).not.toContain("Đã qua");
  });

  it("loading, offline and a failed load", () => {
    expect(render(LOADING)).toContain("animate-[kb-pulse");
    expect(render({ ...LOADING, fetchStatus: "paused" })).toContain(
      "Cần mạng để tải đợt ốm. Trang sẽ tự tải khi có mạng lại.",
    );
    const failed = render({
      ...LOADING,
      isPending: false,
      isError: true,
      error: new Error("boom"),
      fetchStatus: "idle",
    });
    expect(failed).toContain(">Có lỗi xảy ra: boom</p>");
    expect(failed).toContain(">Thử lại</button>");
  });
});

describe("EpisodeListBody", () => {
  it("Bắt đầu đợt ốm reports the tap, from the section and from the empty state", () => {
    const onStart = vi.fn();
    for (const view of [
      {
        open: null,
        past: [{ id: "oct", href: "/x", text: "10/10 – 13/10 · 4 ngày" }],
      },
      { open: null, past: [] },
    ]) {
      const [button] = findElements(
        EpisodeListBody({ view, starting: false, onStart }),
        (el) =>
          el.props.children === "Bắt đầu đợt ốm" ||
          (el.props.action as { label?: string } | undefined)?.label ===
            "Bắt đầu đợt ốm",
      );
      const tap = (button.props.onClick ??
        (button.props.action as { onClick: () => void }).onClick) as () => void;
      tap();
    }
    expect(onStart).toHaveBeenCalledTimes(2);
  });

  it("the start button waits while an episode is being started", () => {
    const html = renderToStaticMarkup(
      <EpisodeListBody
        view={{ open: null, past: [{ id: "oct", href: "/x", text: "a" }] }}
        starting
        onStart={() => {}}
      />,
    );
    expect(html).toMatch(/aria-busy="true"[^>]*>Bắt đầu đợt ốm</);
  });
});
