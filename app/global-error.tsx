"use client";

import { useEffect } from "react";

// Replaces the root layout when it throws, so nothing from globals.css or the
// theme script is available here: system colours and inline styles only.
export default function GlobalError({
  error,
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  useEffect(() => {
    console.error("Lỗi khi tải ứng dụng", error);
  }, [error]);

  const button = {
    minHeight: 50,
    padding: "0 20px",
    borderRadius: 999,
    border: "1px solid currentColor",
    background: "transparent",
    color: "inherit",
    font: "inherit",
    fontWeight: 600,
  } as const;

  return (
    <html lang="vi">
      <body
        style={{
          colorScheme: "light dark",
          margin: 0,
          padding: "40px 16px",
          fontFamily: "system-ui, sans-serif",
          fontSize: 16,
        }}
      >
        <title>Kim Bun gặp lỗi</title>
        <main
          role="alert"
          style={{
            maxWidth: 448,
            margin: "0 auto",
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          <h1 style={{ fontSize: 19, margin: 0 }}>Kim Bun gặp lỗi khi mở</h1>
          <p style={{ margin: 0 }}>
            Thử lại, hoặc tải lại ứng dụng. Các mục đang chờ đồng bộ vẫn được
            giữ.
          </p>
          <button type="button" style={button} onClick={() => retry()}>
            Thử lại
          </button>
          <button
            type="button"
            style={button}
            onClick={() => window.location.reload()}
          >
            Tải lại
          </button>
        </main>
      </body>
    </html>
  );
}
