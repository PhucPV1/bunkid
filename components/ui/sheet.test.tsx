import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ICON_PATHS } from "@/lib/ui/icons";
import { DiscardConfirm, markAutofocus, Sheet } from "./Sheet";

const noop = () => {};

describe("Sheet", () => {
  it("is a dialog labelled by its title, with handle, close button, body and footer", () => {
    const html = renderToStaticMarkup(
      <Sheet
        open
        title="Thay tã"
        icon="drop"
        iconColor="cat-diaper"
        onClose={noop}
        footer={<button>Lưu</button>}
      >
        <p>Thân</p>
      </Sheet>,
    );
    expect(html).toContain("<dialog");
    const labelledBy = /aria-labelledby="([^"]+)"/.exec(html)?.[1];
    expect(labelledBy).toBeTruthy();
    expect(html).toContain(`id="${labelledBy}"`);
    expect(html).toContain(">Thay tã</h2>");
    expect(html).toContain("data-sheet-handle");
    expect(html).toContain('aria-label="Đóng"');
    expect(html).toContain("size-9");
    expect(html).toContain(`d="${ICON_PATHS.drop}"`);
    expect(html).toContain("bg-cat-diaper/15 text-cat-diaper");
    expect(html).toContain("<p>Thân</p>");
    expect(html).toContain(">Lưu</button>");
    expect(html).toContain("max-h-[88dvh] rounded-[38px]");
    expect(html).toContain("glass-strong");
    expect(html).toContain("overflow-y-auto");
    expect(html).toContain("backdrop:bg-scrim");
    expect(html).not.toContain("Bỏ thay đổi?");
  });

  it("the floating variant has no handle and a smaller radius", () => {
    const html = renderToStaticMarkup(
      <Sheet open title="Ghi lại cho Bun" variant="floating" onClose={noop}>
        x
      </Sheet>,
    );
    expect(html).not.toContain("data-sheet-handle");
    expect(html).toContain("rounded-[34px]");
  });

  it("slides in with the iOS curve", () => {
    const html = renderToStaticMarkup(
      <Sheet open title="a" onClose={noop}>
        x
      </Sheet>,
    );
    expect(html).toContain(
      "animate-[kb-sheet-in_280ms_cubic-bezier(0.32,0.72,0,1)]",
    );
  });

  it("keeps the footer for a dirty sheet and no longer draws the old bottom confirm", () => {
    const html = renderToStaticMarkup(
      <Sheet
        open
        dirty
        title="Cho uống thuốc"
        onClose={noop}
        footer={<button>Lưu</button>}
      >
        <p>Thân</p>
      </Sheet>,
    );
    expect(html).toContain(">Lưu</button>");
    expect(html).not.toContain('role="alertdialog"');
    expect(html).not.toContain(">Bỏ</button>");
  });
});

describe("Sheet initial focus", () => {
  it("starts with an on-screen focus target, so iOS does not scroll to the sliding close button", () => {
    const html = renderToStaticMarkup(
      <Sheet open title="Thay tã" onClose={noop}>
        <p>Thân</p>
      </Sheet>,
    );
    expect(html).toMatch(
      /<dialog[^>]*><span tabindex="-1" class="fixed top-0 left-0 size-px outline-none"><\/span>/,
    );
  });

  it("marks that target with the real autofocus attribute that showModal() looks for", () => {
    const set: string[] = [];
    markAutofocus({
      setAttribute: (name: string) => set.push(name),
    } as unknown as HTMLElement);
    markAutofocus(null);
    expect(set).toEqual(["autofocus"]);
  });
});

describe("DiscardConfirm", () => {
  const html = renderToStaticMarkup(
    <DiscardConfirm onDiscard={noop} onKeep={noop} />,
  );

  it("is a modal alert dialog labelled by its title and described by its line", () => {
    expect(html).toContain('role="alertdialog"');
    expect(html).toContain('aria-modal="true"');
    const labelledBy = /aria-labelledby="([^"]+)"/.exec(html)?.[1];
    const describedBy = /aria-describedby="([^"]+)"/.exec(html)?.[1];
    expect(labelledBy).toBeTruthy();
    expect(describedBy).toBeTruthy();
    expect(html).toContain(`id="${labelledBy}"`);
    expect(html).toContain(`id="${describedBy}"`);
    expect(html).toMatch(/<h3[^>]*>Bỏ thay đổi\?<\/h3>/);
    expect(html).toContain(">Những gì vừa nhập sẽ không được lưu.</p>");
  });

  it("puts Bỏ thay đổi (danger) above Tiếp tục nhập (secondary)", () => {
    const discard = html.indexOf(">Bỏ thay đổi</button>");
    const keep = html.indexOf(">Tiếp tục nhập</button>");
    expect(discard).toBeGreaterThan(-1);
    expect(keep).toBeGreaterThan(discard);
    expect(html).toContain("bg-danger-solid text-on-danger");
    expect(html).toContain("data-keep");
  });

  it("sits in the middle of a dimmed full-screen layer, solid so iOS cannot paint it white", () => {
    expect(html).toContain(
      "fixed inset-0 z-10 flex items-center justify-center bg-black/40 p-6",
    );
    expect(html).toContain("animate-[kb-fade-in_180ms_ease-out]");
    expect(html).toContain("max-w-[300px]");
    expect(html).toContain("rounded-[28px] bg-glass-solid");
    expect(html).toContain(
      "animate-[kb-pop-in_180ms_cubic-bezier(0.32,0.72,0,1)]",
    );
    expect(html).not.toContain("glass-strong");
  });
});

describe("Sheet closing (spec 2026-11-17 §3)", () => {
  const css = readFileSync("app/globals.css", "utf8");

  it("travels past the gap under the panel, so a floating sheet leaves the screen", () => {
    const floating = renderToStaticMarkup(
      <Sheet open title="Ghi lại cho Bun" variant="floating" onClose={noop}>
        x
      </Sheet>,
    );
    const bottom = renderToStaticMarkup(
      <Sheet open title="a" onClose={noop}>
        x
      </Sheet>,
    );
    expect(floating).toContain("--kb-sheet-gap:104px");
    expect(bottom).toContain("--kb-sheet-gap:8px");
    expect(floating).toContain("will-change-transform");
    expect(
      css.match(/translateY\(calc\(100% \+ var\(--kb-sheet-gap, 0px\)\)\)/g),
    ).toHaveLength(2);
  });

  it("is not marked closing while open", () => {
    const html = renderToStaticMarkup(
      <Sheet open title="a" onClose={noop}>
        x
      </Sheet>,
    );
    expect(html).not.toContain("data-closing");
  });

  it("fades the scrim and drops the blur while closing, also under reduced motion", () => {
    expect(css).toContain("@keyframes kb-fade-out");
    expect(css).toMatch(
      /dialog\[data-closing\]::backdrop \{\s*animation: kb-fade-out 280ms ease-in forwards;/,
    );
    expect(css).toMatch(
      /dialog\[data-closing\] > \.glass-strong \{[^}]*backdrop-filter: none;/,
    );
    expect(css).toMatch(
      /prefers-reduced-motion: reduce\) \{\s*\*,\s*::before,\s*::after,\s*::backdrop \{/,
    );
  });
});
