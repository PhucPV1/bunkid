"use client";

import { TabBar } from "@/components/nav/TabBar";
import { pillTimer } from "@/lib/rules/timer";
import { ActionSheet } from "./ActionSheet";
import { useQuickActions } from "./QuickActions";

// The tab bar with its "+" button and the 13-action sheet. The bar draws the
// running timer in its Hôm nay tab (spec 2026-11-19 §4). Whether the sheet is
// open lives in QuickActionsProvider, so a page (e.g. an empty Nhật ký) can
// open it too.
export function ActionChrome({ babyName }: { babyName: string }) {
  const actions = useQuickActions();
  return (
    <>
      <TabBar
        onPlus={actions.toggleActionSheet}
        plusOpen={actions.actionSheetOpen}
        timer={pillTimer(actions.runningRows)}
      />
      <ActionSheet
        open={actions.actionSheetOpen}
        onClose={actions.closeActionSheet}
        babyName={babyName}
      />
    </>
  );
}
