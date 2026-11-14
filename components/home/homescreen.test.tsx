import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { SyncBarProvider } from "@/components/sync/SyncSlot";
import type { Baby } from "@/lib/supabase/rows";
import { HomeScreen } from "./HomeScreen";

const state = vi.hoisted(() => ({ logs: {} as Record<string, unknown> }));

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
    error: null,
    pressTimer: () => {},
    stopTimer: () => {},
    openInstant: () => {},
  }),
}));
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
  });
});
