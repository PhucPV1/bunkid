import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { PageHeader } from "@/components/ui/PageHeader";
import { SyncBarProvider, SyncBarSlot } from "./SyncSlot";

// The real SyncBar reads the outbox from IndexedDB; a stub shows where it lands.
vi.mock("@/components/sync/SyncBar", () => ({
  SyncBar: ({ userId }: { userId: string }) => <p>sync:{userId}</p>,
}));

describe("SyncBarSlot", () => {
  it("PageHeader draws the sync line right after the header inside the provider", () => {
    const html = renderToStaticMarkup(
      <SyncBarProvider userId="u1">
        <PageHeader title="Nhật ký" />
        <p>body</p>
      </SyncBarProvider>,
    );
    const header = html.indexOf("</header>");
    const sync = html.indexOf("<p>sync:u1</p>");
    expect(header).toBeGreaterThan(-1);
    expect(sync).toBeGreaterThan(header);
    expect(sync).toBeLessThan(html.indexOf("<p>body</p>"));
  });

  it("draws nothing outside the provider (sign-in, offline, install pages)", () => {
    expect(renderToStaticMarkup(<SyncBarSlot />)).toBe("");
    expect(
      renderToStaticMarkup(<PageHeader title="Cài Kim Bun" />),
    ).not.toContain("sync:");
  });

  it("the sync line has no page padding of its own any more", async () => {
    const { SyncBarView } =
      await vi.importActual<typeof import("./SyncBar")>("./SyncBar");
    const html = renderToStaticMarkup(<SyncBarView count={2} dropped={null} />);
    expect(html).toContain(">2 mục chờ đồng bộ</span>");
    expect(html).not.toContain("max-w-md");
    expect(html).not.toContain("pt-4");
  });
});
