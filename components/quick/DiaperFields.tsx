import { Segmented } from "@/components/ui/Segmented";
import { Swatch } from "@/components/ui/Swatch";
import {
  DIAPER_KIND_OPTIONS,
  diaperKind,
  STOOL_OPTIONS,
  withDiaperKind,
  type QuickValues,
} from "@/lib/rules/quickEntry";
import { STOOL_SWATCHES } from "@/lib/ui/tokens";
import { FIELD_LABEL } from "./styles";

export function DiaperFields({
  values,
  onChange,
}: {
  values: QuickValues;
  onChange: (next: QuickValues) => void;
}) {
  const kind = diaperKind(values);
  return (
    <div className="flex flex-col gap-4">
      <Segmented
        label="Loại tã"
        options={DIAPER_KIND_OPTIONS}
        value={kind}
        onChange={(next) => onChange(withDiaperKind(values, next))}
      />
      {kind !== "wet" && (
        <fieldset className="flex flex-col gap-2.5">
          <legend className={`${FIELD_LABEL} mb-2.5`}>Màu phân</legend>
          <div className="flex flex-wrap gap-x-3 gap-y-3">
            {STOOL_OPTIONS.map((option) => (
              <Swatch
                key={option.value || "none"}
                color={
                  option.value === "" ? null : STOOL_SWATCHES[option.value]
                }
                label={option.label}
                outlined={option.value === "black" || option.value === "pale"}
                selected={(values.stoolColor ?? "") === option.value}
                onSelect={() =>
                  onChange({ ...values, stoolColor: option.value })
                }
              />
            ))}
          </div>
        </fieldset>
      )}
    </div>
  );
}
