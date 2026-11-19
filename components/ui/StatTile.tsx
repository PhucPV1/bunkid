import { cx } from "@/lib/ui/cx";
import { Glass } from "./Glass";

export type StatTone = "good" | "warn" | "danger" | "muted";

const TONE: Record<StatTone, string> = {
  good: "text-good",
  warn: "text-warn",
  danger: "text-danger",
  muted: "text-muted",
};

export function StatTile({
  label,
  value,
  note,
  tone = "muted",
}: {
  label: string;
  value: string;
  note?: string;
  tone?: StatTone;
}) {
  return (
    <Glass radius="tile" className="flex flex-col gap-1 p-3.5">
      <span className="text-xs text-muted">{label}</span>
      <span className="text-xl leading-[26px] font-bold whitespace-nowrap text-ink tabular-nums">
        {value}
      </span>
      {note && (
        <span className={cx("text-[11px] font-semibold", TONE[tone])}>
          {note}
        </span>
      )}
    </Glass>
  );
}
