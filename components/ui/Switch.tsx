import { cx } from "@/lib/ui/cx";

export function Switch({
  checked,
  onChange,
  label,
  disabled = false,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cx(
        "relative inline-flex h-[31px] w-[51px] shrink-0 rounded-full transition-colors duration-200 after:absolute after:-inset-[7px] after:content-[''] disabled:opacity-50",
        checked ? "bg-switch-on" : "bg-muted/30",
      )}
    >
      <span
        aria-hidden="true"
        className={cx(
          "absolute top-[2px] size-[27px] rounded-full bg-glass-solid shadow-[0_2px_6px_rgb(0_0_0/0.2)] transition-[left] duration-200",
          checked ? "left-[22px]" : "left-[2px]",
        )}
      />
    </button>
  );
}
