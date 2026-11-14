"use client";

import type { ReactNode } from "react";
import { OnlineOnly } from "@/components/OnlineOnly";
import { PageHeader } from "@/components/ui/PageHeader";

export function SettingsSubpage({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <main className="mx-auto flex max-w-md flex-col gap-6 px-4 pt-2">
      <PageHeader title={title} back={{ href: "/cai-dat", label: "Cài đặt" }} />
      <OnlineOnly>{children}</OnlineOnly>
    </main>
  );
}
