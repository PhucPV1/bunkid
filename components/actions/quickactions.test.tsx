import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ToastProvider } from "@/components/ui/Toast";
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

const withQuery = (node: ReactNode) => (
  <QueryClientProvider client={new QueryClient()}>{node}</QueryClientProvider>
);

describe("QuickActionsProvider", () => {
  it("gives every page the shared timer and quick-entry actions", () => {
    const html = renderToStaticMarkup(
      withQuery(
        <ToastProvider>
          <QuickActionsProvider baby={baby} member={member} userId="u1">
            <Probe />
          </QuickActionsProvider>
        </ToastProvider>,
      ),
    );
    expect(html).toContain("<span>function,function,function,0,false</span>");
    expect(html).not.toContain("<form");
  });

  it("shows its Undo toasts, so it needs the ToastProvider", () => {
    expect(() =>
      renderToStaticMarkup(
        withQuery(
          <QuickActionsProvider baby={baby} member={member} userId="u1">
            <Probe />
          </QuickActionsProvider>,
        ),
      ),
    ).toThrow("useToast must be used inside ToastProvider");
  });

  it("useQuickActions throws outside the provider", () => {
    expect(() => renderToStaticMarkup(<Probe />)).toThrow(
      "useQuickActions must be used inside QuickActionsProvider",
    );
  });
});
