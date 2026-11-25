import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import CamNang from "@/app/cam-nang/page";
import KhamPha from "@/app/kham-pha/page";

const RedirectTo = vi.hoisted(() => vi.fn((_props: { href: string }) => null));
vi.mock("@/components/nav/RedirectTo", () => ({ RedirectTo }));

// Spec 2026-11-25 §3.1: old links and installed shortcuts still land somewhere.
describe("pages that moved into Sức khỏe", () => {
  it.each([
    ["/kham-pha", KhamPha],
    ["/cam-nang", CamNang],
  ])("%s redirects to /suc-khoe", (_, Page) => {
    RedirectTo.mockClear();
    renderToStaticMarkup(<Page />);
    expect(RedirectTo).toHaveBeenCalledOnce();
    expect(RedirectTo.mock.calls[0][0]).toEqual({ href: "/suc-khoe" });
  });
});
