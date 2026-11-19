import { Icon } from "@/components/ui/Icon";
import type { InstantType } from "@/lib/rules/quickEntry";
import { CATEGORIES, CATEGORY_CHIP } from "@/lib/ui/categories";
import { cx } from "@/lib/ui/cx";
import { GROUP_LABEL } from "./sectionTitle";

const INSTANTS: { type: InstantType; label: string }[] = [
  { type: "diaper", label: "Thay tã" },
  { type: "bottle", label: "Bú bình" },
  { type: "medicine", label: "Thuốc" },
  { type: "temperature", label: "Nhiệt độ" },
];

const BUTTON =
  "flex flex-col items-center gap-1.5 transition-transform duration-[120ms] active:scale-[0.97]";
const CIRCLE = "flex size-[58px] items-center justify-center rounded-full";
const LABEL = "text-xs leading-4 font-medium text-ink";

// Spec 2026-11-19 §3.4: one row of five round buttons, sized like the timer
// row. The circles are tinted, not glass, so the two rows look different.
export function QuickLogGrid({
  onInstant,
  onMore,
}: {
  onInstant: (type: InstantType) => void;
  // "Khác": opens the "+" sheet for what has no button here.
  onMore: () => void;
}) {
  return (
    <section className="flex flex-col gap-2.5">
      <h2 className={GROUP_LABEL}>Ghi nhanh</h2>
      <div className="grid grid-cols-5 gap-1">
        {INSTANTS.map(({ type, label }) => (
          <button
            key={type}
            type="button"
            onClick={() => onInstant(type)}
            className={BUTTON}
          >
            <span className={cx(CIRCLE, CATEGORY_CHIP[CATEGORIES[type].token])}>
              <Icon name={CATEGORIES[type].icon} size={24} strokeWidth={2.2} />
            </span>
            <span className={LABEL}>{label}</span>
          </button>
        ))}
        <button type="button" onClick={() => onMore()} className={BUTTON}>
          <span className={cx(CIRCLE, "bg-muted/15 text-ink")}>
            <Icon name="more" size={24} strokeWidth={3} />
          </span>
          <span className={LABEL}>Khác</span>
        </button>
      </div>
    </section>
  );
}
