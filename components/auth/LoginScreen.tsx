"use client";

import Link from "next/link";
import { useState } from "react";
import { BrandMark } from "@/components/brand/BrandMark";
import { supabase } from "@/lib/supabase/client";
import { GoogleButton } from "./GoogleButton";

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
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-8 px-6 py-6 text-center">
      <BrandMark tagline="Nhật ký chăm bé của cả nhà" />
      <div className="flex flex-col gap-3">
        <GoogleButton onClick={() => void signIn()} />
        <Link
          href="/cai-app"
          className="flex min-h-11 items-center justify-center text-[15px] font-semibold text-accent-text"
        >
          Cách cài Kim Bun lên màn hình chính
        </Link>
        {error && (
          <p role="alert" className="text-[15px] text-danger">
            {error}
          </p>
        )}
      </div>
    </main>
  );
}
