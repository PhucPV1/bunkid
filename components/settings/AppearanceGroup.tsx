"use client";

import { useState } from "react";
import { ListGroup, ListRow } from "@/components/ui/ListGroup";
import { Segmented } from "@/components/ui/Segmented";
import { Sheet } from "@/components/ui/Sheet";
import { Switch } from "@/components/ui/Switch";
import { useNightSchedule, useThemePref } from "@/lib/hooks/useTheme";
import { nightHoursText } from "@/lib/rules/settingsText";
import {
  HALF_HOURS,
  type NightSchedule,
  type ThemePref,
} from "@/lib/rules/theme";
import { THEME_OPTIONS } from "@/lib/theme";

export function AppearanceGroupView({
  pref,
  onPref,
  schedule,
  onSchedule,
  onOpenHours,
}: {
  pref: ThemePref;
  onPref: (next: ThemePref) => void;
  schedule: NightSchedule;
  onSchedule: (next: NightSchedule) => void;
  onOpenHours: () => void;
}) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="mx-4 text-[13px] font-semibold tracking-[0.04em] text-muted uppercase">
        Giao diện
      </h2>
      <Segmented
        label="Giao diện"
        options={THEME_OPTIONS}
        value={pref}
        onChange={onPref}
      />
      <ListGroup>
        <ListRow
          label="Ban đêm theo lịch"
          detail="Tông hổ phách dịu mắt khi cho bé bú đêm"
          icon="moon"
          iconColor="cat-diaper"
          trailing={
            <Switch
              checked={schedule.enabled}
              label="Ban đêm theo lịch"
              onChange={(enabled) => onSchedule({ ...schedule, enabled })}
            />
          }
        />
        <ListRow
          label="Giờ ban đêm"
          icon="clock"
          iconColor="muted"
          value={nightHoursText(schedule)}
          onClick={schedule.enabled ? onOpenHours : undefined}
          chevron={schedule.enabled}
        />
      </ListGroup>
    </section>
  );
}

const SELECT = "glass min-h-11 rounded-[16px] px-3 text-base text-ink";

export function NightHoursSheet({
  open,
  onClose,
  schedule,
  onSchedule,
}: {
  open: boolean;
  onClose: () => void;
  schedule: NightSchedule;
  onSchedule: (next: NightSchedule) => void;
}) {
  return (
    <Sheet open={open} onClose={onClose} title="Giờ ban đêm">
      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-muted">
          Bắt đầu
          <select
            className={SELECT}
            value={schedule.start}
            onChange={(e) => onSchedule({ ...schedule, start: e.target.value })}
          >
            {HALF_HOURS.map((hm) => (
              <option key={hm} value={hm}>
                {hm}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-muted">
          Kết thúc
          <select
            className={SELECT}
            value={schedule.end}
            onChange={(e) => onSchedule({ ...schedule, end: e.target.value })}
          >
            {HALF_HOURS.map((hm) => (
              <option key={hm} value={hm}>
                {hm}
              </option>
            ))}
          </select>
        </label>
      </div>
    </Sheet>
  );
}

export function AppearanceGroup() {
  const [pref, setPref] = useThemePref();
  const [schedule, setSchedule] = useNightSchedule();
  const [open, setOpen] = useState(false);
  return (
    <>
      <AppearanceGroupView
        pref={pref}
        onPref={setPref}
        schedule={schedule}
        onSchedule={setSchedule}
        onOpenHours={() => setOpen(true)}
      />
      <NightHoursSheet
        open={open}
        onClose={() => setOpen(false)}
        schedule={schedule}
        onSchedule={setSchedule}
      />
    </>
  );
}
