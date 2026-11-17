"use client";

import { useState } from "react";
import { Call115Button } from "@/components/emergency/CallList";
import { FIELD_INPUT, FIELD_LABEL } from "@/components/quick/styles";
import { Button } from "@/components/ui/Button";
import { Glass } from "@/components/ui/Glass";
import { ListGroup } from "@/components/ui/ListGroup";
import { PageHeader } from "@/components/ui/PageHeader";
import { Switch } from "@/components/ui/Switch";
import { CONDITIONS } from "@/lib/content/conditions";
import { type FirstAid, TRIAGE } from "@/lib/content/triage";
import { useEmergencyContacts } from "@/lib/data/emergency";
import { useRecentLogs } from "@/lib/data/logs";
import { wetDiapersInWindow } from "@/lib/rules/ratings";
import {
  effectiveSymptoms,
  firstAidFor,
  type Suggestion,
  suggestConditions,
  visibleSymptoms,
} from "@/lib/rules/symptoms";
import { ageDays, formatAgeVi } from "@/lib/rules/time";
import {
  evaluateTriage,
  hasFever,
  parseCelsius,
  questionText,
  recentCelsius,
  visibleQuestions,
  type TriageResult as Result,
} from "@/lib/rules/triage";
import type { Baby } from "@/lib/supabase/rows";
import { SymptomChips } from "./SymptomChips";
import { TriageResult } from "./TriageResult";

type Outcome = {
  result: Result;
  suggestions: Suggestion[];
  firstAid: FirstAid[];
};

export function TriageScreen({ baby }: { baby: Baby }) {
  const now = new Date();
  const age = ageDays(baby.dob, now);
  const logs = useRecentLogs(baby.id);
  const contacts = useEmergencyContacts(baby.family_id);
  const logged = recentCelsius(logs.data ?? [], now);
  const [celsius, setCelsius] = useState<string | null>(null);
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [symptoms, setSymptoms] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  // Step 1 (spec gốc §6.6): prefilled from a temperature logged in the last 6 hours, editable.
  const temperature =
    celsius ?? (logged === null ? "" : String(logged).replace(".", ","));
  const parsedNow = parseCelsius(temperature);
  const feverLocked = parsedNow !== "bad" && hasFever(parsedNow);
  const questions = visibleQuestions(TRIAGE.questions, age);
  const chips = visibleSymptoms(TRIAGE.symptoms, age);
  const wet = wetDiapersInWindow(logs.data ?? [], now);
  const diapersLogged = (logs.data ?? []).some(
    (log) =>
      log.type === "diaper" &&
      now.getTime() - Date.parse(log.started_at) <= 24 * 3_600_000,
  );

  function toggle(code: string, on: boolean) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (on) next.add(code);
      else next.delete(code);
      return next;
    });
  }

  function toggleSymptom(code: string) {
    setSymptoms((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  }

  function submit() {
    const parsed = parseCelsius(temperature);
    if (parsed === "bad") {
      setError("Nhiệt độ từ 30 đến 43°C, ví dụ 38,5.");
      return;
    }
    setError(null);
    setOutcome({
      result: evaluateTriage({
        questions: TRIAGE.questions,
        checked,
        celsius: parsed,
        ageDays: age,
      }),
      suggestions: suggestConditions({
        symptoms: TRIAGE.symptoms,
        articles: CONDITIONS.articles,
        selected: effectiveSymptoms(symptoms, parsed),
        ageDays: age,
      }),
      firstAid: firstAidFor({
        blocks: TRIAGE.firstAid,
        checked,
        celsius: parsed,
        ageDays: age,
        questions: TRIAGE.questions,
      }),
    });
    window.scrollTo({ top: 0 });
  }

  return (
    <main className="mx-auto flex max-w-md flex-col gap-[18px] px-4 pt-2 pb-4">
      <PageHeader
        title={TRIAGE.title}
        back={{ href: "/kham-pha", label: "Khám phá" }}
      />
      <p className="px-1 text-[13px] text-muted">{TRIAGE.disclaimer}</p>
      {!outcome && <Call115Button label="Gọi cấp cứu 115" />}
      {outcome ? (
        <TriageResult
          result={outcome.result}
          suggestions={outcome.suggestions}
          firstAid={outcome.firstAid}
          ageDays={age}
          contacts={contacts.data ?? []}
          onRestart={() => {
            setOutcome(null);
            setChecked(new Set());
            setSymptoms(new Set());
            setCelsius(null);
            setError(null);
            window.scrollTo({ top: 0 });
          }}
        />
      ) : (
        <>
          <Glass as="section" className="flex flex-col gap-3 p-4">
            <p className="text-base text-ink">
              Tuổi của bé: <strong>{formatAgeVi(baby.dob, now)}</strong>
            </p>
            <label className="flex flex-col gap-1.5">
              <span className={FIELD_LABEL}>
                Nhiệt độ gần nhất (°C, để trống nếu chưa đo)
              </span>
              <input
                inputMode="decimal"
                className={`${FIELD_INPUT} tabular-nums`}
                value={temperature}
                onChange={(event) => setCelsius(event.target.value)}
              />
            </label>
            {logged !== null && celsius === null && (
              <p className="text-[13px] text-muted">
                Lấy từ nhật ký trong 6 giờ qua.
              </p>
            )}
            {error && (
              <p role="alert" className="text-[15px] text-danger">
                {error}
              </p>
            )}
          </Glass>
          <div className="flex flex-col gap-1 px-1">
            <h2 className="text-xl leading-[26px] font-bold text-ink">
              Bé đang có gì?
            </h2>
            <p className="text-sm text-muted">Chạm để chọn, chọn được nhiều.</p>
          </div>
          <SymptomChips
            groups={TRIAGE.groups}
            symptoms={chips}
            selected={symptoms}
            feverLocked={feverLocked}
            onToggle={toggleSymptom}
          />
          <h2 className="px-1 text-xl leading-[26px] font-bold text-ink">
            Có dấu hiệu nào dưới đây?
          </h2>
          {TRIAGE.groups.map((group) => {
            const list = questions.filter((q) => q.group === group.code);
            if (list.length === 0) return null;
            return (
              <ListGroup key={group.code} title={group.name}>
                {list.map((question) => (
                  <li
                    key={question.code}
                    className="flex min-h-[52px] items-center justify-between gap-3 border-b border-line px-4 py-2 last:border-b-0"
                  >
                    <span className="flex min-w-0 flex-col">
                      <span className="text-base text-ink">
                        {questionText(question, age)}
                      </span>
                      {question.code === "few_wet_diapers" && logs.data && (
                        <span className="text-[13px] text-muted">
                          {diapersLogged
                            ? `Nhật ký ghi ${wet} tã ướt trong 24 giờ qua.`
                            : "Nhật ký chưa ghi tã nào trong 24 giờ qua."}
                        </span>
                      )}
                    </span>
                    <Switch
                      checked={checked.has(question.code)}
                      label={questionText(question, age)}
                      onChange={(on) => toggle(question.code, on)}
                    />
                  </li>
                ))}
              </ListGroup>
            );
          })}
          <Button size="lg" block onClick={submit}>
            Xem kết quả
          </Button>
          <Call115Button label="Gọi cấp cứu 115" />
        </>
      )}
    </main>
  );
}
