import type { DayRatings, Rating } from "@/lib/rules/ratings";
import { metricText, RATING_LABEL } from "@/lib/rules/summaryText";

const TONE: Record<Rating, string> = {
  green: "bg-emerald-100 text-emerald-900",
  yellow: "bg-amber-100 text-amber-900",
  red: "bg-red-100 text-red-900",
};

export function SummaryCard({
  ratings,
  totals,
}: {
  ratings: DayRatings;
  totals: { bottleMl: number; dirtyDiapers: number };
}) {
  const items = [
    metricText("sleep", ratings.sleepMinutes),
    metricText("feeds", ratings.feeds),
    metricText("wet", ratings.wetDiapers),
  ];
  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-3 gap-2">
        {items.map((item) => (
          <div
            key={item.label}
            className={`rounded-2xl p-3 ${item.rating ? TONE[item.rating] : "bg-neutral-100"}`}
          >
            <p className="text-sm">{item.label}</p>
            <p className="text-lg font-semibold">{item.value}</p>
            {item.rating && (
              <p className="text-xs font-medium">{RATING_LABEL[item.rating]}</p>
            )}
            <p className="text-xs">{item.note}</p>
          </div>
        ))}
      </div>
      <p className="text-sm text-neutral-600">
        Bình: {totals.bottleMl} ml · Tã bẩn: {totals.dirtyDiapers}
      </p>
    </div>
  );
}
