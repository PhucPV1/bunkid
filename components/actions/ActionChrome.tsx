"use client";

import { TabBar } from "@/components/nav/TabBar";
import { TimerPill } from "@/components/nav/TimerPill";
import { ActionSheet } from "./ActionSheet";
import { useQuickActions } from "./QuickActions";

// The tab bar with its "+" button, the timer pill above it and the 13-action sheet. Whether the sheet is open lives in
// QuickActionsProvider, so a page (e.g. an empty Nhật ký) can open it too.
export function ActionChrome({ babyName }: { babyName: string }) {
  const actions = useQuickActions();
  return (
    <>
      <TimerPill />
      <TabBar
        onPlus={actions.toggleActionSheet}
        plusOpen={actions.actionSheetOpen}
      />
      <ActionSheet
        open={actions.actionSheetOpen}
        onClose={actions.closeActionSheet}
        babyName={babyName}
      />
    </>
  );
}
