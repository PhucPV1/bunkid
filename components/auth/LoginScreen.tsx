"use client";

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
      <p className="text-neutral-600">
        Theo dõi bú, ngủ, tã của bé cùng cả nhà.
      </p>
      <button
        type="button"
        onClick={signIn}
        className="min-h-12 rounded-2xl bg-pink-500 text-lg font-medium text-white"
      >
        Đăng nhập bằng Google
      </button>
      {error && (
        <p role="alert" className="text-red-600">
          {error}
        </p>
      )}
    </main>
  );
}
