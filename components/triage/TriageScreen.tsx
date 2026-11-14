"use client";

import { useState } from "react";
import { TRIAGE } from "@/lib/content/triage";
import { useEmergencyContacts } from "@/lib/data/emergency";
import { useRecentLogs } from "@/lib/data/logs";
import { wetDiapersInWindow } from "@/lib/rules/ratings";
import { ageDays, formatAgeVi } from "@/lib/rules/time";
import {
  evaluateTriage,
  parseCelsius,
  questionText,
  recentCelsius,
  visibleQuestions,
  type TriageResult as Result,
} from "@/lib/rules/triage";
import type { Baby } from "@/lib/supabase/rows";
import { TriageResult } from "./TriageResult";

export function TriageScreen({ baby }: { baby: Baby }) {
  const now = new Date();
  const age = ageDays(baby.dob, now);
  const logs = useRecentLogs(baby.id);
  const contacts = useEmergencyContacts(baby.family_id);
  const logged = recentCelsius(logs.data ?? [], now);
  const [celsius, setCelsius] = useState<string | null>(null);
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  // Step 1 (spec §6.6): prefilled from a temperature logged in the last 6 hours, editable.
  const temperature =
    celsius ?? (logged === null ? "" : String(logged).replace(".", ","));
  const questions = visibleQuestions(TRIAGE.questions, age);
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

  function submit() {
    const parsed = parseCelsius(temperature);
    if (parsed === "bad") {
      setError("Nhiệt độ từ 30 đến 43°C, ví dụ 38,5.");
      return;
    }
    setError(null);
    setResult(
      evaluateTriage({
        questions: TRIAGE.questions,
        checked,
        celsius: parsed,
        ageDays: age,
      }),
    );
    window.scrollTo({ top: 0 });
  }

  return (
    <main className="mx-auto flex max-w-md flex-col gap-4 p-4">
      <h1 className="text-2xl font-semibold">{TRIAGE.title}</h1>
      <p className="text-sm text-muted">{TRIAGE.disclaimer}</p>
      {!result && (
        <a
          href="tel:115"
          className="flex min-h-12 items-center justify-center rounded-2xl bg-alarm font-semibold text-on-accent"
        >
          Gọi cấp cứu 115
        </a>
      )}
      {result ? (
        <TriageResult
          result={result}
          ageDays={age}
          contacts={contacts.data ?? []}
          onRestart={() => {
            setResult(null);
            setChecked(new Set());
            setCelsius(null);
            setError(null);
            window.scrollTo({ top: 0 });
          }}
        />
      ) : (
        <>
          <section className="flex flex-col gap-2 rounded-2xl bg-soft p-4">
            <p>
              Tuổi của bé: <strong>{formatAgeVi(baby.dob, now)}</strong>
            </p>
            <label className="flex flex-col gap-1">
              Nhiệt độ gần nhất (°C, để trống nếu chưa đo)
              <input
                inputMode="decimal"
                className="min-h-11 rounded-xl border bg-surface px-3"
                value={temperature}
                onChange={(e) => setCelsius(e.target.value)}
              />
            </label>
            {logged !== null && celsius === null && (
              <p className="text-sm text-muted">
                Lấy từ nhật ký trong 6 giờ qua.
              </p>
            )}
            {error && (
              <p role="alert" className="text-danger">
                {error}
              </p>
            )}
          </section>
          <p>Đánh dấu những gì bé đang có:</p>
          {TRIAGE.groups.map((group) => {
            const list = questions.filter((q) => q.group === group.code);
            if (list.length === 0) return null;
            return (
              <fieldset key={group.code} className="flex flex-col gap-1">
                <legend className="mb-1 text-lg font-medium">
                  {group.name}
                </legend>
                {list.map((question) => (
                  <label
                    key={question.code}
                    className="flex min-h-11 items-start gap-3 py-1"
                  >
                    <input
                      type="checkbox"
                      className="mt-1 size-5 shrink-0"
                      checked={checked.has(question.code)}
                      onChange={(e) => toggle(question.code, e.target.checked)}
                    />
                    <span>
                      {questionText(question, age)}
                      {question.code === "few_wet_diapers" && logs.data && (
                        <span className="block text-sm text-muted">
                          {diapersLogged
                            ? `Nhật ký ghi ${wet} tã ướt trong 24 giờ qua.`
                            : "Nhật ký chưa ghi tã nào trong 24 giờ qua."}
                        </span>
                      )}
                    </span>
                  </label>
                ))}
              </fieldset>
            );
          })}
          <button
            type="button"
            onClick={submit}
            className="min-h-12 rounded-2xl bg-accent text-on-accent"
          >
            Xem kết quả
          </button>
          <a
            href="tel:115"
            className="flex min-h-12 items-center justify-center rounded-2xl bg-alarm font-semibold text-on-accent"
          >
            Gọi cấp cứu 115
          </a>
        </>
      )}
    </main>
  );
}
