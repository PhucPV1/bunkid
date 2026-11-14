import type { CSSProperties } from "react";
import { GOOGLE_BUTTON, GOOGLE_G_COLORS } from "@/lib/ui/tokens";

// Google's own button colours (spec §9), set as CSS variables so the theme can switch them.
const VARS = {
  "--gb-bg": GOOGLE_BUTTON.light.bg,
  "--gb-border": GOOGLE_BUTTON.light.border,
  "--gb-text": GOOGLE_BUTTON.light.text,
  "--gb-bg-dark": GOOGLE_BUTTON.dark.bg,
  "--gb-border-dark": GOOGLE_BUTTON.dark.border,
  "--gb-text-dark": GOOGLE_BUTTON.dark.text,
  "--g-blue": GOOGLE_G_COLORS.blue,
  "--g-green": GOOGLE_G_COLORS.green,
  "--g-yellow": GOOGLE_G_COLORS.yellow,
  "--g-red": GOOGLE_G_COLORS.red,
} as CSSProperties;

export function GoogleButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={VARS}
      className="flex min-h-[50px] w-full items-center justify-center gap-3 rounded-full border border-(--gb-border) bg-(--gb-bg) px-5 text-base font-semibold text-(--gb-text) transition-transform duration-[120ms] active:scale-[0.97] in-data-[theme=dark]:border-(--gb-border-dark) in-data-[theme=dark]:bg-(--gb-bg-dark) in-data-[theme=dark]:text-(--gb-text-dark) in-data-[theme=night]:border-edge in-data-[theme=night]:bg-glass in-data-[theme=night]:text-ink in-data-[theme=night]:backdrop-blur-[24px]"
    >
      {/* The colour variables sit in the button's inline style, which beats any class
          on the button itself, so the night override is set one level down. */}
      <svg
        aria-hidden="true"
        width="18"
        height="18"
        viewBox="0 0 18 18"
        className="in-data-[theme=night]:[--g-blue:currentColor] in-data-[theme=night]:[--g-green:currentColor] in-data-[theme=night]:[--g-yellow:currentColor] in-data-[theme=night]:[--g-red:currentColor]"
      >
        <path
          fill="var(--g-blue)"
          d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"
        />
        <path
          fill="var(--g-green)"
          d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
        />
        <path
          fill="var(--g-yellow)"
          d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
        />
        <path
          fill="var(--g-red)"
          d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
        />
      </svg>
      Đăng nhập bằng Google
    </button>
  );
}
