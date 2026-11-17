"use client";

import { useId, useRef, useState } from "react";
import { Glass } from "@/components/ui/Glass";
import type { ConditionArticle } from "@/lib/content/conditions";
import type { Suggestion } from "@/lib/rules/symptoms";
import { cx } from "@/lib/ui/cx";

const SECTIONS: { key: "signs" | "homeCare" | "seeDoctor"; title: string }[] = [
  { key: "signs", title: "Dấu hiệu" },
  { key: "homeCare", title: "Chăm tại nhà" },
  { key: "seeDoctor", title: "Nên đi khám" },
];

// WAI-ARIA tabs: arrows wrap, Home and End jump; any other key is not ours.
export function nextTabIndex(
  current: number,
  key: string,
  count: number,
): number | null {
  if (key === "ArrowRight") return (current + 1) % count;
  if (key === "ArrowLeft") return (current - 1 + count) % count;
  if (key === "Home") return 0;
  if (key === "End") return count - 1;
  return null;
}

// Spec 2026-11-17 §6.2 block 3 (phương án E).
export function ConditionTabs({ suggestions }: { suggestions: Suggestion[] }) {
  const [selected, setSelected] = useState(0);
  const id = useId();
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  if (suggestions.length === 0) return null;
  const index = Math.min(selected, suggestions.length - 1);
  const current = suggestions[index];

  function choose(next: number) {
    setSelected(next);
    const tab = tabs.current[next];
    tab?.focus();
    tab?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }

  return (
    <section className="flex flex-col gap-3">
      <h2 className="px-1 text-xl leading-[26px] font-bold text-ink">
        Có thể bé đang bị
      </h2>
      <p className="-mt-2 px-1 text-[13px] text-muted">
        Gợi ý theo triệu chứng đã chọn, không phải chẩn đoán.
      </p>
      <div
        role="tablist"
        aria-label="Bệnh có thể gặp"
        className="flex gap-1.5 overflow-x-auto rounded-full bg-ink/8 p-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {suggestions.map((suggestion, position) => {
          const on = position === index;
          return (
            <button
              key={suggestion.article.code}
              ref={(element) => {
                tabs.current[position] = element;
              }}
              type="button"
              role="tab"
              id={`${id}-tab-${position}`}
              aria-selected={on}
              aria-controls={`${id}-panel`}
              tabIndex={on ? 0 : -1}
              onClick={() => choose(position)}
              onKeyDown={(event) => {
                const next = nextTabIndex(
                  position,
                  event.key,
                  suggestions.length,
                );
                if (next === null) return;
                event.preventDefault();
                choose(next);
              }}
              className={cx(
                "min-h-11 shrink-0 rounded-full px-4 text-[15px] text-ink",
                on
                  ? "bg-glass-solid font-semibold shadow-[0_2px_6px_rgb(0_0_0/0.12)]"
                  : "font-medium",
              )}
            >
              {suggestion.article.short ?? suggestion.article.title}
            </button>
          );
        })}
      </div>
      <Glass
        as="article"
        role="tabpanel"
        id={`${id}-panel`}
        aria-labelledby={`${id}-tab-${index}`}
        className="flex flex-col gap-3 p-4 text-base text-ink"
      >
        <ArticleBody article={current.article} matched={current.matched} />
      </Glass>
    </section>
  );
}

function ArticleBody({
  article,
  matched,
}: {
  article: ConditionArticle;
  matched: string[];
}) {
  return (
    <>
      <p className="text-[15px] text-muted">Khớp: {matched.join(", ")}</p>
      <p>{article.summary}</p>
      {SECTIONS.map((section) => (
        <section key={section.key}>
          <h3 className="text-[15px] font-semibold">{section.title}</h3>
          <ul className="list-disc pl-5">
            {article[section.key].map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </section>
      ))}
      <section className="rounded-[16px] bg-danger-soft p-3 text-danger-ink">
        <h3 className="font-semibold">Đi khám ngay</h3>
        <ul className="list-disc pl-5">
          {article.goNow.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </section>
      <p className="text-[13px] text-muted">
        Thường kéo dài: {article.usualCourse} · Nguồn:{" "}
        <a
          href={article.source}
          className="inline-flex min-h-11 items-center underline"
          target="_blank"
          rel="noreferrer"
        >
          NHS
        </a>{" "}
        (xem lại {article.reviewedAt.split("-").reverse().join("/")})
      </p>
    </>
  );
}
