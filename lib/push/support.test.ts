import { describe, expect, it } from "vitest";
import {
  pushSupport,
  subscriptionBody,
  urlBase64ToUint8Array,
} from "./support";

const full = {
  standalone: true,
  isIOS: true,
  hasServiceWorker: true,
  hasPushManager: true,
  hasNotification: true,
};

describe("push support", () => {
  it("asks iPhone users to install the app first", () => {
    expect(
      pushSupport({ ...full, standalone: false, hasPushManager: false }),
    ).toBe("needs-install");
    expect(pushSupport(full)).toBe("ok");
  });

  it("reports browsers without the push APIs", () => {
    expect(pushSupport({ ...full, isIOS: false, hasPushManager: false })).toBe(
      "unsupported",
    );
    expect(pushSupport({ ...full, isIOS: false, standalone: false })).toBe(
      "ok",
    );
  });

  it("urlBase64ToUint8Array decodes URL-safe base64 without padding", () => {
    expect([...urlBase64ToUint8Array("AQID-_8")]).toEqual([1, 2, 3, 251, 255]);
  });

  it("subscriptionBody keeps only the endpoint and both keys", () => {
    expect(
      subscriptionBody({
        endpoint: "https://web.push.apple.com/x",
        keys: { p256dh: "p", auth: "a" },
      }),
    ).toEqual({
      endpoint: "https://web.push.apple.com/x",
      keys: { p256dh: "p", auth: "a" },
    });
    expect(
      subscriptionBody({ endpoint: "https://x", keys: { p256dh: "p" } }),
    ).toBeNull();
  });
});
