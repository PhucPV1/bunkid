import { cx } from "@/lib/ui/cx";
import type { ChoiceOption } from "./Segmented";

export function ChipGroup<T extends string>({
  label,
  options,
  value,
  onChange,
  className,
}: {
  label: string;
  options: ChoiceOption<T>[];
  value: T;
  onChange: (next: T) => void;
  className?: string;
}) {
  return (
    <div className={cx("relative -mx-4", className)}>
      <div
        role="group"
        aria-label={label}
        className="flex gap-2 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {options.map((option) => {
          const on = option.value === value;
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={on}
              onClick={() => onChange(option.value)}
              className={cx(
                "min-h-11 shrink-0 rounded-full px-4 text-[15px]",
                on
                  ? "bg-ink font-semibold text-bg"
                  : "glass font-medium text-ink",
              )}
            >
              {option.label}
            </button>
          );
        })}
      </div>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 right-0 w-12 bg-linear-to-l from-bg to-transparent"
      />
    </div>
  );
}
