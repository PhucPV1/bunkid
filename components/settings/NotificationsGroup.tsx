"use client";

import { useState, type ReactNode } from "react";
import { DevicePushControl } from "@/components/push/DevicePushControl";
import { Button } from "@/components/ui/Button";
import { ListGroup, ListRow } from "@/components/ui/ListGroup";
import { Sheet } from "@/components/ui/Sheet";
import { Switch } from "@/components/ui/Switch";
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
  type PrefKey,
} from "@/lib/rules/notifications";
import { snoozeValue } from "@/lib/rules/settingsText";
import type { IconName } from "@/lib/ui/icons";

const PREF_ICON: Record<PrefKey, IconName> = {
  feed_reminder: "bell",
  wake_window: "sun",
  vaccine: "syringe",
};

const SNOOZE_HINT =
  "Tạm tắt nhắc bú và nhắc thức trên mọi máy của bạn. Nhắc tiêm vẫn gửi.";

export function NotificationsGroupView({
  prefs,
  disabled,
  snooze,
  device,
  onToggle,
  onOpenSnooze,
}: {
  prefs: Record<PrefKey, boolean>;
  disabled: boolean;
  snooze: string;
  device: ReactNode;
  onToggle: (key: PrefKey, value: boolean) => void;
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

export function NotificationsGroup({ userId }: { userId: string }) {
  const now = useNow(60_000);
  const prefs = useNotificationPrefs(userId);
  const save = useSavePrefs(userId);
  const [open, setOpen] = useState(false);
  const values = prefs.data ?? DEFAULT_PREFS;
  const paused = snoozeText(values.snooze_until, now);
  return (
    <>
      <NotificationsGroupView
        prefs={values}
        disabled={!prefs.isSuccess || save.isPending}
        snooze={snoozeValue(values.snooze_until, now)}
        device={<DevicePushControl />}
        onToggle={(key, value) => save.mutate({ [key]: value })}
        onOpenSnooze={() => setOpen(true)}
      />
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
