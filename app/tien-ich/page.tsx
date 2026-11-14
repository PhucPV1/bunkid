"use client";

import { RedirectTo } from "@/components/nav/RedirectTo";

// Spec §6.2: Cẩm nang and Tiện ích are now sections of Khám phá.
export default function Page() {
  return <RedirectTo href="/kham-pha" />;
}
