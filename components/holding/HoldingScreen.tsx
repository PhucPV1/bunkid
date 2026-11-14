"use client";

import { useState } from "react";
import { HOLDING } from "@/lib/content/holding";
import { browserOpenDeps, openYouTube, youtubePath } from "@/lib/rules/youtube";

// Spec §6.10: stage picked by the baby's age, positions as text, no pictures.
export function HoldingScreen({ ageDays }: { ageDays: number }) {
  const initial = ageDays < 91 ? "0_3" : ageDays < 183 ? "3_6" : "6_plus";
  const [stage, setStage] = useState(initial);
  const current = HOLDING.stages.find((s) => s.code === stage)!;
  return (
    <main className="mx-auto flex max-w-md flex-col gap-4 p-4">
      <h1 className="text-2xl font-semibold">{HOLDING.title}</h1>
      <p>{HOLDING.intro}</p>
      <div role="tablist" className="grid grid-cols-3 gap-2">
        {HOLDING.stages.map((s) => (
          <button
            key={s.code}
            type="button"
            role="tab"
            aria-selected={stage === s.code}
            onClick={() => setStage(s.code)}
            className={`min-h-11 rounded-xl border px-1 text-sm ${stage === s.code ? "border-accent bg-accent-soft text-accent-ink" : ""}`}
          >
            {s.name}
          </button>
        ))}
      </div>
      {current.positions.map((position) => (
        <section
          key={position.code}
          className="flex flex-col gap-2 rounded-2xl border p-4"
        >
          <h2 className="text-lg font-medium">{position.name}</h2>
          <ol className="list-decimal pl-5">
            {position.steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
          <div className="rounded-xl bg-warn-soft p-3 text-sm text-warn-ink">
            <p className="font-medium">Lưu ý an toàn</p>
            <ul className="list-disc pl-5">
              {position.safety.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </div>
          <button
            type="button"
            onClick={() =>
              openYouTube(
                youtubePath({ kind: "search", query: position.searchQuery }),
                browserOpenDeps(),
              )
            }
            className="min-h-11 rounded-xl border px-3"
          >
            Xem video
          </button>
          <a
            href={position.source}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-11 items-center text-sm text-muted underline"
          >
            Nguồn
          </a>
        </section>
      ))}
    </main>
  );
}
