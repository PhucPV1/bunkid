"use client";

import type { VaccineGroup } from "@/lib/content/vaccineSchema";
import { NOT_TAKING } from "@/lib/rules/vaccines";

export function ChoiceFields({
  groups,
  value,
  onChange,
}: {
  groups: VaccineGroup[];
  value: Record<string, string>;
  onChange: (next: Record<string, string>) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      {groups.map((group) => (
        <label key={group.code} className="flex flex-col gap-1">
          {group.name}
          <select
            className="min-h-11 rounded-xl border px-3"
            value={value[group.code] ?? ""}
            onChange={(e) =>
              onChange({ ...value, [group.code]: e.target.value })
            }
          >
            <option value="">Chưa chọn</option>
            {group.series.map((series) => (
              <option key={series.code} value={series.code}>
                {series.name}
              </option>
            ))}
            <option value={NOT_TAKING}>Không tiêm</option>
          </select>
        </label>
      ))}
    </div>
  );
}
