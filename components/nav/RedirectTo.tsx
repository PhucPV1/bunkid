"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function RedirectTo({ href }: { href: string }) {
  const router = useRouter();
  useEffect(() => {
    router.replace(href);
  }, [href, router]);
  return null;
}
