import { CallList } from "@/components/emergency/CallList";
import { Button } from "@/components/ui/Button";
import { Glass } from "@/components/ui/Glass";
import { TRIAGE } from "@/lib/content/triage";
import {
  goNowIf,
  RESULT_TITLE,
  type TriageResult as Result,
} from "@/lib/rules/triage";
import type { EmergencyContactRow } from "@/lib/supabase/rows";

const CARD = {
  red: "bg-danger-solid text-on-danger",
  yellow: "bg-warn-soft text-warn-ink",
  green: "bg-good-soft text-good-ink",
} as const;

// Spec gốc §6.6: every result shows 115, the family's doctor numbers and the disclaimer.
export function TriageResult({
  result,
  ageDays,
  contacts,
  onRestart,
}: {
  result: Result;
  ageDays: number;
  contacts: EmergencyContactRow[];
  onRestart: () => void;
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
      {result.level === "green" && (
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
