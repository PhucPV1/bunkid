import { ML_STEP, stepAmount, type QuickValues } from "@/lib/rules/quickEntry";
import { NumberStepper } from "./NumberStepper";

// Spec 2026-11-17 §3.3: one ml field stepped by 10, like the bottle's.
export function WaterFields({
  values,
  onChange,
}: {
  values: QuickValues;
  onChange: (next: QuickValues) => void;
}) {
  const ml = String(values.ml ?? "");
  const setMl = (next: string) => onChange({ ...values, ml: next });
  return (
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
  );
}
