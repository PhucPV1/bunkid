"use client";

import { useEffect, useState, type ReactNode } from "react";
import { BrandMark } from "@/components/brand/BrandMark";
import { OnlineOnly } from "@/components/OnlineOnly";
import { DevicePushControl } from "@/components/push/DevicePushControl";
import { Glass } from "@/components/ui/Glass";
import { Icon } from "@/components/ui/Icon";
import { ListGroup } from "@/components/ui/ListGroup";
import { PageHeader } from "@/components/ui/PageHeader";

function isStandalone(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

const STEPS: ReactNode[] = [
  <>
    Mở trang này bằng Safari, bấm nút <strong>Chia sẻ</strong> (hình vuông có
    mũi tên đi lên).
  </>,
  <>
    Chọn <strong>Thêm vào MH chính</strong>, rồi bấm <strong>Thêm</strong>.
  </>,
  <>Mở Kim Bun từ biểu tượng mới trên màn hình chính và đăng nhập lại.</>,
];

export function InstallGuideView({
  standalone,
}: {
  standalone: boolean | null;
}) {
  return (
    <main className="mx-auto flex max-w-md flex-col gap-[18px] px-4 pt-2 pb-4">
      <PageHeader title="Cài Kim Bun" back={{ href: "/", label: "Quay lại" }} />
      <BrandMark size="md" heading={false} />
      {standalone === true && (
        <>
          <Glass className="flex items-start gap-3 p-4">
            <Icon
              name="check"
              size={22}
              className="mt-0.5 shrink-0 text-good"
            />
            <p className="text-base text-ink">
              Kim Bun đã được cài và đang chạy từ màn hình chính.
            </p>
          </Glass>
          <OnlineOnly>
            <DevicePushControl />
          </OnlineOnly>
        </>
      )}
      {standalone === false && (
        <>
          <Glass className="flex items-start gap-3 p-4">
            <Icon name="bell" size={22} className="mt-0.5 shrink-0 text-warn" />
            <p className="text-base text-ink">
              Phải cài Kim Bun lên màn hình chính thì iPhone mới nhận được thông
              báo.
            </p>
          </Glass>
          <ListGroup title="Cách cài">
            {STEPS.map((step, i) => (
              <li
                key={i}
                className="flex items-start gap-3 border-b border-line px-4 py-3 last:border-b-0"
              >
                <span className="flex size-[30px] shrink-0 items-center justify-center rounded-full bg-accent text-[15px] font-semibold text-on-accent">
                  {i + 1}
                </span>
                <p className="pt-1 text-base text-ink">{step}</p>
              </li>
            ))}
          </ListGroup>
        </>
      )}
    </main>
  );
}

export function InstallGuide() {
  const [standalone, setStandalone] = useState<boolean | null>(null);
  useEffect(() => setStandalone(isStandalone()), []);
  return <InstallGuideView standalone={standalone} />;
}
