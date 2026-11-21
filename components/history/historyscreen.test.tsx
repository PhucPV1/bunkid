import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Baby, FamilyMember } from "@/lib/supabase/rows";
import { ICON_PATHS } from "@/lib/ui/icons";
import { BackfillButton, HistoryScreen } from "./HistoryScreen";

const state = vi.hoisted(() => ({
  // The handler HistoryScreen gave to the empty state's button.
  onEmptyAction: null as ((event?: unknown) => void) | null,
}));
const openActionSheet = vi.hoisted(() => vi.fn());

vi.mock("@/lib/data/logs", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/data/logs")>()),
  useHistoryLogs: () => ({
    data: { pages: [[]] },
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
  openActionSheet.mockClear();
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
