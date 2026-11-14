import { cx } from "@/lib/ui/cx";

export type ChoiceOption<T extends string> = { value: T; label: string };

export function Segmented<T extends string>({
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
  if (options.length < 2 || options.length > 4)
    throw new Error(`Segmented needs 2–4 options, got ${options.length}`);
  return (
    <div
      role="group"
      aria-label={label}
      className={cx("glass grid gap-1 rounded-[22px] p-1", className)}
      style={{
        gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))`,
      }}
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
              "min-h-11 rounded-[18px] px-2 text-[15px] text-ink transition-colors",
              on
                ? "bg-glass-solid font-semibold shadow-[0_2px_8px_rgb(0_0_0/0.08)]"
                : "font-medium",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
