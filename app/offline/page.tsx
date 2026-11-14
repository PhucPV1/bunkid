"use client";

import { useEffect, useState } from "react";

const GUIDES = [
  { href: "/khan-cap", label: "Thông tin khẩn cấp" },
  { href: "/tiem-chung", label: "Tiêm chủng" },
  { href: "/trieu-chung", label: "Triệu chứng" },
  { href: "/bong-be", label: "Bồng bế" },
  { href: "/phat-trien", label: "Phát triển" },
];

export default function Page() {
  const [cached, setCached] = useState<typeof GUIDES>([]);

  useEffect(() => {
    if (!("caches" in window)) return;
    void Promise.all(
      GUIDES.map(async (guide) =>
        (await caches.match(guide.href)) ? guide : null,
      ),
    ).then((found) =>
      setCached(found.filter((g): g is (typeof GUIDES)[number] => g !== null)),
    );
  }, []);

  return (
    <main className="mx-auto flex max-w-md flex-col gap-4 p-6 text-center">
      <h1 className="text-2xl font-semibold">Bạn đang offline</h1>
      <p className="text-muted">
        Kết nối mạng rồi bấm Thử lại. Những trang đã mở trước đó vẫn xem được.
      </p>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="min-h-12 rounded-2xl bg-accent text-on-accent"
      >
        Thử lại
      </button>
      {cached.length > 0 && (
        <ul className="divide-y rounded-2xl border text-left">
          {cached.map((guide) => (
            <li key={guide.href}>
              <a href={guide.href} className="flex min-h-12 items-center px-4">
                {guide.label}
              </a>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
