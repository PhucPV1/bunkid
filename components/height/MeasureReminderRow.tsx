"use client";

import { Icon } from "@/components/ui/Icon";
import { Switch } from "@/components/ui/Switch";
import { toVietnameseError } from "@/lib/data/errors";
import {
  DEFAULT_PREFS,
  useNotificationPrefs,
  useSavePrefs,
} from "@/lib/data/notificationPrefs";
import type { MeasureReminder } from "@/lib/rules/measureSchedule";

// Spec 2026-11-25 §8.3: when the family is next reminded to measure, and the
// viewer's own "Nhắc đo định kỳ" switch.
export function MeasureReminderRowView({
  reminder,
  checked,
  disabled,
  onChange,
}: {
  reminder: MeasureReminder;
  checked: boolean;
  disabled: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="glass flex items-center gap-3 rounded-[26px] p-4">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent-tint text-accent-text">
        <Icon name="bell" size={18} strokeWidth={2.2} />
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="text-base font-bold text-ink">{reminder.title}</span>
        <span className="text-[13px] leading-[18px] text-muted">
          {reminder.detail}
        </span>
      </span>
      <Switch
        checked={checked}
        label="Nhắc đo định kỳ"
        disabled={disabled}
        onChange={onChange}
      />
    </div>
  );
}

// The same preference as the "Nhắc đo định kỳ" switch in Cài đặt, saved the
// same way. It is saved whether or not this device has notifications on, like
// the switches of the medicine reminders.
export function MeasureReminderRow({
  userId,
  reminder,
}: {
  userId: string;
  reminder: MeasureReminder;
}) {
  const prefs = useNotificationPrefs(userId);
  const save = useSavePrefs(userId);
  const values = prefs.data ?? DEFAULT_PREFS;
  return (
    <>
      <MeasureReminderRowView
        reminder={reminder}
        checked={values.growth_measure}
        disabled={!prefs.isSuccess || save.isPending}
        onChange={(value) => save.mutate({ growth_measure: value })}
      />
      {(prefs.isError || save.isError) && (
        <p role="alert" className="px-1 text-[15px] text-danger">
          {toVietnameseError(prefs.error ?? save.error)}
        </p>
      )}
    </>
  );
}
