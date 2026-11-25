import type { ReactNode } from "react";
import { Glass } from "@/components/ui/Glass";
import { cx } from "@/lib/ui/cx";

// Spec 2026-11-25 §5.4: the title, legend and source line around the chart.
// The chart itself is loaded lazily and passed in as children.
export function GrowthChartCard({
  title,
  babyName,
  alertTone,
  shifted,
  children,
}: {
  title: string;
  babyName: string;
  // The colour of the newest point when its indicator has an alert.
  alertTone: "warn" | "danger" | null;
  // A falling or rising alert: say that direction counts too.
  shifted: boolean;
  children: ReactNode;
}) {
  return (
    <Glass className="flex flex-col gap-2.5 p-3">
      <h2 className="px-1 text-[15px] font-semibold text-ink">{title}</h2>
      {children}
      <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1 px-1 text-xs text-muted">
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-accent" />
          {babyName}
        </span>
        {alertTone && (
          <span className="flex items-center gap-1.5">
            <span
              className={cx(
                "size-2.5 rounded-full",
                alertTone === "danger" ? "bg-danger" : "bg-warn",
              )}
            />
            Lần đo có cảnh báo
          </span>
        )}
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-3.5 rounded-[3px] bg-good/25" />
          Vùng bình thường
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3.5 border-t-2 border-dashed border-good-ink" />
          Mức giữa
        </span>
      </div>
      <p className="px-1 text-[13px] leading-[18px] text-muted">
        95 trong 100 bé khỏe mạnh nằm trong vùng xanh. Nguồn: WHO Child Growth
        Standards.
        {shifted &&
          " App cảnh báo theo hướng đi của bé, không chỉ theo vị trí."}
      </p>
    </Glass>
  );
}
