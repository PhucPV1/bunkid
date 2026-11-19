import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { ICON_PATHS } from "@/lib/ui/icons";
import { BackfillButton } from "./HistoryScreen";

describe("BackfillButton", () => {
  it("is a labelled glass button, not the calendar icon", () => {
    const html = renderToStaticMarkup(<BackfillButton onClick={() => {}} />);
    expect(html).toMatch(
      /<button[^>]*aria-label="Thêm bản ghi cũ"[^>]*>Ghi bù<\/button>/,
    );
    expect(html).toContain("glass");
    expect(html).toContain("min-h-11");
    expect(html).not.toContain(ICON_PATHS.calendar);
  });

  it("calls onClick", () => {
    const onClick = vi.fn();
    const tree = BackfillButton({ onClick });
    (tree.props.onClick as () => void)();
    expect(onClick).toHaveBeenCalledOnce();
  });
});
