import { ChipGroup } from "@/components/ui/ChipGroup";
import { TIME_CHIPS, type TimeChip } from "@/lib/rules/timeChips";
import { FIELD_INPUT, FIELD_LABEL } from "./styles";

// Spec §8.1: "Lúc nào?" — Bây giờ · 5 phút trước · 15 phút trước · Chọn giờ…
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
      <ChipGroup
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
