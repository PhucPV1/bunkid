import { onlineManager } from "@tanstack/react-query";

type EventSource = Pick<
  EventTarget,
  "addEventListener" | "removeEventListener"
>;

// React Query assumes "online" until an event fires. An app opened in airplane
// mode never gets one, so start from navigator.onLine instead.
export function trackBrowserOnline(
  status: { onLine: boolean },
  events: EventSource,
): void {
  onlineManager.setEventListener((setOnline) => {
    setOnline(status.onLine);
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    events.addEventListener("online", goOnline);
    events.addEventListener("offline", goOffline);
    return () => {
      events.removeEventListener("online", goOnline);
      events.removeEventListener("offline", goOffline);
    };
  });
}
