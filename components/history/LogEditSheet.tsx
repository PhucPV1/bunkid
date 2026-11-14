"use client";

import { useState, type FormEvent } from "react";
import { QuickFields } from "@/components/form/QuickFields";
import { toVietnameseError } from "@/lib/data/errors";
import { useDeleteLog, useSaveLog } from "@/lib/data/logs";
import { medicineWarnings } from "@/lib/rules/alerts";
import { describeLog } from "@/lib/rules/describeLog";
import { isTimerType, type LogType } from "@/lib/rules/logDetails";
import {
  buildLogPatch,
  defaultLogValues,
  LOG_FIELDS,
  MANUAL_TYPES,
  valuesFromDetails,
} from "@/lib/rules/logForm";
import type { QuickValues } from "@/lib/rules/quickEntry";
import {
  formatVnTime,
  fromVnLocalInput,
  toVnLocalInput,
} from "@/lib/rules/time";
import type { LogRow } from "@/lib/supabase/rows";

const INPUT = "min-h-11 rounded-xl border px-3";

export function LogEditSheet({
  babyId,
  log,
  canModify,
  who,
  recentLogs,
  onClose,
}: {
  babyId: string;
  log: LogRow | null;
  canModify: boolean;
  who: string;
  recentLogs: LogRow[];
  onClose: () => void;
}) {
  const save = useSaveLog(babyId);
  const remove = useDeleteLog(babyId);
  const [type, setType] = useState<LogType>(
    () => (log?.type as LogType | undefined) ?? "breast",
  );
  const [values, setValues] = useState<QuickValues>(() =>
    log ? valuesFromDetails(type, log.details) : defaultLogValues(type),
  );
  const [start, setStart] = useState(() =>
    toVnLocalInput(log ? new Date(log.started_at) : new Date()),
  );
  const [end, setEnd] = useState(() => {
    if (!log) return toVnLocalInput(new Date());
    return log.ended_at ? toVnLocalInput(new Date(log.ended_at)) : "";
  });
  const [note, setNote] = useState(log?.note ?? "");
  const [message, setMessage] = useState<string | null>(null);
  const timer = isTimerType(type);
  const allowOpenEnd = log !== null && log.ended_at === null;
  const startAt = fromVnLocalInput(start);
  const warnings =
    !log &&
    type === "medicine" &&
    values.antipyretic === true &&
    !Number.isNaN(startAt.getTime())
      ? medicineWarnings({ logs: recentLogs, at: startAt })
      : [];
  const busy = save.isPending || remove.isPending;

  function submit(event: FormEvent) {
    event.preventDefault();
    const built = buildLogPatch({
      type,
      values,
      start,
      end,
      note,
      allowOpenEnd,
      now: new Date(),
    });
    if (!built.ok) {
      setMessage(built.message);
      return;
    }
    save.mutate(
      { id: log?.id ?? null, type, patch: built.patch },
      { onSuccess: onClose, onError: (e) => setMessage(toVietnameseError(e)) },
    );
  }

  function confirmDelete() {
    if (!log || !window.confirm("Xóa bản ghi này?")) return;
    remove.mutate(log.id, {
      onSuccess: onClose,
      onError: (e) => setMessage(toVietnameseError(e)),
    });
  }

  return (
    <div
      className="fixed inset-0 z-20 flex items-end bg-black/40"
      onClick={onClose}
    >
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[90dvh] w-full flex-col gap-3 overflow-y-auto rounded-t-3xl bg-surface p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))]"
      >
        <h2 className="text-xl font-semibold">
          {log ? "Bản ghi" : "Thêm bản ghi"}
        </h2>
        {log && (
          <p className="text-muted">
            {formatVnTime(new Date(log.started_at))} ·{" "}
            {describeLog(log, new Date())} · {who}
          </p>
        )}
        {log && !canModify && log.note && (
          <p className="text-muted">Ghi chú: {log.note}</p>
        )}
        {log && !canModify ? (
          <>
            <p className="rounded-xl bg-soft p-3">
              Chỉ người ghi bản ghi này hoặc chủ gia đình mới sửa hoặc xóa được.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="min-h-12 rounded-2xl border"
            >
              Đóng
            </button>
          </>
        ) : (
          <>
            {!log && (
              <label className="flex flex-col gap-1">
                Loại
                <select
                  className={INPUT}
                  value={type}
                  onChange={(e) => {
                    const next = e.target.value as LogType;
                    setType(next);
                    setValues(defaultLogValues(next));
                  }}
                >
                  {MANUAL_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <QuickFields
              fields={LOG_FIELDS[type]}
              values={values}
              onChange={setValues}
            />
            <label className="flex flex-col gap-1">
              {timer ? "Bắt đầu" : "Thời điểm"}
              <input
                type="datetime-local"
                className={INPUT}
                value={start}
                onChange={(e) => setStart(e.target.value)}
              />
            </label>
            {timer && (
              <label className="flex flex-col gap-1">
                Kết thúc
                <input
                  type="datetime-local"
                  className={INPUT}
                  value={end}
                  onChange={(e) => setEnd(e.target.value)}
                />
                {allowOpenEnd && (
                  <span className="text-sm text-muted">
                    Để trống nếu vẫn đang chạy.
                  </span>
                )}
              </label>
            )}
            <label className="flex flex-col gap-1">
              Ghi chú
              <textarea
                className="min-h-20 rounded-xl border p-3"
                value={note}
                maxLength={500}
                onChange={(e) => setNote(e.target.value)}
              />
            </label>
            {warnings.map((warning) => (
              <p
                key={warning}
                role="status"
                className="rounded-xl bg-warn-soft p-3 text-warn-ink"
              >
                {warning}
              </p>
            ))}
            {message && (
              <p role="alert" className="text-danger">
                {message}
              </p>
            )}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="min-h-12 flex-1 rounded-2xl border"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={busy}
                className="min-h-12 flex-1 rounded-2xl bg-accent text-on-accent disabled:opacity-50"
              >
                Lưu
              </button>
            </div>
            {log && (
              <button
                type="button"
                disabled={busy}
                onClick={confirmDelete}
                className="min-h-12 rounded-2xl text-danger disabled:opacity-50"
              >
                Xóa bản ghi
              </button>
            )}
          </>
        )}
      </form>
    </div>
  );
}
