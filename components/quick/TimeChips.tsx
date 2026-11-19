import { Segmented } from "@/components/ui/Segmented";
import { TIME_CHIPS, type TimeChip } from "@/lib/rules/timeChips";
import { FIELD_INPUT, FIELD_LABEL } from "./styles";

// Spec 2026-11-19 §5.1: "Lúc nào?" as four equal segments, nothing to scroll.
export function TimeChips({
  chip,
  custom,
  onChip,
  onCustom,
}: {
  chip: TimeChip;
  custom: string;
  onChip: (next: TimeChip) => void;
  onCustom: (next: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <span className={FIELD_LABEL}>Lúc nào?</span>
      <Segmented
        label="Lúc nào?"
        options={TIME_CHIPS}
        value={chip}
        onChange={onChip}
      />
      {chip === "custom" && (
        <input
          type="datetime-local"
          aria-label="Chọn giờ"
          className={FIELD_INPUT}
          value={custom}
          onChange={(event) => onCustom(event.target.value)}
        />
      )}
    </div>
  );
}
