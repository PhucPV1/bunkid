type Vibrator = { vibrate?: (pattern: number) => boolean };

const TAP_MS = 10;

// Spec §7.4: a 10 ms buzz on timer buttons. Safari on iOS has no vibrate, so nothing happens there.
export function tapFeedback(
  nav: Vibrator | undefined = typeof navigator === "undefined"
    ? undefined
    : (navigator as Vibrator),
): void {
  if (typeof nav?.vibrate === "function") nav.vibrate(TAP_MS);
}
