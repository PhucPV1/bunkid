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

export function QuickLogGrid({
  onInstant,
}: {
  onInstant: (type: InstantType) => void;
}) {
  return (
    <section className="flex flex-col gap-2.5">
      <h2 className={GROUP_LABEL}>Ghi nhanh</h2>
      <div className="grid grid-cols-2 gap-2.5">
        {INSTANTS.map(({ type, label }) => (
          <button
            key={type}
            type="button"
            onClick={() => onInstant(type)}
            className="glass flex min-h-14 items-center gap-3 rounded-full pr-4 pl-3 text-base font-semibold text-ink transition-transform duration-[120ms] active:scale-[0.97]"
          >
            <span
              className={cx(
                "flex size-8 shrink-0 items-center justify-center rounded-full",
                CATEGORY_CHIP[CATEGORIES[type].token],
              )}
            >
              <Icon name={CATEGORIES[type].icon} size={17} strokeWidth={2.2} />
            </span>
            <span>{label}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
