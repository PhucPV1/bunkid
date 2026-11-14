"use client";

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
      <p className="text-sm font-medium">Mở YouTube bằng</p>
      <div className="grid grid-cols-2 gap-2">
        {OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            aria-pressed={mode === option.value}
            onClick={() => onChange(option.value)}
            className={`min-h-11 rounded-xl border px-2 ${mode === option.value ? "border-accent bg-accent-soft text-accent-ink" : ""}`}
          >
            {option.label}
          </button>
        ))}
      </div>
      <p className="text-sm text-muted">
        Chọn "Trình duyệt" nếu bấm vào mà iPhone báo địa chỉ không hợp lệ (ví dụ
        YouTube cài ngoài App Store). Lựa chọn lưu trên máy này.
      </p>
    </section>
  );
}
