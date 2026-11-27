import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { useStoredTime } from "./useStoredTime";

function Probe({ storageKey }: { storageKey: string | null }) {
  const { at } = useStoredTime(storageKey);
  return createElement("p", null, at === undefined ? "not read yet" : "read");
}

describe("useStoredTime", () => {
  // The callers show nothing that depends on the answer until it has been
  // read, so an invite that was turned down does not flash on the first paint.
  it("does not know the time on the first render", () => {
    for (const storageKey of ["kb.illness.inviteDismissedAt.b1", null])
      expect(renderToStaticMarkup(createElement(Probe, { storageKey }))).toBe(
        "<p>not read yet</p>",
      );
  });
});
