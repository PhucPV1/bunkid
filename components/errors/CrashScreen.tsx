"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Glass } from "@/components/ui/Glass";
import { localDb } from "@/lib/data/localDb";
import { PERSIST_KEY } from "@/lib/data/persister";

// Shown by app/error.tsx when a page throws while rendering. An installed PWA
// has no reload button, so the way out has to be on the screen itself.
export function CrashScreen({ onRetry }: { onRetry: () => void }) {
  const [clearing, setClearing] = useState(false);

  // Only the saved copy of server data goes; writes waiting in the outbox stay.
  async function clearAndReload() {
    setClearing(true);
    try {
      await localDb().kv.delete(PERSIST_KEY);
    } catch (error) {
      console.warn("Không xoá được dữ liệu tạm", error);
    }
    window.location.reload();
  }

  return (
    <main className="mx-auto flex max-w-md flex-col gap-4 px-4 pt-10 pb-4">
      <Glass role="alert" className="flex flex-col gap-3 border-danger! p-4">
        <h1 className="text-[19px] font-bold text-ink">
          Trang này gặp lỗi khi hiển thị
        </h1>
        <p className="text-[15px] text-muted">
          Thử lại trước. Nếu vẫn lỗi, xoá dữ liệu tạm để tải lại từ máy chủ; các
          mục đang chờ đồng bộ vẫn được giữ.
        </p>
        <Button block onClick={onRetry} disabled={clearing}>
          Thử lại
        </Button>
        <Button
          block
          variant="secondary"
          busy={clearing}
          onClick={() => void clearAndReload()}
        >
          Xoá dữ liệu tạm và tải lại
        </Button>
      </Glass>
    </main>
  );
}
