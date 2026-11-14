import { Segmented } from "@/components/ui/Segmented";
import {
  MILK_OPTIONS,
  ML_STEP,
  stepAmount,
  type QuickValues,
} from "@/lib/rules/quickEntry";
import { NumberStepper } from "./NumberStepper";
import { VALUE_CHIP } from "./styles";

export function BottleFields({
  values,
  onChange,
  recent,
}: {
  values: QuickValues;
  onChange: (next: QuickValues) => void;
  recent: number[];
}) {
  const ml = String(values.ml ?? "");
  const setMl = (next: string) => onChange({ ...values, ml: next });
  return (
    <div className="flex flex-col gap-4">
      <NumberStepper
        label="Số ml"
        value={ml}
        unit="ml"
        minus={{
          text: "−10",
          label: "Bớt 10 ml",
          onPress: () => setMl(stepAmount(ml, -10, ML_STEP)),
        }}
        plus={{
          text: "+10",
          label: "Thêm 10 ml",
          onPress: () => setMl(stepAmount(ml, 10, ML_STEP)),
        }}
        onChange={setMl}
      />
      {recent.length > 0 && (
        <div
          role="group"
          aria-label="Lượng gần đây"
          className="flex flex-wrap gap-2"
        >
          {recent.map((amount) => (
            <button
              key={amount}
              type="button"
              onClick={() => setMl(String(amount))}
              className={VALUE_CHIP}
            >
              {`${amount} ml`}
            </button>
          ))}
        </div>
      )}
      <Segmented
        label="Loại sữa"
        options={MILK_OPTIONS}
        value={String(values.milk)}
        onChange={(milk) => onChange({ ...values, milk })}
      />
    </div>
  );
}
