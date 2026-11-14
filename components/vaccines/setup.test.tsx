import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { findElements } from "@/components/ui/testTree";
import { VACCINES } from "@/lib/content/vaccines";
import type { Baby } from "@/lib/supabase/rows";
import { ChoiceFields } from "./ChoiceFields";
import { VaccineSetup } from "./VaccineSetup";

describe("ChoiceFields", () => {
  it("one native select per group with the field styles", () => {
    const onChange = vi.fn();
    const html = renderToStaticMarkup(
      <ChoiceFields groups={VACCINES.groups} value={{}} onChange={onChange} />,
    );
    expect(html.match(/<select/g)).toHaveLength(VACCINES.groups.length);
    expect(html).toContain("accent-accent");
    expect(html).toContain(">Chưa chọn</option>");
    expect(html).toContain(">Không tiêm</option>");
    expect(html).not.toContain("rounded-xl border");
  });
});

describe("VaccineSetup", () => {
  it("switch rows for doses already due, Lưu and Để sau", () => {
    const baby = {
      id: "b1",
      family_id: "f1",
      name: "Bun",
      dob: "2026-01-01",
    } as Baby;
    const onLater = vi.fn();
    const html = renderToStaticMarkup(
      <QueryClientProvider client={new QueryClient()}>
        <VaccineSetup
          baby={baby}
          userId="u1"
          records={[]}
          initialChoices={{}}
          onDone={() => {}}
          onLater={onLater}
        />
      </QueryClientProvider>,
    );
    expect(html).toContain('role="switch"');
    expect(html).not.toContain('type="checkbox"');
    expect(html).toContain(">Lưu</button>");
    expect(html).toContain(">Để sau</button>");
  });
});
