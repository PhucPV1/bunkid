import { CallList } from "@/components/emergency/CallList";
import { Button } from "@/components/ui/Button";
import { Glass } from "@/components/ui/Glass";
import { type FirstAid, TRIAGE } from "@/lib/content/triage";
import type { Suggestion } from "@/lib/rules/symptoms";
import {
  goNowIf,
  RESULT_TITLE,
  type TriageResult as Result,
} from "@/lib/rules/triage";
import type { EmergencyContactRow } from "@/lib/supabase/rows";
import { ConditionTabs } from "./ConditionTabs";

const CARD = {
  red: "bg-danger-solid text-on-danger",
  yellow: "bg-warn-soft text-warn-ink",
  green: "bg-good-soft text-good-ink",
} as const;

// Spec gốc §6.6: every result shows 115, the family's doctor numbers and the disclaimer.
// Spec 2026-11-17 §6.2: first aid and possible conditions, in this order.
export function TriageResult({
  result,
  ageDays,
  contacts,
  onRestart,
  suggestions = [],
  firstAid = [],
}: {
  result: Result;
  ageDays: number;
  contacts: EmergencyContactRow[];
  onRestart: () => void;
  suggestions?: Suggestion[];
  firstAid?: FirstAid[];
}) {
  return (
    <section className="flex flex-col gap-[18px]">
      <div
        role="alert"
        className={`flex flex-col gap-2 rounded-[28px] p-4 ${CARD[result.level]}`}
      >
        <p className="text-xl leading-[26px] font-bold">
          {RESULT_TITLE[result.level]}
        </p>
        {result.findings.length > 0 && (
          <ul className="list-disc pl-5 text-base">
            {result.findings.map((finding) => (
              <li key={finding.text}>{finding.text}</li>
            ))}
          </ul>
        )}
      </div>
      {result.level === "red" && (
        <>
          {firstAid.map((block) => (
            <section
              key={block.code}
              className="flex flex-col gap-2 rounded-[28px] border-2 border-danger-solid bg-glass-solid p-4"
            >
              <h2 className="text-lg font-bold text-danger-ink">
                {block.title}
              </h2>
              <ol className="list-decimal pl-5 text-base text-ink">
                {block.steps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            </section>
          ))}
          <Glass className="flex flex-col gap-2 p-4">
            <h2 className="text-[17px] font-semibold text-ink">
              Trên đường đi
            </h2>
            <ul className="list-disc pl-5 text-base text-ink">
              {TRIAGE.whileGoing.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </Glass>
        </>
      )}
      {result.level === "yellow" && (
        <AidCard title="Trong lúc chờ đi khám" blocks={firstAid} fallback />
      )}
      {result.level === "green" && firstAid.length > 0 && (
        <AidCard title="Làm ngay tại nhà" blocks={firstAid} fallback={false} />
      )}
      <ConditionTabs suggestions={suggestions} />
      {result.level === "green" && suggestions.length === 0 && (
        <Glass className="flex flex-col gap-2 p-4">
          <h2 className="text-[17px] font-semibold text-ink">
            Chăm bé tại nhà
          </h2>
          <ul className="list-disc pl-5 text-base text-ink">
            {TRIAGE.homeCare.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </Glass>
      )}
      {result.level !== "red" && (
        <p className="px-1 text-base font-semibold text-ink">
          {goNowIf(TRIAGE.questions, ageDays)}
        </p>
      )}
      <CallList contacts={contacts} />
      <p className="px-1 text-[13px] text-muted">{TRIAGE.disclaimer}</p>
      <Button variant="secondary" size="lg" block onClick={onRestart}>
        Làm lại
      </Button>
    </section>
  );
}

// Yellow and green: matched first-aid blocks in one card; yellow falls back to home care.
function AidCard({
  title,
  blocks,
  fallback,
}: {
  title: string;
  blocks: FirstAid[];
  fallback: boolean;
}) {
  return (
    <Glass className="flex flex-col gap-3 p-4 text-base text-ink">
      <h2 className="text-[17px] font-semibold">{title}</h2>
      {blocks.length > 0
        ? blocks.map((block) => (
            <section key={block.code} className="flex flex-col gap-1">
              <h3 className="text-[15px] font-semibold">{block.title}</h3>
              <ol className="list-decimal pl-5">
                {block.steps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            </section>
          ))
        : fallback && (
            <ul className="list-disc pl-5">
              {TRIAGE.homeCare.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          )}
    </Glass>
  );
}
