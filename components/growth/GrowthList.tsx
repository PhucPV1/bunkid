import { PendingMark } from "@/components/sync/PendingMark";
import { ListGroup } from "@/components/ui/ListGroup";
import type { LmsRow, WhoIndicator } from "@/lib/content/who";
import { assess, type Assessment } from "@/lib/rules/growth";
import {
  formatGrowthValue,
  formatPercentile,
  formatZ,
  indicatorValue,
  INDICATORS,
} from "@/lib/rules/growthForm";
import { formatAgeVi } from "@/lib/rules/time";
import type { GrowthRow } from "@/lib/supabase/rows";

const LEVEL_CLASS = {
  green: "bg-good-soft text-good-ink",
  yellow: "bg-warn-soft text-warn-ink",
  red: "bg-danger-soft text-danger-ink",
} as const;

function MeasureLine({
  title,
  text,
  result,
  shown,
}: {
  title: string;
  text: string;
  result: Assessment | null | undefined;
  shown: boolean;
}) {
  return (
    <span className="flex flex-wrap items-center gap-2 text-[15px]">
      <span className="text-muted">{title}:</span>
      <span className="text-ink tabular-nums">{text}</span>
      {shown &&
        result !== undefined &&
        (result ? (
          <span
            className={`rounded-full px-2 text-[13px] font-semibold tabular-nums ${LEVEL_CLASS[result.level]}`}
          >
            z {formatZ(result.z)} · {formatPercentile(result.percentile)}
            {result.text ? ` · ${result.text}` : ""}
          </span>
        ) : (
          <span className="text-[13px] text-muted">Ngoài bảng WHO</span>
        ))}
    </span>
  );
}

// Spec §9 Tăng trưởng: the measurements as a glass list.
export function GrowthList({
  rows,
  lms,
  indicator,
  dob,
  pending,
  canEdit,
  onOpen,
}: {
  rows: GrowthRow[];
  lms: LmsRow[] | undefined;
  indicator: WhoIndicator;
  dob: string;
  pending: Set<string>;
  canEdit: (row: GrowthRow) => boolean;
  onOpen: (row: GrowthRow) => void;
}) {
  return (
    <ListGroup title="Các lần đo">
      {rows.map((row) => (
        <li key={row.id} className="border-b border-line last:border-b-0">
          <button
            type="button"
            disabled={!canEdit(row)}
            onClick={() => onOpen(row)}
            className="flex min-h-[52px] w-full flex-col gap-1 px-4 py-2.5 text-left disabled:opacity-100"
          >
            <span className="text-base font-semibold text-ink tabular-nums">
              {row.measured_on.split("-").reverse().join("/")} ·{" "}
              {formatAgeVi(dob, new Date(`${row.measured_on}T05:00:00Z`))}{" "}
              <PendingMark pending={pending.has(row.id)} />
            </span>
            {INDICATORS.map((item) => {
              const value = indicatorValue(row, item.key);
              if (value === null) return null;
              // undefined: table not loaded yet; null: outside 0..1856 days.
              const result = lms
                ? assess(lms, dob, row.measured_on, value)
                : undefined;
              return (
                <MeasureLine
                  key={item.key}
                  title={item.title}
                  text={formatGrowthValue(item.key, value)}
                  result={result}
                  shown={item.key === indicator}
                />
              );
            })}
          </button>
        </li>
      ))}
    </ListGroup>
  );
}
