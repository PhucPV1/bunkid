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
