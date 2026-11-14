"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import {
  deviceState,
  disablePush,
  enablePush,
  type DeviceState,
} from "@/lib/push/browser";

const MESSAGE: Partial<Record<DeviceState, string>> = {
  "needs-install":
    "Cài Kim Bun lên màn hình chính rồi mở từ biểu tượng để nhận thông báo.",
  unsupported: "Trình duyệt này không nhận được thông báo.",
  "not-configured": "Thông báo chưa được thiết lập trên máy chủ.",
  denied:
    "Bạn đã chặn thông báo. Mở Cài đặt iOS → Thông báo → Kim Bun, bật Cho phép thông báo.",
  on: "Máy này đang nhận thông báo.",
};

export function DevicePushControl() {
  const [state, setState] = useState<DeviceState | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    deviceState()
      .then(setState)
      .catch(() => setState("unsupported"));
  }, []);

  async function run(action: () => Promise<DeviceState>) {
    setBusy(true);
    setError(null);
    try {
      setState(await action());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không bật được thông báo.");
    } finally {
      setBusy(false);
    }
  }

  if (state === null)
    return <p className="text-[15px] text-muted">Đang kiểm tra…</p>;
  return (
    <div className="flex flex-col gap-2.5">
      {MESSAGE[state] && (
        <p
          className={
            state === "on"
              ? "text-[15px] text-good-ink"
              : "text-[15px] text-muted"
          }
        >
          {MESSAGE[state]}
        </p>
      )}
      {state === "needs-install" && (
        <Link
          href="/cai-app"
          className="flex min-h-11 items-center text-[15px] font-semibold text-accent-text"
        >
          Cách cài Kim Bun lên màn hình chính
        </Link>
      )}
      {state === "off" && (
        <Button size="md" block busy={busy} onClick={() => run(enablePush)}>
          Bật thông báo trên máy này
        </Button>
      )}
      {state === "on" && (
        <Button
          variant="secondary"
          size="md"
          block
          busy={busy}
          onClick={() => run(disablePush)}
        >
          Tắt thông báo trên máy này
        </Button>
      )}
      {error && (
        <p role="alert" className="text-[15px] text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
