import { Segmented } from "@/components/ui/Segmented";
import {
  METHOD_OPTIONS,
  stepAmount,
  TEMP_PRESETS,
  TEMP_STEP,
  type QuickValues,
} from "@/lib/rules/quickEntry";
import { cx } from "@/lib/ui/cx";
import { NumberStepper } from "./NumberStepper";

const PRESET =
  "min-h-11 rounded-full text-[15px] font-semibold tabular-nums transition-transform duration-[120ms] active:scale-[0.97]";

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
        placeholder="––,–"
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
      <div
        role="group"
        aria-label="Mốc nhiệt độ"
        className="grid grid-cols-6 gap-1.5"
      >
        {TEMP_PRESETS.map((preset) => {
          const on = preset === celsius;
          return (
            <button
              key={preset}
              type="button"
              aria-pressed={on}
              onClick={() => setCelsius(preset)}
              className={cx(
                PRESET,
                // The picked one drops `glass`; the clear border keeps its size.
                on
                  ? "border border-transparent bg-ink text-bg"
                  : "glass text-ink",
              )}
            >
              {preset}
            </button>
          );
        })}
      </div>
      <Segmented
        label="Đo ở"
        options={METHOD_OPTIONS}
        value={String(values.method)}
        onChange={(method) => onChange({ ...values, method })}
      />
    </div>
  );
}
