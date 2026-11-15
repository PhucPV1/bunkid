import { Segmented } from "@/components/ui/Segmented";
import { Switch } from "@/components/ui/Switch";
import {
  MEDICINE_PRESETS,
  UNIT_OPTIONS,
  type QuickValues,
} from "@/lib/rules/quickEntry";
import { FIELD_INPUT, FIELD_LABEL, VALUE_CHIP } from "./styles";

const sameName = (a: string, b: string) =>
  a.trim().toLocaleLowerCase("vi") === b.trim().toLocaleLowerCase("vi");

// The picked chip drops `glass`: its background shorthand would fight bg-accent.
// The transparent 1 px border keeps it the same size as the unpicked glass chips.
const PICKED_CHIP =
  "min-h-11 rounded-full border border-transparent bg-accent text-on-accent px-4 text-[15px] font-semibold transition-transform duration-[120ms] active:scale-[0.97]";

function ChipGroup({
  title,
  groupLabel,
  names,
  typed,
  onPick,
}: {
  title: string;
  groupLabel: string;
  names: readonly string[];
  typed: string;
  onPick: (name: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className={FIELD_LABEL}>{title}</span>
      <div
        role="group"
        aria-label={groupLabel}
        className="flex flex-wrap gap-2"
      >
        {names.map((name) => {
          const picked = sameName(name, typed);
          return (
            <button
              key={name}
              type="button"
              aria-pressed={picked}
              onClick={() => onPick(name)}
              className={picked ? PICKED_CHIP : VALUE_CHIP}
            >
              {name}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function MedicineFields({
  values,
  onChange,
  names,
  onPick,
  warnings,
}: {
  values: QuickValues;
  onChange: (next: QuickValues) => void;
  names: string[];
  onPick: (name: string) => void;
  warnings: string[];
}) {
  const set = (key: string, next: string | boolean) =>
    onChange({ ...values, [key]: next });
  const typed = String(values.name ?? "");
  return (
    <div className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5">
        <span className={FIELD_LABEL}>Tên thuốc</span>
        <input
          className={FIELD_INPUT}
          value={typed}
          onChange={(event) => set("name", event.target.value)}
        />
      </label>
      {ChipGroup({
        title: "Chọn nhanh",
        groupLabel: "Chọn nhanh",
        names: MEDICINE_PRESETS,
        typed,
        onPick,
      })}
      {names.length > 0 &&
        ChipGroup({
          title: "Gần đây",
          groupLabel: "Thuốc gần đây",
          names,
          typed,
          onPick,
        })}
      <label className="flex flex-col gap-1.5">
        <span className={FIELD_LABEL}>Lượng</span>
        <input
          className={`${FIELD_INPUT} tabular-nums`}
          inputMode="decimal"
          value={String(values.amount ?? "")}
          onChange={(event) => set("amount", event.target.value)}
        />
      </label>
      <Segmented
        label="Đơn vị"
        options={UNIT_OPTIONS}
        value={String(values.unit)}
        onChange={(unit) => set("unit", unit)}
      />
      <div className="glass flex min-h-[52px] items-center justify-between gap-3 rounded-[22px] px-4">
        <span className="text-base text-ink">Thuốc hạ sốt</span>
        <Switch
          checked={values.antipyretic === true}
          label="Thuốc hạ sốt"
          onChange={(next) => set("antipyretic", next)}
        />
      </div>
      {warnings.map((warning) => (
        <p
          key={warning}
          role="status"
          className="rounded-[16px] bg-warn-soft p-3 text-[15px] text-warn-ink"
        >
          {warning}
        </p>
      ))}
    </div>
  );
}
