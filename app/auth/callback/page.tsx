"use client";

import Link from "next/link";
import { AuthGate } from "@/components/AuthGate";

export default function Page() {
  return (
    <AuthGate need="anonymous">
      {() => (
        <main className="mx-auto max-w-md p-6 text-center">
          <p className="mb-4">Đăng nhập không thành công.</p>
          <Link href="/dang-nhap" className="text-accent-ink underline">
            Thử lại
          </Link>
        </main>
      )}
    </AuthGate>
  );
}
