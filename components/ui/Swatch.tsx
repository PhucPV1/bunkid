import { cx } from "@/lib/ui/cx";

// `color` is a real colour from lib/ui/tokens.ts (STOOL_SWATCHES); null draws the "Không ghi" swatch.
export function Swatch({
  color,
  label,
  selected,
  onSelect,
  outlined = false,
}: {
  color: string | null;
  label: string;
  selected: boolean;
  onSelect: () => void;
  outlined?: boolean;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
      className="flex min-w-11 flex-col items-center gap-1.5 text-ink"
    >
      <span
        aria-hidden="true"
        className={cx(
          "size-11 rounded-full",
          color === null && "border-2 border-dashed border-muted",
          outlined && "border border-muted",
          selected &&
            "ring-2 ring-accent-text ring-offset-[3px] ring-offset-bg",
        )}
        style={color === null ? undefined : { background: color }}
      />
      <span className="text-xs font-medium">{label}</span>
    </button>
  );
}
