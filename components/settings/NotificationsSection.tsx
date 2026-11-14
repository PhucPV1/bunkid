"use client";

import { DevicePushControl } from "@/components/push/DevicePushControl";
import { toVietnameseError } from "@/lib/data/errors";
import {
  DEFAULT_PREFS,
  useNotificationPrefs,
  useSavePrefs,
} from "@/lib/data/notificationPrefs";
import { useNow } from "@/lib/hooks/useNow";
import {
  PREF_OPTIONS,
  SNOOZE_HOURS,
  snoozeText,
  snoozeUntil,
} from "@/lib/rules/notifications";

export function NotificationsSection({ userId }: { userId: string }) {
  const now = useNow(60_000);
  const prefs = useNotificationPrefs(userId);
  const save = useSavePrefs(userId);
  const values = prefs.data ?? DEFAULT_PREFS;
  const snoozed = snoozeText(values.snooze_until, now);

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-medium">Thông báo</h2>
      <DevicePushControl />

      <div className="flex flex-col divide-y rounded-2xl border">
        {PREF_OPTIONS.map((option) => (
          <label
            key={option.key}
            className="flex min-h-12 items-center justify-between gap-3 px-4"
          >
            <span>
              {option.label}
              {option.note && (
                <span className="block text-sm text-muted">{option.note}</span>
              )}
            </span>
            <input
              type="checkbox"
              className="size-5"
              disabled={!prefs.isSuccess || save.isPending}
              checked={values[option.key]}
              onChange={(e) => save.mutate({ [option.key]: e.target.checked })}
            />
          </label>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-muted">
          {snoozed ??
            "Tạm tắt nhắc bú và nhắc thức trên mọi máy của bạn. Nhắc tiêm vẫn gửi."}
        </p>
        <div className="flex gap-2">
          {SNOOZE_HOURS.map((hours) => (
            <button
              key={hours}
              type="button"
              disabled={!prefs.isSuccess || save.isPending}
              onClick={() =>
                save.mutate({ snooze_until: snoozeUntil(new Date(), hours) })
              }
              className="min-h-11 flex-1 rounded-xl bg-soft disabled:opacity-50"
            >
              {hours} giờ
            </button>
          ))}
        </div>
        {snoozed && (
          <button
            type="button"
            disabled={save.isPending}
            onClick={() => save.mutate({ snooze_until: null })}
            className="min-h-11 rounded-xl border disabled:opacity-50"
          >
            Bật lại
          </button>
        )}
      </div>

      {(prefs.isError || save.isError) && (
        <p role="alert" className="text-danger">
          {toVietnameseError(prefs.error ?? save.error)}
        </p>
      )}
    </section>
  );
}
