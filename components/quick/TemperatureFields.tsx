import { Segmented } from "@/components/ui/Segmented";
import {
  METHOD_OPTIONS,
  stepAmount,
  TEMP_STEP,
  type QuickValues,
} from "@/lib/rules/quickEntry";
import { NumberStepper } from "./NumberStepper";

export function TemperatureFields({
  values,
  onChange,
}: {
  values: QuickValues;
  onChange: (next: QuickValues) => void;
}) {
  const celsius = String(values.celsius ?? "");
  const setCelsius = (next: string) => onChange({ ...values, celsius: next });
  return (
    <div className="flex flex-col gap-4">
      <NumberStepper
        label="Nhiệt độ"
        value={celsius}
        unit="°C"
        placeholder="37,0"
        minus={{
          text: "−0,1",
          label: "Bớt 0,1 độ",
          onPress: () => setCelsius(stepAmount(celsius, -0.1, TEMP_STEP)),
        }}
        plus={{
          text: "+0,1",
          label: "Thêm 0,1 độ",
          onPress: () => setCelsius(stepAmount(celsius, 0.1, TEMP_STEP)),
        }}
        onChange={setCelsius}
      />
      <Segmented
        label="Đo ở"
        options={METHOD_OPTIONS}
        value={String(values.method)}
        onChange={(method) => onChange({ ...values, method })}
      />
    </div>
  );
}
