import { Segmented } from "@/components/ui/Segmented";
import { Switch } from "@/components/ui/Switch";
import {
  SOLIDS_AMOUNT_OPTIONS,
  type QuickValues,
} from "@/lib/rules/quickEntry";
import { FIELD_INPUT, FIELD_LABEL, VALUE_CHIP } from "./styles";

// Spec 2026-11-17 §3.3: food name with recent-food chips, amount, "new food" and reaction.
export function SolidsFields({
  values,
  onChange,
  recent,
}: {
  values: QuickValues;
  onChange: (next: QuickValues) => void;
  recent: string[];
}) {
  const set = (key: string, next: string | boolean) =>
    onChange({ ...values, [key]: next });
  return (
    <div className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5">
        <span className={FIELD_LABEL}>Món</span>
        <input
          className={FIELD_INPUT}
          maxLength={80}
          value={String(values.food ?? "")}
          onChange={(event) => set("food", event.target.value)}
        />
      </label>
      {recent.length > 0 && (
        <div
          role="group"
          aria-label="Món gần đây"
          className="flex flex-wrap gap-2"
        >
          {recent.map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => set("food", name)}
              className={VALUE_CHIP}
            >
              {name}
            </button>
          ))}
        </div>
      )}
      <div className="flex flex-col gap-1.5">
        <span className={FIELD_LABEL}>Lượng</span>
        <Segmented
          label="Lượng"
          options={SOLIDS_AMOUNT_OPTIONS}
          value={String(values.amount)}
          onChange={(amount) => set("amount", amount)}
        />
      </div>
      <div className="glass flex min-h-[52px] items-center justify-between gap-3 rounded-[22px] px-4 py-2">
        <span className="flex flex-col">
          <span className="text-base text-ink">Món mới</span>
          <span className="text-[13px] leading-[18px] text-muted">
            Đánh dấu lần đầu bé ăn món này
          </span>
        </span>
        <Switch
          checked={values.isNew === true}
          label="Món mới"
          onChange={(next) => set("isNew", next)}
        />
      </div>
      <label className="flex flex-col gap-1.5">
        <span className={FIELD_LABEL}>Phản ứng (nếu có)</span>
        <input
          className={`${FIELD_INPUT} placeholder:text-muted`}
          maxLength={200}
          placeholder="Ví dụ: nổi mẩn quanh miệng"
          value={String(values.reaction ?? "")}
          onChange={(event) => set("reaction", event.target.value)}
        />
      </label>
    </div>
  );
}
