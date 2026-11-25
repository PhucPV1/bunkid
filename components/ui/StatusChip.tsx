import { cx } from "@/lib/ui/cx";

export type ChipTone = "good" | "warn" | "danger" | "neutral";

const TONE: Record<ChipTone, string> = {
  good: "bg-good-soft text-good-ink",
  warn: "bg-warn-soft text-warn-ink",
  danger: "bg-danger-soft text-danger-ink",
  neutral: "bg-line text-ink",
};

// Spec 2026-11-25 §3.4 and §5.1: a short status next to a growth value.
export function StatusChip({
  tone,
  children,
}: {
  tone: ChipTone;
  children: string;
}) {
  return (
    <span
      className={cx(
        "shrink-0 rounded-full px-2.5 py-0.5 text-[13px] leading-[18px] font-semibold whitespace-nowrap",
        TONE[tone],
      )}
    >
      {children}
    </span>
  );
}
