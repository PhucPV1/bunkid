import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { ToastProvider } from "@/components/ui/Toast";
import type { Baby, FamilyMember } from "@/lib/supabase/rows";
import { ActionChrome } from "./ActionChrome";
import { QuickActionsProvider } from "./QuickActions";

// TabBar reads the current path; outside the Next router there is none.
vi.mock("next/navigation", () => ({ usePathname: () => "/nhat-ky" }));

const baby = { id: "b1", family_id: "f1", name: "Bun" } as Baby;
const member = {
  role: "owner",
  user_id: "u1",
  display_name: "Ba",
} as FamilyMember;

describe("ActionChrome", () => {
  it("draws the tab bar with + and the closed action sheet from the shared state", () => {
    const html = renderToStaticMarkup(
      <QueryClientProvider client={new QueryClient()}>
        <ToastProvider>
          <QuickActionsProvider baby={baby} member={member} userId="u1">
            <ActionChrome babyName="Bun" />
          </QuickActionsProvider>
        </ToastProvider>
      </QueryClientProvider>,
    );
    expect(html).toContain('href="/nhat-ky"');
    expect(html).toContain('aria-label="Ghi lại"');
    expect(html).toContain('aria-expanded="false"');
    expect(html).toContain(">Ghi lại cho Bun</h2>");
  });
});
