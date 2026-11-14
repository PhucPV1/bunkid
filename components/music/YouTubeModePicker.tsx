"use client";

import { Segmented } from "@/components/ui/Segmented";
import type { OpenMode } from "@/lib/rules/youtube";

const OPTIONS: { value: OpenMode; label: string }[] = [
  { value: "app", label: "App YouTube" },
  { value: "web", label: "Trình duyệt" },
];

export function YouTubeModePicker({
  mode,
  onChange,
}: {
  mode: OpenMode;
  onChange: (mode: OpenMode) => void;
}) {
  return (
    <section className="flex flex-col gap-2">
      <p className="px-1 text-[13px] font-semibold text-muted">
        Mở YouTube bằng
      </p>
      <Segmented
        label="Mở YouTube bằng"
        options={OPTIONS}
        value={mode}
        onChange={onChange}
      />
      <p className="px-1 text-[13px] text-muted">
        Chọn "Trình duyệt" nếu bấm vào mà iPhone báo địa chỉ không hợp lệ (ví dụ
        YouTube cài ngoài App Store). Lựa chọn lưu trên máy này.
      </p>
    </section>
  );
}
