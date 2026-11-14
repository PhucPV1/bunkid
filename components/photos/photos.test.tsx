import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { Baby, PhotoRow } from "@/lib/supabase/rows";
import { PhotosScreen, PhotoViewer } from "./PhotosScreen";

const baby = {
  id: "b1",
  family_id: "f1",
  name: "Bun",
  dob: "2026-09-10",
} as Baby;
const wrap = (node: ReactNode) =>
  renderToStaticMarkup(
    <QueryClientProvider client={new QueryClient()}>
      {node}
    </QueryClientProvider>,
  );

describe("PhotosScreen", () => {
  it("a header, a usage bar on the line colour, a glass upload card and skeletons while loading", () => {
    const html = wrap(<PhotosScreen baby={baby} userId="u1" isOwner />);
    expect(html).toContain('href="/kham-pha"');
    expect(html).toContain(">Ảnh của bé</h1>");
    expect(html).toContain("bg-line");
    expect(html).not.toContain("bg-soft");
    expect(html).toContain(">Chọn ảnh</span>");
    expect(html).toContain(">Tải ảnh lên</button>");
    expect(html.match(/aspect-square/g)?.length).toBeGreaterThanOrEqual(6);
  });
});

describe("PhotoViewer", () => {
  it("a sheet titled with the date, the photo, and a red Xóa ảnh", () => {
    const photo = {
      id: "p1",
      baby_id: "b1",
      storage_path: "f1/p1.jpg",
      taken_on: "2026-11-01",
      caption: "Bun cười",
      created_by: "u1",
    } as PhotoRow;
    const html = wrap(
      <PhotoViewer
        photo={photo}
        url="https://example.test/p1.jpg"
        baby={baby}
        canDelete
        onClose={() => {}}
      />,
    );
    expect(html).toContain("<dialog");
    expect(html).toContain(">01/11/2026</h2>");
    expect(html).toContain('src="https://example.test/p1.jpg"');
    expect(html).toContain(">Bun cười</p>");
    expect(html).toContain(">Xóa ảnh</button>");
    expect(html).toContain("text-danger!");
    expect(html).not.toContain(">Đóng</button>");
  });
});
