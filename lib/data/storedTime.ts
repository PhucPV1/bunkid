// Spec 2026-11-26 §5.5 and §5.6: the time of a "not now", kept on this device
// only. Another phone of the family still gets the invite or the reminder.
export type TimeStore = Pick<Storage, "getItem" | "setItem">;

// "Không" on the invite to start an episode: one answer per baby.
export function inviteDismissKey(babyId: string): string {
  return `kb.illness.inviteDismissedAt.${babyId}`;
}

// "Chưa" on the reminder to close an episode: one answer per episode.
export function closeSnoozeKey(episodeId: string): string {
  return `kb.illness.closeSnoozedAt.${episodeId}`;
}

// The browser's storage; null where there is none or it may not be used
// (private mode, blocked storage, a render outside the browser).
export function deviceStore(): TimeStore | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

// The time kept under `key`, in ms; null when nothing is kept, it cannot be
// read, or it is not a time.
export function readStoredTime(
  store: TimeStore | null,
  key: string,
): number | null {
  try {
    const at = Date.parse(store?.getItem(key) ?? "");
    return Number.isNaN(at) ? null : at;
  } catch {
    return null;
  }
}

export function writeStoredTime(
  store: TimeStore | null,
  key: string,
  at: Date,
): void {
  try {
    store?.setItem(key, at.toISOString());
  } catch {
    // Not kept. The caller still holds the time until the page is closed.
  }
}
