import { onlineManager } from "@tanstack/react-query";
import { afterEach, describe, expect, it, vi } from "vitest";
import { onlineStore, trackBrowserOnline } from "./onlineStatus";

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

describe("onlineStore", () => {
  it("reports React Query's online state and tells subscribers when it changes", () => {
    const onChange = vi.fn();
    const unsubscribe = onlineStore.subscribe(onChange);
    onlineManager.setOnline(false);
    expect(onlineStore.getSnapshot()).toBe(false);
    expect(onChange).toHaveBeenCalled();
    unsubscribe();
    expect(onlineStore.getServerSnapshot()).toBe(true);
  });
});
