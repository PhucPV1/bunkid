import { cx } from "@/lib/ui/cx";

export type ChoiceOption<T extends string> = {
  value: T;
  label: string;
  // Spec 2026-11-25 §5.3: a small dot after the label, for an option that
  // has an alert.
  dot?: "warn" | "danger";
};

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
  if (options.length < 2 || options.length > 6)
    throw new Error(`Segmented needs 2–6 options, got ${options.length}`);
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
              // One line like iOS's segmented control; 13 px once there are 3–6 options.
              "min-h-11 truncate rounded-[18px] px-1.5 text-ink transition-colors",
              options.length >= 3 ? "text-[13px]" : "text-[15px]",
              on
                ? "bg-glass-solid font-semibold shadow-[0_2px_8px_rgb(0_0_0/0.08)]"
                : "font-medium",
            )}
          >
            {option.label}
            {option.dot && (
              <span
                role="img"
                aria-label="có cảnh báo"
                className={cx(
                  "ml-1.5 inline-block size-2 rounded-full align-middle",
                  option.dot === "danger" ? "bg-danger" : "bg-warn",
                )}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
