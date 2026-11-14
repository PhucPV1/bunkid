type Step = { text: string; label: string; onPress: () => void };

const STEP_BUTTON =
  "flex size-14 shrink-0 items-center justify-center rounded-full bg-muted/15 text-[17px] font-semibold text-ink tabular-nums transition-transform duration-[120ms] active:scale-[0.97]";

// Spec §8.2: a 34/700 number field between a minus and a plus button.
export function NumberStepper({
  label,
  value,
  unit,
  placeholder,
  minus,
  plus,
  onChange,
}: {
  label: string;
  value: string;
  unit: string;
  placeholder?: string;
  minus: Step;
  plus: Step;
  onChange: (next: string) => void;
}) {
  return (
    <div className="glass flex items-center gap-2 rounded-[24px] p-2.5">
      <button
        type="button"
        aria-label={minus.label}
        onClick={minus.onPress}
        className={STEP_BUTTON}
      >
        {minus.text}
      </button>
      <label className="flex min-w-0 flex-1 items-baseline justify-center gap-1.5">
        <span className="sr-only">{label}</span>
        <input
          inputMode="decimal"
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
          className="w-28 min-w-0 rounded-[12px] bg-transparent text-center text-[34px] leading-[41px] font-bold text-ink tabular-nums placeholder:text-muted"
        />
        <span className="text-[17px] font-semibold text-muted">{unit}</span>
      </label>
      <button
        type="button"
        aria-label={plus.label}
        onClick={plus.onPress}
        className={STEP_BUTTON}
      >
        {plus.text}
      </button>
    </div>
  );
}
