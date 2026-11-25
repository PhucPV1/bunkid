"use client";

import { useState, type ReactNode } from "react";
import { DevicePushControl } from "@/components/push/DevicePushControl";
import { Button } from "@/components/ui/Button";
import { ListGroup, ListRow } from "@/components/ui/ListGroup";
import { FIELD_INPUT, FIELD_LABEL } from "@/components/quick/styles";
import { Sheet } from "@/components/ui/Sheet";
import { Switch } from "@/components/ui/Switch";
import { toVietnameseError } from "@/lib/data/errors";
import {
  DEFAULT_PREFS,
  useNotificationPrefs,
  useSavePrefs,
} from "@/lib/data/notificationPrefs";
import { useMedicineSchedules } from "@/lib/data/medicineSchedules";
import { useNow } from "@/lib/hooks/useNow";
import { enabledCountText } from "@/lib/rules/medicineSchedule";
import {
  minutesToTime,
  PREF_OPTIONS,
  quietHoursPatch,
  quietHoursValue,
  SNOOZE_HOURS,
  snoozeText,
  snoozeUntil,
  type PrefKey,
  type QuietPrefs,
} from "@/lib/rules/notifications";
import { snoozeValue } from "@/lib/rules/settingsText";
import type { IconName } from "@/lib/ui/icons";

const PREF_ICON: Record<PrefKey, IconName> = {
  feed_reminder: "bell",
  wake_window: "sun",
  vaccine: "syringe",
  medicine: "pill",
  timer_alert: "clock",
  growth_alert: "alert",
  growth_measure: "ruler",
};

export const SNOOZE_HINT =
  "Tạm tắt nhắc bú, nhắc thức, nhắc thuốc và nhắc timer trên mọi máy của bạn. Nhắc tiêm vẫn gửi.";

// Spec 2026-11-17 §4.4: this switch never appears without its note.
const HOLD_FEED_LABEL = "Không nhắc bú khi bé đang ngủ";
const HOLD_FEED_NOTE =
  "Bé sơ sinh những tuần đầu thường cần đánh thức để bú. Hỏi bác sĩ trước khi bật.";

export function NotificationsGroupView({
  prefs,
  holdFeed,
  quiet,
  medicine,
  disabled,
  snooze,
  device,
  onToggle,
  onToggleHold,
  onOpenQuiet,
  onOpenSnooze,
}: {
  prefs: Record<PrefKey, boolean>;
  holdFeed: boolean;
  // "Tắt" or "HH:mm–HH:mm".
  quiet: string;
  // "Tắt", "<n> thuốc", or "" while the schedules are still loading.
  medicine: string;
  disabled: boolean;
  snooze: string;
  device: ReactNode;
  onToggle: (key: PrefKey, value: boolean) => void;
  onToggleHold: (value: boolean) => void;
  onOpenQuiet: () => void;
  onOpenSnooze: () => void;
}) {
  return (
    <ListGroup title="Thông báo">
      <li className="border-b border-line px-4 py-3">{device}</li>
      {PREF_OPTIONS.map((option) => (
        <ListRow
          key={option.key}
          label={option.label}
          icon={PREF_ICON[option.key]}
          iconColor="cat-diaper"
          trailing={
            <Switch
              checked={prefs[option.key]}
              label={option.label}
              disabled={disabled}
              onChange={(value) => onToggle(option.key, value)}
            />
          }
        />
      ))}
      <ListRow
        label={HOLD_FEED_LABEL}
        detail={HOLD_FEED_NOTE}
        icon="bottle"
        iconColor="cat-diaper"
        trailing={
          <Switch
            checked={holdFeed}
            label={HOLD_FEED_LABEL}
            disabled={disabled}
            onChange={onToggleHold}
          />
        }
      />
      <ListRow
        label="Giờ yên lặng"
        icon="moon"
        iconColor="cat-diaper"
        value={quiet}
        onClick={disabled ? undefined : onOpenQuiet}
        chevron={!disabled}
      />
      <ListRow
        label="Lịch nhắc thuốc"
        icon="calendar"
        iconColor="cat-diaper"
        value={medicine}
        href="/cai-dat/nhac-thuoc"
      />
      <ListRow
        label="Tạm tắt nhắc"
        icon="pause"
        iconColor="muted"
        value={snooze}
        onClick={disabled ? undefined : onOpenSnooze}
        chevron={!disabled}
      />
    </ListGroup>
  );
}

// Spec 2026-11-17 §4.4. Mounted only while open, so it starts from the saved value.
export function QuietHoursSheet({
  value,
  busy,
  onClose,
  onSave,
}: {
  value: QuietPrefs;
  busy: boolean;
  onClose: () => void;
  onSave: (patch: QuietPrefs) => void;
}) {
  const [enabled, setEnabled] = useState(value.quiet_enabled);
  const [from, setFrom] = useState(minutesToTime(value.quiet_start_min));
  const [to, setTo] = useState(minutesToTime(value.quiet_end_min));
  const [message, setMessage] = useState<string | null>(null);

  function save() {
    const built = quietHoursPatch(enabled, from, to);
    if (!built.ok) {
      setMessage(built.message);
      return;
    }
    setMessage(null);
    onSave(built.patch);
  }

  return (
    <Sheet
      open
      onClose={onClose}
      title="Giờ yên lặng"
      footer={
        <div className="flex flex-col gap-2">
          {message && (
            <p role="alert" className="text-[15px] text-danger">
              {message}
            </p>
          )}
          <Button block busy={busy} className="min-h-14!" onClick={save}>
            Lưu
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-5 pt-1">
        <div className="flex min-h-11 items-center gap-3">
          <span className="flex-1 text-base font-semibold text-ink">
            Bật giờ yên lặng
          </span>
          <Switch
            checked={enabled}
            label="Bật giờ yên lặng"
            onChange={setEnabled}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-2">
            <label htmlFor="quiet-from" className={FIELD_LABEL}>
              Từ
            </label>
            <input
              id="quiet-from"
              type="time"
              className={FIELD_INPUT}
              value={from}
              onChange={(event) => setFrom(event.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="quiet-to" className={FIELD_LABEL}>
              Đến
            </label>
            <input
              id="quiet-to"
              type="time"
              className={FIELD_INPUT}
              value={to}
              onChange={(event) => setTo(event.target.value)}
            />
          </div>
        </div>
        <div className="glass flex flex-col gap-2 rounded-[16px] p-3 text-[13px] leading-[18px] text-muted">
          <p>
            <strong className="text-ink">Không gửi:</strong> nhắc bú, nhắc thức,
            nhắc thuốc hằng ngày, nhắc timer.
          </p>
          <p>
            <strong className="text-ink">Vẫn gửi:</strong> nhắc tiêm và nhắc sau
            liều hạ sốt.
          </p>
          <p>Hết giờ yên lặng mà vẫn quá giờ bú thì nhắc ngay lúc đó.</p>
        </div>
      </div>
    </Sheet>
  );
}

export function SnoozeSheet({
  open,
  onClose,
  status,
  snoozed,
  busy,
  onPick,
  onResume,
}: {
  open: boolean;
  onClose: () => void;
  status: string;
  snoozed: boolean;
  busy: boolean;
  onPick: (hours: number) => void;
  onResume: () => void;
}) {
  return (
    <Sheet open={open} onClose={onClose} title="Tạm tắt nhắc">
      <p className="mb-4 text-[15px] text-muted">{status}</p>
      <div className="grid grid-cols-3 gap-2">
        {SNOOZE_HOURS.map((hours) => (
          <Button
            key={hours}
            variant="secondary"
            disabled={busy}
            onClick={() => onPick(hours)}
          >
            {`${hours} giờ`}
          </Button>
        ))}
      </div>
      {snoozed && (
        <Button
          variant="ghost"
          block
          disabled={busy}
          className="mt-3"
          onClick={onResume}
        >
          Bật lại ngay
        </Button>
      )}
    </Sheet>
  );
}

export function NotificationsGroup({
  userId,
  babyId,
}: {
  userId: string;
  babyId: string;
}) {
  const now = useNow(60_000);
  const prefs = useNotificationPrefs(userId);
  const schedules = useMedicineSchedules(babyId);
  const save = useSavePrefs(userId);
  const [open, setOpen] = useState(false);
  const [quietOpen, setQuietOpen] = useState(false);
  const values = prefs.data ?? DEFAULT_PREFS;
  const paused = snoozeText(values.snooze_until, now);
  return (
    <>
      <NotificationsGroupView
        prefs={values}
        holdFeed={values.hold_feed_while_asleep}
        quiet={quietHoursValue(values)}
        medicine={schedules.data ? enabledCountText(schedules.data) : ""}
        disabled={!prefs.isSuccess || save.isPending}
        snooze={snoozeValue(values.snooze_until, now)}
        device={<DevicePushControl />}
        onToggle={(key, value) => save.mutate({ [key]: value })}
        onToggleHold={(value) => save.mutate({ hold_feed_while_asleep: value })}
        onOpenQuiet={() => setQuietOpen(true)}
        onOpenSnooze={() => setOpen(true)}
      />
      {quietOpen && (
        <QuietHoursSheet
          value={values}
          busy={save.isPending}
          onClose={() => setQuietOpen(false)}
          onSave={(patch) =>
            save.mutate(patch, { onSuccess: () => setQuietOpen(false) })
          }
        />
      )}
      <SnoozeSheet
        open={open}
        onClose={() => setOpen(false)}
        status={paused ?? SNOOZE_HINT}
        snoozed={paused !== null}
        busy={save.isPending}
        onPick={(hours) =>
          save.mutate(
            { snooze_until: snoozeUntil(new Date(), hours) },
            { onSuccess: () => setOpen(false) },
          )
        }
        onResume={() =>
          save.mutate(
            { snooze_until: null },
            { onSuccess: () => setOpen(false) },
          )
        }
      />
      {(prefs.isError || save.isError) && (
        <p role="alert" className="mx-4 text-danger">
          {toVietnameseError(prefs.error ?? save.error)}
        </p>
      )}
    </>
  );
}
