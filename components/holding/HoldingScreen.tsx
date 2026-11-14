"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Glass } from "@/components/ui/Glass";
import { Icon } from "@/components/ui/Icon";
import { PageHeader } from "@/components/ui/PageHeader";
import { Segmented } from "@/components/ui/Segmented";
import { HOLDING } from "@/lib/content/holding";
import { useYouTubeOpener } from "@/lib/hooks/useYouTubeOpener";
import { youtubePath } from "@/lib/rules/youtube";

const STAGES = HOLDING.stages.map((s) => ({ value: s.code, label: s.name }));

// Spec gốc §6.10: stage picked by the baby's age, positions as text, no pictures.
export function HoldingScreen({ ageDays }: { ageDays: number }) {
  const initial = ageDays < 91 ? "0_3" : ageDays < 183 ? "3_6" : "6_plus";
  const [stage, setStage] = useState(initial);
  // Same per-device choice as the music page (app or browser).
  const youtube = useYouTubeOpener();
  const current = HOLDING.stages.find((s) => s.code === stage)!;
  return (
    <main className="mx-auto flex max-w-md flex-col gap-[18px] px-4 pt-2 pb-4">
      <PageHeader
        title={HOLDING.title}
        back={{ href: "/kham-pha", label: "Khám phá" }}
      />
      <p className="px-1 text-base text-ink">{HOLDING.intro}</p>
      <Segmented
        label="Giai đoạn"
        options={STAGES}
        value={stage}
        onChange={setStage}
      />
      {current.positions.map((position) => (
        <Glass
          as="section"
          key={position.code}
          className="flex flex-col gap-3 p-4"
        >
          <h2 className="text-[17px] font-semibold text-ink">
            {position.name}
          </h2>
          <ol className="list-decimal pl-5 text-base text-ink">
            {position.steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
          <div className="rounded-[16px] bg-warn-soft p-3 text-[15px] text-warn-ink">
            <p className="font-semibold">Lưu ý an toàn</p>
            <ul className="list-disc pl-5">
              {position.safety.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </div>
          <Button
            variant="secondary"
            size="md"
            onClick={() =>
              youtube.open(
                youtubePath({ kind: "search", query: position.searchQuery }),
              )
            }
          >
            <Icon name="play" size={16} filled />
            Xem video
          </Button>
          <a
            href={position.source}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-11 items-center text-[13px] text-muted underline"
          >
            Nguồn
          </a>
        </Glass>
      ))}
    </main>
  );
}
