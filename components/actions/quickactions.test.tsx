import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { Baby, FamilyMember } from "@/lib/supabase/rows";
import { QuickActionsProvider, useQuickActions } from "./QuickActions";

const baby = { id: "b1", family_id: "f1", name: "Bun" } as Baby;
const member = {
  role: "owner",
  user_id: "u1",
  display_name: "Ba",
} as FamilyMember;

function Probe() {
  const actions = useQuickActions();
  return (
    <span>
      {[
        typeof actions.pressTimer,
        typeof actions.stopTimer,
        typeof actions.openInstant,
        actions.running.length,
        String(actions.busy),
      ].join(",")}
    </span>
  );
}

describe("QuickActionsProvider", () => {
  it("gives every page the shared timer and quick-entry actions", () => {
    const html = renderToStaticMarkup(
      <QueryClientProvider client={new QueryClient()}>
        <QuickActionsProvider baby={baby} member={member} userId="u1">
          <Probe />
        </QuickActionsProvider>
      </QueryClientProvider>,
    );
    expect(html).toContain("<span>function,function,function,0,false</span>");
    expect(html).not.toContain("<form");
  });

  it("useQuickActions throws outside the provider", () => {
    expect(() => renderToStaticMarkup(<Probe />)).toThrow(
      "useQuickActions must be used inside QuickActionsProvider",
    );
  });
});
