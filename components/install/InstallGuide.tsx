"use client";

import Link from "next/link";
import { OnlineOnly } from "@/components/OnlineOnly";
import { DevicePushControl } from "@/components/push/DevicePushControl";
import { useEffect, useState } from "react";

function isStandalone(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export function InstallGuide() {
  const [standalone, setStandalone] = useState<boolean | null>(null);
  useEffect(() => setStandalone(isStandalone()), []);

  return (
    <main className="mx-auto flex max-w-md flex-col gap-4 p-6">
      <Link href="/" className="flex min-h-11 items-center text-accent-ink">
        ← Quay lại
      </Link>
      <h1 className="text-2xl font-semibold">Cài Kim Bun</h1>
      {standalone === true && (
        <>
          <p className="rounded-2xl bg-good-soft p-4 text-good-ink">
            Kim Bun đã được cài và đang chạy từ màn hình chính.
          </p>
          <OnlineOnly>
            <DevicePushControl />
          </OnlineOnly>
        </>
      )}
      {standalone === false && (
        <>
          <p className="rounded-2xl bg-warn-soft p-4 text-warn-ink">
            Phải cài Kim Bun lên màn hình chính thì iPhone mới nhận được thông
            báo.
          </p>
          <ol className="flex flex-col gap-3">
            <li>
              1. Mở trang này bằng Safari, bấm nút <strong>Chia sẻ</strong>{" "}
              (hình vuông có mũi tên đi lên).
            </li>
            <li>
              2. Chọn <strong>Thêm vào MH chính</strong>, rồi bấm{" "}
              <strong>Thêm</strong>.
            </li>
            <li>
              3. Mở Kim Bun từ biểu tượng mới trên màn hình chính và đăng nhập
              lại.
            </li>
          </ol>
        </>
      )}
    </main>
  );
}
