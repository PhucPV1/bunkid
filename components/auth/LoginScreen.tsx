"use client";

import Link from "next/link";
import { useState } from "react";
import { supabase } from "@/lib/supabase/client";

export function LoginScreen() {
  const [error, setError] = useState<string | null>(null);

  async function signIn() {
    setError(null);
    const { error: authError } = await supabase().auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (authError)
      setError("Không mở được trang đăng nhập Google. Thử lại sau.");
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 p-6 text-center">
      <h1 className="text-3xl font-semibold">Bé Yêu</h1>
      <p className="text-muted">Theo dõi bú, ngủ, tã của bé cùng cả nhà.</p>
      <button
        type="button"
        onClick={signIn}
        className="min-h-12 rounded-2xl bg-accent text-lg font-medium text-on-accent"
      >
        Đăng nhập bằng Google
      </button>
      <Link
        href="/cai-app"
        className="flex min-h-11 items-center justify-center text-accent-ink underline"
      >
        Cách cài Bé Yêu lên màn hình chính
      </Link>
      {error && (
        <p role="alert" className="text-danger">
          {error}
        </p>
      )}
    </main>
  );
}
