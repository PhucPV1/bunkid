import { isValidElement, type ReactElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { LOGO_GRADIENT, LOGO_INK } from "@/lib/brand/logo";
import { ICON_PATHS } from "@/lib/ui/icons";
import { HomeHeader, HomeHeaderView } from "./HomeHeader";

type AnyProps = Record<string, unknown> & { children?: ReactNode };

// Finds an element (host or component, e.g. <IconButton />) by its `label` or `aria-label` prop.
function findByLabel(
  node: ReactNode,
  label: string,
): ReactElement<AnyProps> | undefined {
  if (Array.isArray(node)) {
    for (const child of node) {
      const found = findByLabel(child, label);
      if (found) return found;
    }
    return undefined;
  }
  if (!isValidElement<AnyProps>(node)) return undefined;
  if (node.props.label === label || node.props["aria-label"] === label)
    return node;
  return findByLabel(node.props.children, label);
}

const day = renderToStaticMarkup(
  <HomeHeaderView
    name="bun"
    age="2 tháng 4 ngày"
    night={false}
    onToggleNight={() => {}}
  />,
);

describe("HomeHeaderView", () => {
  it("links the avatar, name and age to Cài đặt", () => {
    expect(day).toContain('href="/cai-dat"');
    expect(day).toContain(">B</span>");
    expect(day).toContain(
      `linear-gradient(140deg, ${LOGO_GRADIENT.from}, ${LOGO_GRADIENT.to})`,
    );
    expect(day).toContain(`color:${LOGO_INK}`);
    expect(day).toContain("size-11 shrink-0 items-center");
    expect(day).toContain(">bun</span>");
    expect(day).toContain(">2 tháng 4 ngày</span>");
    expect(day).not.toContain("Xin chào");
  });

  it("has an emergency button that opens /khan-cap", () => {
    expect(day).toContain('href="/khan-cap"');
    expect(day).toContain('aria-label="Khẩn cấp"');
    expect(day).toContain("text-danger");
    expect(day).toContain(`d="${ICON_PATHS.phone}"`);
  });

  it("the moon button says what it will do and shows the state", () => {
    expect(day).toContain('aria-label="Bật chế độ ban đêm"');
    expect(day).toContain('aria-pressed="false"');
    expect(day.match(/<button/g)).toHaveLength(1);
    const night = renderToStaticMarkup(
      <HomeHeaderView name="Bun" age="x" night onToggleNight={() => {}} />,
    );
    expect(night).toContain('aria-label="Tắt chế độ ban đêm"');
    expect(night).toContain('aria-pressed="true"');
    expect(night).toContain('fill="currentColor"');
    expect(night).toContain(`d="${ICON_PATHS.moon}"`);
  });

  it("pressing the moon calls onToggleNight", () => {
    const onToggleNight = vi.fn();
    const tree = HomeHeaderView({
      name: "Bun",
      age: "x",
      night: false,
      onToggleNight,
    });
    const moon = findByLabel(tree, "Bật chế độ ban đêm");
    (moon?.props.onClick as () => void)();
    expect(onToggleNight).toHaveBeenCalledOnce();
  });
});

describe("HomeHeader", () => {
  it("renders the day state on the server", () => {
    const html = renderToStaticMarkup(<HomeHeader name="Bun" age="2 tháng" />);
    expect(html).toContain('aria-label="Bật chế độ ban đêm"');
  });
});
