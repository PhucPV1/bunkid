import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { FamilyMember } from "@/lib/supabase/rows";
import { MembersSection } from "./MembersSection";

const owner: FamilyMember = {
  id: "m1",
  family_id: "f1",
  user_id: "u1",
  display_name: "Mẹ",
  email: "me@example.com",
  role: "owner",
  created_at: "2026-09-10T00:00:00Z",
};
const grandma: FamilyMember = {
  id: "m2",
  family_id: "f1",
  user_id: null,
  display_name: "Bà nội",
  email: "ba@example.com",
  role: "member",
  created_at: "2026-09-11T00:00:00Z",
};

function render(me: FamilyMember, members?: FamilyMember[]) {
  const client = new QueryClient();
  if (members) client.setQueryData(["members", "f1"], members);
  return renderToStaticMarkup(
    <QueryClientProvider client={client}>
      <MembersSection me={me} />
    </QueryClientProvider>,
  );
}

describe("MembersSection", () => {
  it("loading shows skeleton rows, not text", () => {
    const html = render(owner);
    expect(html).toContain('aria-busy="true"');
    expect(html.match(/kb-pulse/g)).toHaveLength(3);
    expect(html).not.toContain("Đang tải…");
    // The add form's own h2 is expected; only the old repeated page heading must be gone.
    expect(html).not.toContain(">Thành viên</h2>");
  });

  it("owner: a glass member list with role and remove buttons, and a glass add form", () => {
    const html = render(owner, [owner, grandma]);
    expect(html).toContain("glass overflow-hidden rounded-[22px]");
    expect(html).toContain(">Mẹ (bạn) · Chủ gia đình</span>");
    expect(html).toContain(">ba@example.com · chưa đăng nhập lần nào</span>");
    expect(html).toContain(">Đổi thành Chủ gia đình</button>");
    expect(html).toMatch(/class="[^"]*text-danger![^"]*"[^>]*>Xóa<\/button>/);
    expect(html).toMatch(/<form[^>]*novalidate=""[^>]*class="glass/i);
    expect(html).toContain(">Thêm người vào gia đình</h2>");
    expect(html).toContain('aria-label="Vai trò"');
    expect(html).toMatch(/aria-pressed="true"[^>]*>Thành viên<\/button>/);
    expect(html).not.toContain("<select");
    expect(html).toMatch(
      /type="submit"[^>]*min-h-\[50px\][^>]*>Thêm<\/button>/,
    );
  });

  it("member: the list without buttons and the owner-only note", () => {
    const html = render(grandma, [owner, grandma]);
    expect(html).not.toContain("Đổi thành");
    expect(html).not.toContain("<form");
    expect(html).toContain(
      "Chỉ chủ gia đình mới thêm, xóa hoặc đổi vai trò thành viên.",
    );
  });
});
