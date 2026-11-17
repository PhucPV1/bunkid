"use client";

import { useEffect } from "react";
import { CrashScreen } from "@/components/errors/CrashScreen";

export default function Error({
  error,
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  useEffect(() => {
    console.error("Lỗi khi hiển thị trang", error);
  }, [error]);

  return <CrashScreen onRetry={retry} />;
}
