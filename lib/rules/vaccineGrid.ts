import type { VaccineGroup } from "@/lib/content/vaccineSchema";
import type { ScheduleItem } from "./vaccines";

export type GridRow =
  | {
      kind: "vaccine";
      key: string;
      label: string;
      // cells[doseNo - 1] is that dose; null where the vaccine has no such dose.
      cells: (ScheduleItem | null)[];
    }
  | { kind: "unchosen"; key: string; label: string };

export type DoseTone = "done" | "skipped" | "late" | "soon" | "open";

// " mũi 1", " lần 2", and whatever follows it (" mũi 4 (nhắc)").
const DOSE_SUFFIX = / (?:mũi|lần) \d+.*$/;

const isOpen = (item: ScheduleItem) =>
  item.state === "overdue" ||
  item.state === "upcoming" ||
  item.state === "later";

function vaccineLabel(doses: ScheduleItem[], groups: VaccineGroup[]): string {
  const sorted = [...doses].sort((a, b) => a.dose.doseNo - b.dose.doseNo);
  const names = sorted.map((item) => item.dose.name.replace(DOSE_SUFFIX, ""));
  if (names.every((name) => name === names[0])) return names[0];
  const { group, series } = sorted[0].dose;
  const named = groups
    .find((g) => g.code === group)
    ?.series.find((s) => s.code === series);
  return named?.name ?? names[0];
}

// Spec 2026-11-19 §7.2: rows are vaccines (or one row per group with no series
// chosen yet), columns are dose numbers. `items` comes sorted by due date.
export function vaccineGrid(
  items: ScheduleItem[],
  groups: VaccineGroup[],
): { columns: number; rows: GridRow[] } {
  const byCode = new Map<string, ScheduleItem[]>();
  const openGroups = new Set(
    items
      .filter((item) => item.unchosen && isOpen(item) && item.dose.group)
      .map((item) => item.dose.group as string),
  );
  const order: { kind: "vaccine" | "unchosen"; key: string }[] = [];
  const placed = new Set<string>();
  for (const item of items) {
    const { code, group } = item.dose;
    if (!item.unchosen) {
      const doses = byCode.get(code);
      if (doses) doses.push(item);
      else {
        byCode.set(code, [item]);
        order.push({ kind: "vaccine", key: code });
      }
    } else if (group && openGroups.has(group) && !placed.has(group)) {
      placed.add(group);
      order.push({ kind: "unchosen", key: group });
    }
  }
  const columns = Math.max(
    1,
    ...items.filter((item) => !item.unchosen).map((item) => item.dose.doseNo),
  );
  const rows = order.map(({ kind, key }): GridRow => {
    if (kind === "unchosen")
      return {
        kind,
        key,
        label: groups.find((group) => group.code === key)?.name ?? key,
      };
    const doses = byCode.get(key) as ScheduleItem[];
    const cells: (ScheduleItem | null)[] = Array.from(
      { length: columns },
      () => null,
    );
    for (const item of doses) cells[item.dose.doseNo - 1] = item;
    return { kind, key, label: vaccineLabel(doses, groups), cells };
  });
  return { columns, rows };
}

// Spec 2026-11-19 §7.2: what one cell of the table says, checked in this order.
// `date` is a plain YYYY-MM-DD day.
export function doseCell(item: ScheduleItem): {
  label: string;
  date: string | null;
  tone: DoseTone;
} {
  if (item.state === "done")
    return {
      label: "Đã tiêm",
      date: item.record?.given_on ?? null,
      tone: "done",
    };
  if (item.state === "skipped")
    return { label: "Bỏ qua", date: null, tone: "skipped" };
  if (item.pastMaxAge)
    return { label: "Quá tuổi", date: item.due, tone: "late" };
  if (item.state === "overdue")
    return { label: "Trễ hẹn", date: item.due, tone: "late" };
  if (item.state === "upcoming")
    return { label: "Sắp tới", date: item.due, tone: "soon" };
  return { label: "Chưa tiêm", date: item.due, tone: "open" };
}
