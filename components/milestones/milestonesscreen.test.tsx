import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MILESTONES } from "@/lib/content/milestones";
import { milestonesKey } from "@/lib/data/outbox";
import type { Baby, MilestoneRow } from "@/lib/supabase/rows";
import { MilestonesScreen } from "./MilestonesScreen";

// Bun is 5 months old on 2026-11-27 (153 days).
const baby = {
  id: "b1",
  family_id: "f1",
  name: "Bun",
  dob: "2026-06-27",
} as Baby;
const group = (months: number) =>
  MILESTONES.groups.find((g) => g.months === months)!;
const row = (code: string) =>
  ({
    id: `r-${code}`,
    baby_id: "b1",
    milestone_code: code,
    achieved_on: "2026-11-12",
    note: null,
    photo_id: null,
    created_by: "u1",
    created_at: "2026-11-12T00:00:00.000Z",
  }) as MilestoneRow;

const render = (rows?: MilestoneRow[]) => {
  const client = new QueryClient();
  if (rows) client.setQueryData(milestonesKey("b1"), rows);
  return renderToStaticMarkup(
    <QueryClientProvider client={client}>
      <MilestonesScreen baby={baby} userId="u1" isOwner />
    </QueryClientProvider>,
  );
};

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-11-27T05:00:00Z"));
});
afterEach(() => vi.useRealTimers());

describe("MilestonesScreen (spec 2026-11-27 §4.1)", () => {
  const loaded = [
    ...group(2)
      .items.slice(0, -1)
      .map((i) => row(i.code)),
    row("lat"),
  ];

  it("has the motor row, the timeline, the ask-a-doctor row and the sources", () => {
    const html = render(loaded);
    expect(html).toContain('href="/suc-khoe"');
    expect(html).toMatch(
      /aria-haspopup="dialog"[^>]*>.*Vận động lớn.*Đã lật · đang tới tuổi ngồi, đứng có đỡ/,
    );
    expect(html).toContain("Còn 1 mốc chưa đạt · nên hỏi bác sĩ");
    expect(html).toContain('aria-expanded="true" aria-controls="ms-4"');
    expect(html).toContain("Bun đang ở đây · đạt 0/13");
    expect(html).toMatch(
      /aria-haspopup="dialog"[^>]*>.*Khi nào nên hỏi bác sĩ/,
    );
    expect(html).toContain("Theo CDC và WHO, không thay cho khám sàng lọc.");
    expect(html).toContain(`href="${group(4).source}"`);
    expect(html).toContain(">Nguồn CDC</a>");
    expect(html).toContain(
      `href="${MILESTONES.motor.find((m) => m.code === "ngoi")!.source}"`,
    );
    expect(html).toContain(">Nguồn WHO</a>");
  });

  it("drops the intro, the per-month cards and the show-all button", () => {
    const html = render(loaded);
    expect(html).not.toContain(MILESTONES.intro);
    expect(html).not.toContain("Xem tất cả các mốc");
    expect(html).not.toContain("Nguồn: CDC");
    expect(html).not.toContain("Mốc vận động lớn");
    expect(html).not.toContain("<dialog");
  });

  it("shows no summary and no orange before the marks load", () => {
    const html = render();
    expect(html).not.toContain("Đã lật");
    expect(html).not.toContain("chưa đạt");
    expect(html).not.toContain("đang ở đây");
    expect(html).not.toContain('text-warn"');
    expect(html).toContain('aria-expanded="true" aria-controls="ms-4"');
  });
});
