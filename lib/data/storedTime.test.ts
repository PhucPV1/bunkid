import { describe, expect, it } from "vitest";
import {
  closeSnoozeKey,
  deviceStore,
  inviteDismissKey,
  readStoredTime,
  type TimeStore,
  writeStoredTime,
} from "./storedTime";

function memory(initial: Record<string, string> = {}) {
  const items = new Map(Object.entries(initial));
  const store: TimeStore = {
    getItem: (key) => items.get(key) ?? null,
    setItem: (key, value) => void items.set(key, value),
  };
  return { items, store };
}
const blocked: TimeStore = {
  getItem: () => {
    throw new Error("blocked");
  },
  setItem: () => {
    throw new Error("blocked");
  },
};

// Spec 2026-11-26 §5.5 and §5.6.
describe("stored time", () => {
  it("keeps the invite's answer per baby and the reminder's per episode", () => {
    expect(inviteDismissKey("b1")).toBe("kb.illness.inviteDismissedAt.b1");
    expect(closeSnoozeKey("e1")).toBe("kb.illness.closeSnoozedAt.e1");
  });

  it("reads back the moment that was written", () => {
    const { items, store } = memory();
    const at = new Date("2026-11-27T05:00:00.000Z");
    writeStoredTime(store, "k", at);
    expect(items.get("k")).toBe("2026-11-27T05:00:00.000Z");
    expect(readStoredTime(store, "k")).toBe(at.getTime());
  });

  it("reads null when nothing is kept, or what is kept is not a time", () => {
    expect(readStoredTime(memory().store, "k")).toBeNull();
    expect(readStoredTime(memory({ k: "" }).store, "k")).toBeNull();
    expect(readStoredTime(memory({ k: "hôm qua" }).store, "k")).toBeNull();
    expect(readStoredTime(memory({ other: "2026-11-27" }).store, "k")).toBe(
      null,
    );
  });

  it("storage that is missing or blocked reads null and takes a write quietly", () => {
    expect(readStoredTime(null, "k")).toBeNull();
    expect(readStoredTime(blocked, "k")).toBeNull();
    expect(() => writeStoredTime(null, "k", new Date())).not.toThrow();
    expect(() => writeStoredTime(blocked, "k", new Date())).not.toThrow();
  });

  it("there is no device storage outside a browser", () => {
    expect(deviceStore()).toBeNull();
  });
});
