import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { StatusChip } from "./StatusChip";

const BASE =
  "shrink-0 rounded-full px-2.5 py-0.5 text-[13px] leading-[18px] font-semibold whitespace-nowrap";

// Spec 2026-11-25 §3.4 and §5.1: the chip that names a growth status.
describe("StatusChip", () => {
  it.each([
    ["good", "bg-good-soft text-good-ink"],
    ["warn", "bg-warn-soft text-warn-ink"],
    ["danger", "bg-danger-soft text-danger-ink"],
    ["neutral", "bg-line text-ink"],
  ] as const)("%s", (tone, colours) => {
    expect(
      renderToStaticMarkup(<StatusChip tone={tone}>Lớn đều</StatusChip>),
    ).toBe(`<span class="${BASE} ${colours}">Lớn đều</span>`);
  });
});
