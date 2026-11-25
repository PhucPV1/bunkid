"use client";

import { RedirectTo } from "@/components/nav/RedirectTo";

// Spec 2026-11-25 §3.1: Khám phá and Cẩm nang are now the Sức khỏe tab.
export default function Page() {
  return <RedirectTo href="/suc-khoe" />;
}
