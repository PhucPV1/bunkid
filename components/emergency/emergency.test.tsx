import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { Baby, EmergencyContactRow } from "@/lib/supabase/rows";
import { ICON_PATHS } from "@/lib/ui/icons";
import { CallList } from "./CallList";
import { ContactsEditor } from "./ContactsEditor";
import { ProfileCard } from "./ProfileCard";

const contact = (id: string, label: string, sort: number) =>
  ({
    id,
    family_id: "f1",
    label,
    phone: `09${sort}`,
    sort,
    created_by: "u1",
    created_at: "x",
  }) as EmergencyContactRow;

describe("CallList", () => {
  it("a 64 px solid danger 115 button, then the family's numbers as a glass list", () => {
    const html = renderToStaticMarkup(
      <CallList
        contacts={[contact("b", "Bà nội", 2), contact("a", "Bác sĩ", 1)]}
      />,
    );
    expect(html).toContain('href="tel:115"');
    expect(html).toContain("min-h-16");
    expect(html).toContain("bg-danger-solid");
    expect(html).toContain("text-on-danger");
    expect(html).toContain(">Cấp cứu 115</span>");
    expect(html).toContain(`d="${ICON_PATHS.phone}"`);
    expect(html).not.toContain("📞");
    expect(html).toContain(">Danh bạ</h2>");
    expect(html.indexOf(">Bác sĩ</span>")).toBeLessThan(
      html.indexOf(">Bà nội</span>"),
    );
    expect(html).toContain('href="tel:091"');
    expect(html).toContain(">091</span>");
  });

  it("no list without contacts", () => {
    expect(renderToStaticMarkup(<CallList contacts={[]} />)).not.toContain(
      "Danh bạ",
    );
  });
});

describe("ProfileCard", () => {
  it("a glass card with the profile lines and, for the owner, the edit button", () => {
    const baby = {
      id: "b1",
      name: "Bun",
      dob: "2026-09-10",
      blood_type: null,
      allergies: null,
      birth_weight_g: 3200,
    } as Baby;
    const html = renderToStaticMarkup(
      <QueryClientProvider client={new QueryClient()}>
        <ProfileCard baby={baby} isOwner latestWeightG={null} />
      </QueryClientProvider>,
    );
    expect(html).toContain("glass");
    expect(html).toContain(">Hồ sơ của bé</h2>");
    expect(html).toContain(">Nhóm máu</dt>");
    expect(html).toContain(">Sửa nhóm máu, dị ứng</button>");
    expect(html).not.toContain("bg-soft");
  });
});

describe("ContactsEditor", () => {
  it("a glass list with icon arrows, Sửa / Xóa, then the add form with Lưu and Xong", () => {
    const html = renderToStaticMarkup(
      <QueryClientProvider client={new QueryClient()}>
        <ContactsEditor
          familyId="f1"
          contacts={[contact("a", "Bác sĩ", 1), contact("b", "Bà nội", 2)]}
          onClose={() => {}}
        />
      </QueryClientProvider>,
    );
    expect(html).toContain('aria-label="Đưa Bác sĩ lên"');
    expect(html).toContain('aria-label="Đưa Bà nội xuống"');
    expect(html).toContain(`d="${ICON_PATHS.chevronUp}"`);
    expect(html).toContain(`d="${ICON_PATHS.chevronDown}"`);
    expect(html).not.toContain("↑");
    expect(html).toContain(">Sửa</button>");
    expect(html).toContain("text-danger!");
    expect(html).toContain(">Thêm số điện thoại</h3>");
    expect(html).toContain('inputMode="tel"');
    expect(html).toContain(">Lưu</button>");
    expect(html).toContain(">Xong</button>");
    expect(html).not.toContain("rounded-2xl border");
  });
});
