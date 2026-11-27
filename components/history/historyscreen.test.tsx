import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Baby, FamilyMember, LogRow } from "@/lib/supabase/rows";
import { ICON_PATHS } from "@/lib/ui/icons";
import { BackfillButton, HistoryScreen } from "./HistoryScreen";

const state = vi.hoisted(() => ({
  // The handler HistoryScreen gave to the empty state's button.
  onEmptyAction: null as ((event?: unknown) => void) | null,
  // What useHistoryLogs returns as its only page.
  logs: [] as LogRow[],
}));
const openActionSheet = vi.hoisted(() => vi.fn());

vi.mock("@/lib/data/logs", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/data/logs")>()),
  useHistoryLogs: () => ({
    data: { pages: [state.logs] },
    isPending: false,
    isError: false,
    fetchStatus: "idle",
    hasNextPage: false,
  }),
}));
vi.mock("@/lib/data/realtime", () => ({ useLogsRealtime: () => {} }));
vi.mock("@/lib/data/family", () => ({ useMembers: () => ({ data: [] }) }));
vi.mock("@/lib/hooks/useOutboxEntries", () => ({ useOutboxEntries: () => [] }));
vi.mock("@/components/actions/QuickActions", () => ({
  useQuickActions: () => ({ openActionSheet }),
}));
vi.mock("@/components/ui/EmptyState", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/components/ui/EmptyState")>();
  type Props = Parameters<typeof actual.EmptyState>[0];
  return {
    EmptyState: (props: Props) => {
      state.onEmptyAction = props.action?.onClick ?? null;
      return actual.EmptyState(props);
    },
  };
});

const baby = {
  id: "b1",
  family_id: "f1",
  name: "Bun",
  dob: "2026-09-10",
} as Baby;
const member = { role: "owner", user_id: "u1" } as FamilyMember;

beforeEach(() => {
  state.onEmptyAction = null;
  state.logs = [];
  openActionSheet.mockClear();
});
afterEach(() => {
  vi.useRealTimers();
});

describe("BackfillButton", () => {
  it("is a labelled glass button, not the calendar icon", () => {
    const html = renderToStaticMarkup(<BackfillButton onClick={() => {}} />);
    expect(html).toMatch(
      /<button[^>]*aria-label="Thêm bản ghi cũ"[^>]*>Ghi bù<\/button>/,
    );
    expect(html).toContain("glass");
    expect(html).toContain("min-h-11");
    expect(html).not.toContain(ICON_PATHS.calendar);
  });

  it("calls onClick", () => {
    const onClick = vi.fn();
    const tree = BackfillButton({ onClick });
    (tree.props.onClick as () => void)();
    expect(onClick).toHaveBeenCalledOnce();
  });
});

// Spec 2026-11-19 §5.4: openActionSheet now takes the groups to show, so a
// click event must not reach it.
describe("HistoryScreen with no logs", () => {
  it("Ghi bản đầu tiên opens the + sheet and passes nothing on", () => {
    const html = renderToStaticMarkup(
      <HistoryScreen baby={baby} member={member} userId="u1" />,
    );
    expect(html).toContain(">Chưa có bản ghi nào.</p>");
    expect(html).toContain(">Ghi bản đầu tiên</button>");
    state.onEmptyAction?.({ type: "click" });
    expect(openActionSheet.mock.calls).toEqual([[]]);
  });
});

// Spec 2026-11-27 (Nhật ký theo buổi) §3.5.
describe("HistoryScreen with logs", () => {
  const log = (id: string, type: string, start: string, details: unknown) =>
    ({
      id,
      baby_id: "b1",
      type,
      started_at: start,
      ended_at: start,
      details,
      note: null,
      created_by: "u1",
      created_at: start,
      updated_at: start,
    }) as LogRow;

  it("opens only today's latest period with logs; the rest show their summary", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-14T12:30:00+07:00"));
    state.logs = [
      log("b1", "bottle", "2026-11-14T03:00:00.000Z", {
        ml: 90,
        milk: "formula",
      }),
      log("d1", "diaper", "2026-11-13T20:00:00.000Z", {
        wet: true,
        dirty: false,
      }),
    ];
    const html = renderToStaticMarkup(
      <HistoryScreen baby={baby} member={member} userId="u1" />,
    );
    expect(html).toContain(">Chiều · 12–18 giờ</span>");
    expect(html).toContain(">Không có bản ghi</span>");
    expect(html).not.toContain("Tối · 18–24 giờ");
    expect(html).toContain(
      'aria-expanded="true" aria-controls="p-2026-11-14-morning"',
    );
    expect(html).toContain("Bình 90 ml sữa công thức");
    expect(html).toMatch(
      /aria-expanded="false" class="[^"]*">.*?>Đêm · 0–6 giờ<\/span><span[^>]*>1 tã<\/span>/,
    );
    expect(html).not.toContain("Tã ướt");
  });
});
