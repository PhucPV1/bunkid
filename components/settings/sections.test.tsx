import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { Baby } from "@/lib/supabase/rows";
import { BabyProfileSection } from "./BabyProfileSection";
import { FeedIntervalSection } from "./FeedIntervalSection";

const baby = {
  id: "b1",
  family_id: "f1",
  name: "Bun",
  dob: "2026-09-10",
  sex: "male",
  birth_weight_g: 3200,
  birth_length_cm: null,
  birth_head_cm: null,
  feed_interval_min: 180,
} as Baby;

const render = (node: ReactNode) =>
  renderToStaticMarkup(
    <QueryClientProvider client={new QueryClient()}>
      {node}
    </QueryClientProvider>,
  );

describe("BabyProfileSection", () => {
  it("owner: the baby form in a glass card, no repeated heading", () => {
    const html = render(<BabyProfileSection baby={baby} isOwner />);
    expect(html).not.toContain("<h2");
    expect(html).toMatch(/class="glass[^"]*p-4"/);
    expect(html).toContain('value="Bun"');
    expect(html).toMatch(/type="submit"[^>]*>Lưu<\/button>/);
  });

  it("viewer: a read-only list with name, birth date and sex, no chevrons", () => {
    const html = render(<BabyProfileSection baby={baby} isOwner={false} />);
    expect(html).not.toContain("<h2");
    expect(html).toContain("glass overflow-hidden rounded-[22px]");
    expect(html).toContain(">Tên</span>");
    expect(html).toContain(">Bun</span>");
    expect(html).toContain(">10/09/2026</span>");
    expect(html).toContain(">Bé trai</span>");
    expect(html).not.toContain("<form");
    expect(html).not.toContain("<a ");
  });
});

describe("FeedIntervalSection", () => {
  it("owner: a field-styled select, the hint and a large Lưu that starts disabled", () => {
    const html = render(<FeedIntervalSection baby={baby} isOwner />);
    expect(html).not.toContain("<h2");
    expect(html).toContain(">Khoảng cách cữ bú</span>");
    expect(html).toMatch(/<select[^>]*class="glass min-h-11/);
    expect(html).toContain('<option value="180" selected="">3 giờ</option>');
    expect(html).toContain("Cữ bú tiếp theo khoảng");
    expect(html).toMatch(
      /<button[^>]*disabled=""[^>]*min-h-\[50px\][^>]*>Lưu<\/button>/,
    );
  });

  it("viewer: one list row with the clock icon and the value", () => {
    const html = render(<FeedIntervalSection baby={baby} isOwner={false} />);
    expect(html).not.toContain("<select");
    expect(html).toContain("bg-cat-feed");
    expect(html).toContain(">Khoảng cách cữ bú</span>");
    expect(html).toContain(">3 giờ</span>");
  });
});
