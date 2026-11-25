// Spec 2026-11-25 §5.3: where a measurement sits between z −3 and z +3. The
// middle two thirds (z −2 to +2) are the normal range.
export function PositionBar({
  position,
  label,
}: {
  // 0–100, from gaugePosition.
  position: number;
  label: string;
}) {
  return (
    <span
      role="img"
      aria-label={label}
      className="relative my-[5px] flex h-2.5"
    >
      <span className="w-[16.7%] rounded-l-full bg-warn/35" />
      <span className="flex-1 bg-good/35" />
      <span className="w-[16.7%] rounded-r-full bg-warn/35" />
      <span
        className="absolute top-1/2 size-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-glass-solid bg-ink"
        style={{ left: `${position}%` }}
      />
    </span>
  );
}
