import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { hostElements } from "./testTree";
import { ToastProvider, ToastView, useToast } from "./Toast";

describe("ToastView", () => {
  it("is a polite live region floating above the tab bar", () => {
    const html = renderToStaticMarkup(
      <ToastView item={null} onDismiss={() => {}} />,
    );
    expect(html).toContain('role="status"');
    expect(html).toContain('aria-live="polite"');
    // Spec 2026-11-17 §5.2: rises by the pill's height when the timer pill shows.
    expect(html).toContain(
      "bottom-[calc(max(env(safe-area-inset-bottom)+10px,26px)+74px+var(--pill-offset))]",
    );
    expect(html).toContain("print:hidden");
    expect(html).not.toContain("glass-strong");
  });

  it("shows the message and one action button", () => {
    const item = {
      id: 3,
      message: "Đã ghi Tã ướt lúc 17:16",
      action: { label: "Hoàn tác", onAction: () => {} },
    };
    const html = renderToStaticMarkup(
      <ToastView item={item} onDismiss={() => {}} />,
    );
    expect(html).toContain("glass-strong");
    expect(html).toContain(">Đã ghi Tã ướt lúc 17:16</span>");
    expect(html.match(/<button/g)).toHaveLength(1);
    expect(html).toContain(">Hoàn tác</button>");
  });

  it("runs the action and dismisses that toast", () => {
    const onAction = vi.fn();
    const onDismiss = vi.fn();
    const [button] = hostElements(
      ToastView({
        item: { id: 7, message: "x", action: { label: "Hoàn tác", onAction } },
        onDismiss,
      }),
      "button",
    );
    (button.props.onClick as () => void)();
    expect(onAction).toHaveBeenCalledOnce();
    expect(onDismiss).toHaveBeenCalledWith(7);
  });
});

describe("useToast", () => {
  function Probe() {
    const show = useToast();
    return <span>{typeof show}</span>;
  }

  it("works inside ToastProvider", () => {
    expect(
      renderToStaticMarkup(
        <ToastProvider>
          <Probe />
        </ToastProvider>,
      ),
    ).toContain("<span>function</span>");
  });

  it("throws outside ToastProvider", () => {
    expect(() => renderToStaticMarkup(<Probe />)).toThrow(
      "useToast must be used inside ToastProvider",
    );
  });
});
