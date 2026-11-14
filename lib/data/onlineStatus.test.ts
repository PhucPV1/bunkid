import { onlineManager } from "@tanstack/react-query";
import { afterEach, describe, expect, it } from "vitest";
import { trackBrowserOnline } from "./onlineStatus";

afterEach(() => onlineManager.setOnline(true));

describe("trackBrowserOnline", () => {
  it("starts from navigator.onLine and follows online/offline events", () => {
    const events = new EventTarget();
    trackBrowserOnline({ onLine: false }, events);
    expect(onlineManager.isOnline()).toBe(false);
    events.dispatchEvent(new Event("online"));
    expect(onlineManager.isOnline()).toBe(true);
    events.dispatchEvent(new Event("offline"));
    expect(onlineManager.isOnline()).toBe(false);
  });
});
