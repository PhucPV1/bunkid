"use client";

import Link from "next/link";
import { AuthGate } from "@/components/AuthGate";
import { buttonClass } from "@/components/ui/Button";
import { Glass } from "@/components/ui/Glass";

export default function Page() {
  return (
    <AuthGate need="anonymous">
      {() => (
        <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-6 py-6">
          <Glass className="flex flex-col items-center gap-4 p-5 text-center">
            <p className="text-base text-ink">Đăng nhập không thành công.</p>
            <Link href="/dang-nhap" className={buttonClass({ block: true })}>
              Thử lại
            </Link>
          </Glass>
        </main>
      )}
    </AuthGate>
  );
}
