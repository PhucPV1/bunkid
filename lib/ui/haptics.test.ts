import { describe, expect, it, vi } from "vitest";
import { tapFeedback } from "./haptics";

describe("tapFeedback", () => {
  it("vibrates 10 ms where the browser can", () => {
    const vibrate = vi.fn(() => true);
    tapFeedback({ vibrate });
    expect(vibrate).toHaveBeenCalledWith(10);
  });

  it("does nothing without vibrate (iOS Safari) or without a navigator", () => {
    expect(() => tapFeedback({})).not.toThrow();
    expect(() => tapFeedback()).not.toThrow();
  });
});
