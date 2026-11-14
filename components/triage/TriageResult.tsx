import { CallList } from "@/components/emergency/CallList";
import { TRIAGE } from "@/lib/content/triage";
import {
  goNowIf,
  RESULT_TITLE,
  type TriageResult as Result,
} from "@/lib/rules/triage";
import type { EmergencyContactRow } from "@/lib/supabase/rows";

const CARD = {
  red: "bg-alarm text-on-accent",
  yellow: "bg-warn-soft text-warn-ink",
  green: "bg-good-soft text-good-ink",
} as const;

const ICON = { red: "🔴", yellow: "🟡", green: "🟢" } as const;

// Spec §6.6: every result shows 115, the family's doctor numbers and the disclaimer.
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
    <section className="flex flex-col gap-4">
      <div
        role="alert"
        className={`flex flex-col gap-2 rounded-2xl p-4 ${CARD[result.level]}`}
      >
        <p className="text-xl font-semibold">
          <span aria-hidden="true">{ICON[result.level]}</span>{" "}
          {RESULT_TITLE[result.level]}
        </p>
        {result.findings.length > 0 && (
          <ul className="list-disc pl-5">
            {result.findings.map((finding) => (
              <li key={finding.text}>{finding.text}</li>
            ))}
          </ul>
        )}
      </div>
      {result.level === "green" && (
        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-medium">Chăm bé tại nhà</h2>
          <ul className="list-disc pl-5">
            {TRIAGE.homeCare.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>
      )}
      {result.level !== "red" && (
        <p className="font-medium">{goNowIf(TRIAGE.questions, ageDays)}</p>
      )}
      <CallList contacts={contacts} />
      <p className="text-sm text-muted">{TRIAGE.disclaimer}</p>
      <button
        type="button"
        onClick={onRestart}
        className="min-h-12 rounded-2xl border"
      >
        Làm lại
      </button>
    </section>
  );
}
