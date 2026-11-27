import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { ICON_PATHS } from "@/lib/ui/icons";
import { EmptyState } from "./EmptyState";
import { ErrorCard } from "./ErrorCard";
import { NeedsNetwork, waitingForNetwork } from "./NeedsNetwork";
import { findElements } from "./testTree";

describe("EmptyState", () => {
  it("a 40 px muted icon, one sentence and an optional action", () => {
    const onClick = vi.fn();
    const html = renderToStaticMarkup(
      <EmptyState
        icon="list"
        text="Chưa có bản ghi nào."
        action={{ label: "Ghi bản đầu tiên", onClick }}
      />,
    );
    expect(html).toContain('width="40"');
    expect(html).toContain("text-muted");
    expect(html).toContain(`d="${ICON_PATHS.list}"`);
    expect(html).toContain(">Chưa có bản ghi nào.</p>");
    expect(html).toContain(">Ghi bản đầu tiên</button>");
    const [button] = findElements(
      EmptyState({
        icon: "list",
        text: "x",
        action: { label: "Ghi bản đầu tiên", onClick },
      }),
      (el) => el.props.children === "Ghi bản đầu tiên",
    );
    (button.props.onClick as () => void)();
    expect(onClick).toHaveBeenCalledOnce();
    expect(
      renderToStaticMarkup(<EmptyState icon="list" text="Trống." />),
    ).not.toContain("<button");
  });

  // Spec 2026-11-26 §6.2 and §6.3.
  it("takes a second, smaller line and an action that is a link", () => {
    const html = renderToStaticMarkup(
      <EmptyState
        icon="calendar"
        text="Chưa có đợt ốm nào"
        detail="Khi bé ốm, mở một đợt."
        action={{ label: "Về danh sách", href: "/dot-om" }}
      />,
    );
    expect(html).toContain(">Chưa có đợt ốm nào</p>");
    expect(html).toContain(
      '<p class="text-[13px] leading-[18px] text-muted">Khi bé ốm, mở một đợt.</p>',
    );
    expect(html.indexOf("Chưa có đợt ốm nào")).toBeLessThan(
      html.indexOf("Khi bé ốm, mở một đợt."),
    );
    expect(html).toMatch(/<a[^>]*href="\/dot-om"[^>]*>Về danh sách<\/a>/);
    expect(html).toMatch(/<a[^>]*class="[^"]*glass[^"]*min-h-11/);
    expect(html).not.toContain("<button");
    // Without the second line there is no empty paragraph.
    expect(
      renderToStaticMarkup(<EmptyState icon="list" text="Trống." />).match(
        /<p /g,
      ),
    ).toHaveLength(1);
  });
});

describe("ErrorCard", () => {
  it("a glass card with a danger border, the message and Thử lại", () => {
    const onRetry = vi.fn();
    const html = renderToStaticMarkup(
      <ErrorCard message="Mất kết nối" onRetry={onRetry} />,
    );
    expect(html).toContain('role="alert"');
    expect(html).toContain("glass");
    expect(html).toContain("border-danger!");
    expect(html).toContain(">Mất kết nối</p>");
    expect(html).toContain(">Thử lại</button>");
    const [retry] = findElements(
      ErrorCard({ message: "x", onRetry }),
      (el) => el.props.children === "Thử lại",
    );
    (retry.props.onClick as () => void)();
    expect(onRetry).toHaveBeenCalledOnce();
  });
});

describe("NeedsNetwork", () => {
  it("only a query that never loaded and is paused offline waits for the network", () => {
    expect(waitingForNetwork({ isPending: true, fetchStatus: "paused" })).toBe(
      true,
    );
    expect(
      waitingForNetwork({ isPending: true, fetchStatus: "fetching" }),
    ).toBe(false);
    // Cached data shown while a refetch is paused is not a blank page.
    expect(waitingForNetwork({ isPending: false, fetchStatus: "paused" })).toBe(
      false,
    );
  });

  it("says what could not load and that it resumes by itself", () => {
    const html = renderToStaticMarkup(<NeedsNetwork what="thống kê" />);
    expect(html).toContain('role="status"');
    expect(html).toContain(
      "Cần mạng để tải thống kê. Trang sẽ tự tải khi có mạng lại.",
    );
  });
});
