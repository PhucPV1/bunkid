import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ToastProvider } from "@/components/ui/Toast";
import { logsKey } from "@/lib/data/logs";
import type { Baby, FamilyMember, LogRow } from "@/lib/supabase/rows";
import { ActionChrome } from "./ActionChrome";
import { QuickActionsProvider } from "./QuickActions";

const nav = vi.hoisted(() => ({ pathname: "/nhat-ky" }));
// TabBar reads the current path; outside the Next router there is none.
vi.mock("next/navigation", () => ({ usePathname: () => nav.pathname }));
vi.mock("@/lib/hooks/useNow", () => ({
  useNow: () => new Date("2026-11-17T05:00:00Z"),
}));

const baby = { id: "b1", family_id: "f1", name: "Bun" } as Baby;
const member = {
  role: "owner",
  user_id: "u1",
  display_name: "Ba",
} as FamilyMember;
const running = (id: string, type: string, started_at: string): LogRow =>
  ({
    id,
    baby_id: "b1",
    type,
    started_at,
    ended_at: null,
    details: {},
    note: null,
    created_by: "u1",
    created_at: started_at,
    updated_at: started_at,
  }) as LogRow;
// A sleep 12 minutes 34 seconds old and an older tummy timer.
const TIMERS = [
  running("t1", "tummy", "2026-11-17T04:00:00.000Z"),
  running("s1", "sleep", "2026-11-17T04:47:26.000Z"),
];

function render(logs: LogRow[] = []) {
  const client = new QueryClient();
  client.setQueryData(logsKey("b1"), logs);
  return renderToStaticMarkup(
    <QueryClientProvider client={client}>
      <ToastProvider>
        <QuickActionsProvider baby={baby} member={member} userId="u1">
          <ActionChrome babyName="Bun" />
        </QuickActionsProvider>
      </ToastProvider>
    </QueryClientProvider>,
  );
}
const homeTab = (html: string) => html.split("<a ")[1];

beforeEach(() => {
  nav.pathname = "/nhat-ky";
});

describe("ActionChrome", () => {
  it("draws the tab bar with + and the closed action sheet from the shared state", () => {
    const html = render();
    expect(html).toContain('href="/nhat-ky"');
    expect(html).toContain('aria-label="Ghi lại"');
    expect(html).toContain('aria-expanded="false"');
    expect(html).toContain(">Ghi lại cho Bun</h2>");
    expect(html).toContain(">Hôm nay</a>");
    expect(html).not.toContain("đã chạy");
  });
});

// Spec 2026-11-19 §4.
describe("ActionChrome with a running timer", () => {
  it("off Hôm nay, the Hôm nay tab shows the latest timer and counts the rest", () => {
    const html = render(TIMERS);
    const home = homeTab(html);
    expect(home).toContain('href="/"');
    expect(home).toContain('aria-label="Hôm nay, Ngủ đã chạy 12:34"');
    expect(home).toContain(">12:34</span>");
    expect(home).toContain(">Hôm nay · +1</span>");
    expect(home).not.toContain("aria-current");
  });

  it("has no floating pill and no Dừng button of its own", () => {
    const html = render(TIMERS);
    expect(html).not.toContain(">Dừng</button>");
    expect(html).not.toContain("+70px)]");
    // Only the tab bar and the sheet are glass.
    expect(html.match(/glass-strong/g)).toHaveLength(2);
  });

  it("on Hôm nay the tab is drawn as before: the hero card has the timer", () => {
    nav.pathname = "/";
    const html = render(TIMERS);
    expect(html).toContain(">Hôm nay</a>");
    expect(html).not.toContain("đã chạy");
    expect(html).not.toContain("flex-[1.7]");
    expect(homeTab(html)).toContain("bg-accent-tint text-accent-text");
  });

  it("on Cài đặt the timer tile is the current tab, in the category tint", () => {
    nav.pathname = "/cai-dat";
    const home = homeTab(render(TIMERS));
    expect(home).toContain('aria-current="page"');
    expect(home).toContain("bg-cat-sleep/15");
    expect(home).not.toContain("bg-accent-tint");
  });
});
