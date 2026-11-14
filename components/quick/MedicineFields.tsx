import { Segmented } from "@/components/ui/Segmented";
import { Switch } from "@/components/ui/Switch";
import { UNIT_OPTIONS, type QuickValues } from "@/lib/rules/quickEntry";
import { FIELD_INPUT, FIELD_LABEL, VALUE_CHIP } from "./styles";

export function MedicineFields({
  values,
  onChange,
  names,
  warnings,
}: {
  values: QuickValues;
  onChange: (next: QuickValues) => void;
  names: string[];
  warnings: string[];
}) {
  const set = (key: string, next: string | boolean) =>
    onChange({ ...values, [key]: next });
  return (
    <div className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5">
        <span className={FIELD_LABEL}>Tên thuốc</span>
        <input
          className={FIELD_INPUT}
          value={String(values.name ?? "")}
          onChange={(event) => set("name", event.target.value)}
        />
      </label>
      {names.length > 0 && (
        <div
          role="group"
          aria-label="Thuốc gần đây"
          className="flex flex-wrap gap-2"
        >
          {names.map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => set("name", name)}
              className={VALUE_CHIP}
            >
              {name}
            </button>
          ))}
        </div>
      )}
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
