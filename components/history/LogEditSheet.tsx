"use client";

import { useId, useState, type FormEvent } from "react";
import { FieldList } from "@/components/quick/FieldList";
import { FIELD_INPUT, FIELD_LABEL } from "@/components/quick/styles";
import { Button } from "@/components/ui/Button";
import { Sheet } from "@/components/ui/Sheet";
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
import { categoryOf } from "@/lib/ui/categories";

export function LogEditSheet({
  babyId,
  userId,
  log,
  canModify,
  who,
  recentLogs,
  onClose,
}: {
  babyId: string;
  userId: string;
  log: LogRow | null;
  canModify: boolean;
  who: string;
  recentLogs: LogRow[];
  onClose: () => void;
}) {
  const save = useSaveLog(babyId, userId);
  const remove = useDeleteLog(babyId, userId);
  const formId = useId();
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
  // What the form held when it opened, to tell whether the user has changed anything.
  const [opened] = useState(() =>
    JSON.stringify({ type, values, start, end, note }),
  );

  const readOnly = log !== null && !canModify;
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
  const dirty =
    !readOnly && JSON.stringify({ type, values, start, end, note }) !== opened;
  const category = categoryOf(type);

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
      {
        onSuccess: onClose,
        onError: (error) => setMessage(toVietnameseError(error)),
      },
    );
  }

  function confirmDelete() {
    if (!log || !window.confirm("Xóa bản ghi này?")) return;
    remove.mutate(log.id, {
      onSuccess: onClose,
      onError: (error) => setMessage(toVietnameseError(error)),
    });
  }

  const dateField = (
    label: string,
    value: string,
    setValue: (next: string) => void,
    hint?: string,
  ) => (
    <label className="flex flex-col gap-1.5">
      <span className={FIELD_LABEL}>{label}</span>
      <input
        type="datetime-local"
        className={FIELD_INPUT}
        value={value}
        onChange={(event) => setValue(event.target.value)}
      />
      {hint && <span className="text-[13px] text-muted">{hint}</span>}
    </label>
  );

  return (
    <Sheet
      open
      onClose={onClose}
      title={log ? "Bản ghi" : "Thêm bản ghi"}
      icon={category.icon}
      iconColor={category.token}
      dirty={dirty}
      footer={
        readOnly ? undefined : (
          <div className="flex flex-col gap-2">
            {message && (
              <p role="alert" className="text-[15px] text-danger">
                {message}
              </p>
            )}
            <Button
              type="submit"
              form={formId}
              block
              busy={save.isPending}
              disabled={remove.isPending}
              className="min-h-14!"
            >
              Lưu
            </Button>
            {log && (
              <Button
                variant="ghost"
                block
                disabled={busy}
                onClick={confirmDelete}
                className="text-danger!"
              >
                Xóa bản ghi
              </Button>
            )}
          </div>
        )
      }
    >
      <form id={formId} onSubmit={submit} className="flex flex-col gap-4 pt-1">
        {log && (
          <p className="text-[15px] text-muted tabular-nums">
            {formatVnTime(new Date(log.started_at))} ·{" "}
            {describeLog(log, new Date())} · {who}
          </p>
        )}
        {readOnly ? (
          <>
            {log?.note && (
              <p className="text-[15px] text-muted">Ghi chú: {log.note}</p>
            )}
            <p className="rounded-[16px] bg-muted/15 p-3 text-[15px] text-ink">
              Chỉ người ghi bản ghi này hoặc chủ gia đình mới sửa hoặc xóa được.
            </p>
          </>
        ) : (
          <>
            {!log && (
              <label className="flex flex-col gap-1.5">
                <span className={FIELD_LABEL}>Loại</span>
                <select
                  className={`${FIELD_INPUT} accent-accent`}
                  value={type}
                  onChange={(event) => {
                    const next = event.target.value as LogType;
                    setType(next);
                    setValues(defaultLogValues(next));
                  }}
                >
                  {MANUAL_TYPES.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <FieldList
              fields={LOG_FIELDS[type]}
              values={values}
              onChange={setValues}
            />
            {dateField(timer ? "Bắt đầu" : "Thời điểm", start, setStart)}
            {timer &&
              dateField(
                "Kết thúc",
                end,
                setEnd,
                allowOpenEnd ? "Để trống nếu vẫn đang chạy." : undefined,
              )}
            <label className="flex flex-col gap-1.5">
              <span className={FIELD_LABEL}>Ghi chú</span>
              <textarea
                className={`${FIELD_INPUT} min-h-20 py-2.5`}
                value={note}
                maxLength={500}
                onChange={(event) => setNote(event.target.value)}
              />
            </label>
            {warnings.map((warning) => (
              <p
                key={warning}
                role="status"
                className="rounded-[16px] bg-warn-soft p-3 text-[15px] text-warn-ink"
              >
                {warning}
              </p>
            ))}
          </>
        )}
      </form>
    </Sheet>
  );
}
