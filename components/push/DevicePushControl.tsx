"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  deviceState,
  disablePush,
  enablePush,
  type DeviceState,
} from "@/lib/push/browser";

const MESSAGE: Partial<Record<DeviceState, string>> = {
  "needs-install":
    "Cài Bé Yêu lên màn hình chính rồi mở từ biểu tượng để nhận thông báo.",
  unsupported: "Trình duyệt này không nhận được thông báo.",
  "not-configured": "Thông báo chưa được thiết lập trên máy chủ.",
  denied:
    "Bạn đã chặn thông báo. Mở Cài đặt iOS → Thông báo → Bé Yêu, bật Cho phép thông báo.",
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

  if (state === null) return <p className="text-muted">Đang kiểm tra…</p>;
  return (
    <div className="flex flex-col gap-2">
      {MESSAGE[state] && (
        <p className={state === "on" ? "text-good-ink" : "text-muted"}>
          {MESSAGE[state]}
        </p>
      )}
      {state === "needs-install" && (
        <Link
          href="/cai-app"
          className="flex min-h-11 items-center text-accent-ink underline"
        >
          Cách cài Bé Yêu lên màn hình chính
        </Link>
      )}
      {state === "off" && (
        <button
          type="button"
          disabled={busy}
          onClick={() => run(enablePush)}
          className="min-h-11 rounded-xl bg-accent text-on-accent disabled:opacity-50"
        >
          Bật thông báo trên máy này
        </button>
      )}
      {state === "on" && (
        <button
          type="button"
          disabled={busy}
          onClick={() => run(disablePush)}
          className="min-h-11 rounded-xl border disabled:opacity-50"
        >
          Tắt thông báo trên máy này
        </button>
      )}
      {error && (
        <p role="alert" className="text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
