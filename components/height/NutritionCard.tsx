"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { Popup } from "@/components/ui/Popup";
import {
  NUTRITION,
  type NutritionContent,
  type NutritionStage,
  nutritionStage,
} from "@/lib/content/nutrition";

// Spec 2026-11-25 §7.3: what to feed at the baby's stage. The lines are read,
// not tapped; the last row opens the lines of the next stage.
export function NutritionCardView({
  current,
  next,
  sources,
  onOpenNext,
}: {
  current: NutritionStage;
  next: NutritionStage | null;
  sources: NutritionContent["sources"];
  onOpenNext: () => void;
}) {
  return (
    <section className="flex flex-col gap-2.5">
      <h2 className="mx-1 text-xl leading-[26px] font-bold text-ink">
        Dinh dưỡng {current.title}
      </h2>
      <ul className="glass overflow-hidden rounded-[26px]">
        {current.items.map((item) => (
          <li
            key={item}
            className="flex items-start gap-3 border-b border-line px-4 py-3 last:border-b-0"
          >
            <Icon
              name="check"
              size={18}
              strokeWidth={2.4}
              // 18 px in a 20 px line: level with the first line of the text.
              className="mt-px shrink-0 text-good"
            />
            <span className="text-[15px] leading-5 text-ink">{item}</span>
          </li>
        ))}
        {next && (
          <li>
            <button
              type="button"
              onClick={onOpenNext}
              className="flex min-h-11 w-full items-center gap-3 px-4 py-3 text-left text-[15px] leading-5 font-semibold text-accent-text"
            >
              <span className="min-w-0 flex-1">Giai đoạn kế: {next.title}</span>
              <Icon name="chevronRight" size={16} className="text-muted" />
            </button>
          </li>
        )}
      </ul>
      <p className="px-1 text-[13px] leading-[18px] text-muted">
        Nguồn: {sources.map((source) => source.name).join(", ")}.
      </p>
    </section>
  );
}

export function NextStagePopup({
  stage,
  onClose,
}: {
  stage: NutritionStage;
  onClose: () => void;
}) {
  return (
    <Popup title={`Dinh dưỡng ${stage.title}`} onClose={onClose}>
      <ul className="flex flex-col gap-2 text-left">
        {stage.items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </Popup>
  );
}

// Nothing is drawn for a child past the last stage (day 1856).
export function NutritionCard({ ageDays }: { ageDays: number }) {
  const [open, setOpen] = useState(false);
  const { current, next } = nutritionStage(ageDays);
  if (!current) return null;
  return (
    <>
      <NutritionCardView
        current={current}
        next={next}
        sources={NUTRITION.sources}
        onOpenNext={() => setOpen(true)}
      />
      {open && next && (
        <NextStagePopup stage={next} onClose={() => setOpen(false)} />
      )}
    </>
  );
}
