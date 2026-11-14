"use client";

import { Button } from "@/components/ui/Button";
import { Glass } from "@/components/ui/Glass";
import { Icon } from "@/components/ui/Icon";
import { ListGroup } from "@/components/ui/ListGroup";
import { PageHeader } from "@/components/ui/PageHeader";

export type Guide = { href: string; label: string };

export const GUIDES: Guide[] = [
  { href: "/khan-cap", label: "Thông tin khẩn cấp" },
  { href: "/tiem-chung", label: "Tiêm chủng" },
  { href: "/trieu-chung", label: "Triệu chứng" },
  { href: "/bong-be", label: "Bồng bế" },
  { href: "/phat-trien", label: "Phát triển" },
];

export function OfflineView({
  cached,
  onRetry,
}: {
  cached: Guide[];
  onRetry: () => void;
}) {
  return (
    <main className="mx-auto flex max-w-md flex-col gap-[18px] px-4 pt-2 pb-4">
      <PageHeader title="Bạn đang offline" />
      <Glass className="flex flex-col gap-4 p-4">
        <p className="text-base text-ink">
          Kết nối mạng rồi bấm Thử lại. Những trang đã mở trước đó vẫn xem được.
        </p>
        <Button size="lg" block onClick={onRetry}>
          Thử lại
        </Button>
      </Glass>
      {cached.length > 0 && (
        <ListGroup title="Xem được khi offline">
          {cached.map((guide) => (
            <li
              key={guide.href}
              className="border-b border-line last:border-b-0"
            >
              {/* A plain link, so the browser loads the page the service worker cached. */}
              <a
                href={guide.href}
                className="flex min-h-[52px] items-center gap-3 px-4 text-base text-ink"
              >
                {guide.label}
                <Icon
                  name="chevronRight"
                  size={16}
                  className="ml-auto text-muted"
                />
              </a>
            </li>
          ))}
        </ListGroup>
      )}
    </main>
  );
}
