"use client";

import { type Ref, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Sheet } from "@/components/ui/Sheet";
import { useToast } from "@/components/ui/Toast";
import { TRIAGE } from "@/lib/content/triage";
import { toVietnameseError } from "@/lib/data/errors";
import { useEpisodes } from "@/lib/data/illness";
import { useDeleteLog, useRangeLogs, useSaveLog } from "@/lib/data/logs";
import { addDays, formatDayShort, startOfDayIso } from "@/lib/rules/days";
import {
  canDeleteDay,
  dayStrip,
  type StripDay,
  symptomDay,
  type SymptomDay,
  symptomDayDelete,
  symptomDaySave,
  type SymptomOp,
} from "@/lib/rules/symptomDay";
import { parseCodes, symptomShorts } from "@/lib/rules/symptomForm";
import { ageDays, vnDateString } from "@/lib/rules/time";
import type { Baby } from "@/lib/supabase/rows";
import { CATEGORIES } from "@/lib/ui/categories";
import { keepPickedInView } from "@/lib/ui/scrollRow";
import { cx } from "@/lib/ui/cx";
import { FIELD_INPUT, FIELD_LABEL } from "./styles";
import { SymptomPicker } from "./SymptomPicker";

const CELL =
  "flex min-h-16 w-16 shrink-0 flex-col items-center justify-center gap-0.5 rounded-[18px] text-center";

// Spec 2026-11-27 §4.3: the day strip of the symptom sheet. `other` is a day
// picked with "Khác" that is not in the strip. The cells stay in time order
// (oldest, …, today, Khác), so a screen reader reads them that way; the sheet
// scrolls the row to its end through `scrollRef` once its dialog is open.
export function DayStrip({
  label,
  days,
  selected,
  marked,
  other,
  min,
  max,
  onPick,
  scrollRef,
}: {
  label: string;
  days: StripDay[];
  selected: string;
  // Days that already have a symptom log.
  marked: readonly string[];
  other: string | null;
  min: string;
  max: string;
  onPick: (day: string) => void;
  scrollRef?: Ref<HTMLDivElement>;
}) {
  return (
    <div className="flex flex-col gap-2">
      <span className={FIELD_LABEL}>{label}</span>
      <div
        ref={scrollRef}
        role="group"
        aria-label="Ngày nào?"
        className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none]"
      >
        {days.map((cell) => {
          const on = cell.day === selected && other === null;
          return (
            <button
              key={cell.day}
              type="button"
              aria-pressed={on}
              onClick={() => onPick(cell.day)}
              className={cx(
                CELL,
                on ? "bg-accent text-on-accent" : "glass text-ink",
              )}
            >
              <span className="text-[15px] leading-5 font-bold">
                {cell.top}
              </span>
              <span className={cx("text-xs leading-4", !on && "text-muted")}>
                {cell.bottom}
              </span>
              {marked.includes(cell.day) && (
                <>
                  <span
                    aria-hidden="true"
                    className={cx(
                      "size-1.5 rounded-full",
                      on ? "bg-on-accent" : "bg-accent",
                    )}
                  />
                  <span className="sr-only">, đã ghi</span>
                </>
              )}
            </button>
          );
        })}
        <label
          className={cx(
            CELL,
            "relative",
            other ? "bg-accent text-on-accent" : "glass text-ink",
          )}
        >
          <Icon name="calendar" size={20} />
          <span className={cx("text-xs leading-4", !other && "text-muted")}>
            {other ? formatDayShort(other) : "Khác"}
          </span>
          <input
            type="date"
            aria-label="Chọn ngày khác"
            min={min}
            max={max}
            className="absolute inset-0 opacity-0"
            value={other ?? ""}
            onChange={(event) => {
              if (event.target.value) onPick(event.target.value);
            }}
          />
        </label>
      </div>
    </div>
  );
}

export type SheetStatus = "loading" | "error" | "ready";

// Spec 2026-11-27 §4.2 and §5: the symptom sheet of one day, drawn without
// hooks. `strip` is null for a fixed day; `picked` is every chip switched on
// (comma-joined, locked ones included).
export function SymptomDaySheetView({
  title,
  sub,
  strip,
  status,
  day,
  picked,
  note,
  ageDays,
  dirty,
  saving,
  message,
  deletable,
  onPicked,
  onNote,
  onSave,
  onDelete,
  onClose,
}: {
  title: string;
  sub: string | null;
  strip: Parameters<typeof DayStrip>[0] | null;
  status: SheetStatus;
  day: SymptomDay;
  picked: string;
  note: string;
  ageDays: number | null;
  dirty: boolean;
  saving: boolean;
  message: string | null;
  deletable: boolean;
  onPicked: (next: string) => void;
  onNote: (next: string) => void;
  onSave: () => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  const ready = status === "ready";
  const codes = parseCodes(picked);
  const ownCodes = codes.filter((code) => !day.locked.includes(code));
  const logged = symptomShorts(day.codes, TRIAGE.symptoms);

  return (
    <Sheet
      open
      onClose={onClose}
      title={title}
      icon={CATEGORIES.symptom.icon}
      iconColor={CATEGORIES.symptom.token}
      dirty={dirty}
      footer={
        <div className="flex flex-col gap-2">
          {message && (
            <p role="alert" className="text-[15px] text-danger">
              {message}
            </p>
          )}
          <Button
            block
            busy={saving}
            disabled={!ready || codes.length === 0}
            onClick={onSave}
            className="min-h-14!"
          >
            Lưu
          </Button>
          {deletable && (
            <button
              type="button"
              disabled={saving}
              onClick={onDelete}
              className="min-h-11 w-full rounded-full text-[15px] font-semibold text-danger disabled:opacity-50"
            >
              Xóa triệu chứng ngày này
            </button>
          )}
        </div>
      }
    >
      <div className="flex flex-col gap-5 pt-1">
        {sub && <p className="-mt-2 text-[15px] text-muted">{sub}</p>}
        {strip && <DayStrip {...strip} />}
        {status === "loading" ? (
          <p className="text-[15px] text-muted">Đang tải…</p>
        ) : status === "error" ? (
          <p role="alert" className="text-[15px] text-danger">
            Không tải được triệu chứng đã ghi
          </p>
        ) : logged.length > 0 ? (
          <p className="rounded-[16px] bg-accent-tint px-3 py-2.5 text-[15px] font-medium text-accent-text">
            {`Ngày này đã ghi ${logged.join(", ")}. Bấm để thêm hoặc bỏ rồi Lưu.`}
          </p>
        ) : (
          <p className="text-[15px] text-muted">
            Bấm những gì bé có trong ngày.
          </p>
        )}
        {ready && (
          <>
            <div className="flex flex-col gap-2">
              <SymptomPicker
                value={picked}
                onChange={onPicked}
                ageDays={ageDays}
                locked={day.locked}
              />
              {day.locked.length > 0 && (
                <p className="text-[13px] leading-[18px] text-muted">
                  Chip mờ do người khác ghi, chỉ họ hoặc chủ gia đình bỏ được.
                </p>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="flex flex-col gap-1.5">
                <span className={FIELD_LABEL}>Ghi chú (không bắt buộc)</span>
                <textarea
                  rows={3}
                  maxLength={200}
                  disabled={ownCodes.length === 0}
                  className={`${FIELD_INPUT} py-2.5 disabled:opacity-50`}
                  value={note}
                  onChange={(event) => onNote(event.target.value)}
                />
              </label>
              {ownCodes.length === 0 && (
                <p className="text-[13px] leading-[18px] text-muted">
                  Bật ít nhất một triệu chứng để ghi chú.
                </p>
              )}
              {day.otherNotes.length > 0 && (
                <p className="text-[13px] leading-[18px] text-muted">
                  {`Người khác ghi: ${day.otherNotes.join(" · ")}`}
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </Sheet>
  );
}

// Spec 2026-11-27 §4 and §5: the symptom sheet with its data. Without `day`
// it opens on today with the day strip (the open episode's days, else the
// last 7); with `day` that day is fixed and `sub` is the line under the title.
// `canModify` says whether the viewer may change a log made by someone
// (canModifyLog).
export function SymptomDaySheet({
  baby,
  userId,
  canModify,
  day: fixedDay = null,
  sub = null,
  onClose,
}: {
  baby: Baby;
  userId: string;
  canModify: (createdBy: string) => boolean;
  day?: string | null;
  sub?: string | null;
  onClose: () => void;
}) {
  const toast = useToast();
  const save = useSaveLog(baby.id, userId);
  const remove = useDeleteLog(baby.id, userId);
  const [openedAt] = useState(() => new Date());
  const today = vnDateString(openedAt);
  const episodes = useEpisodes(baby.id);
  const open = episodes.data?.find((item) => item.ended_at === null) ?? null;
  const strip =
    fixedDay === null
      ? dayStrip({ episode: open, today, dob: baby.dob })
      : null;
  const [chosen, setChosen] = useState(today);
  const day = fixedDay ?? chosen;
  const inStrip = strip?.days.some((cell) => cell.day === day) ?? false;
  const stripLogs = useRangeLogs(
    baby.id,
    startOfDayIso(strip?.days[0]?.day ?? today),
    null,
    strip !== null,
  );
  const dayLogs = useRangeLogs(
    baby.id,
    startOfDayIso(day),
    startOfDayIso(addDays(day, 1)),
    !inStrip,
  );
  const source = inStrip ? stripLogs : dayLogs;
  // The strip is drawn inside the sheet's <dialog>, which is display:none
  // until Sheet's effect has called showModal(). These effects run after it
  // (a parent's effects run after its children's), so the row has a width.
  // The strip opens scrolled to its end, where today and "Khác" are, and
  // again when it gains cells (the episode list arrived); a picked cell is
  // then kept in view. Only the row moves (keepPickedInView), never the
  // dialog, which is still sliding in.
  const scrollRef = useRef<HTMLDivElement>(null);
  const cellCount = strip?.days.length ?? 0;
  useEffect(() => {
    const row = scrollRef.current;
    if (row) row.scrollLeft = row.scrollWidth;
    keepPickedInView(row);
  }, [cellCount]);
  useEffect(() => keepPickedInView(scrollRef.current), [day]);
  const rows = source.data ?? [];
  const status: SheetStatus = source.data
    ? "ready"
    : source.isError
      ? "error"
      : "loading";
  const current = symptomDay(rows, day, canModify);
  // What the parent changed on this day; dropped when another day is picked.
  const [edit, setEdit] = useState<{
    day: string;
    picked: string;
    note: string;
  } | null>(null);
  const shown =
    edit && edit.day === day
      ? edit
      : { day, picked: current.codes.join(","), note: current.ownNote };
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function run(ops: SymptomOp[]) {
    for (const op of ops) {
      if (op.op === "delete") await remove.mutateAsync(op.id);
      else
        await save.mutateAsync({
          id: op.op === "update" ? op.id : null,
          type: "symptom",
          patch: op.patch,
        });
    }
  }

  async function perform(ops: SymptomOp[], done: string) {
    setBusy(true);
    setMessage(null);
    try {
      await run(ops);
      toast(done);
      onClose();
    } catch (error) {
      setMessage(toVietnameseError(error));
    } finally {
      setBusy(false);
    }
  }

  function onSave() {
    // One clock for the whole save: a sheet opened at 23:59 and saved after
    // midnight stores its day (then yesterday) at 12:00, not at "now".
    const saveNow = new Date();
    const result = symptomDaySave({
      day: current,
      picked: parseCodes(shown.picked),
      note: shown.note,
      today: vnDateString(saveNow),
      now: saveNow,
    });
    if (!result.ok) {
      setMessage(result.message);
      return;
    }
    if (result.ops.length === 0) {
      onClose();
      return;
    }
    // Also from the clock of the save, not the day the sheet was opened.
    const label =
      day === vnDateString(saveNow) ? "hôm nay" : formatDayShort(day);
    void perform(result.ops, `Đã lưu triệu chứng ${label}`);
  }

  function onDelete() {
    const date = formatDayShort(day);
    if (!window.confirm(`Xóa triệu chứng ngày ${date}?`)) return;
    void perform(symptomDayDelete(current), `Đã xóa triệu chứng ${date}`);
  }

  return (
    <SymptomDaySheetView
      title={
        fixedDay === null
          ? "Triệu chứng"
          : `Triệu chứng · ${formatDayShort(fixedDay)}`
      }
      sub={fixedDay === null ? null : sub}
      strip={
        strip && {
          label: strip.label,
          days: strip.days,
          selected: day,
          // From the strip's own logs, also while "Khác" shows another day.
          marked: strip.days
            .filter(
              (cell) =>
                symptomDay(stripLogs.data ?? [], cell.day, () => true).logs
                  .length > 0,
            )
            .map((cell) => cell.day),
          scrollRef,
          other: inStrip ? null : day,
          min: baby.dob,
          max: today,
          onPick: (next) => {
            setChosen(next);
            setEdit(null);
            setMessage(null);
          },
        }
      }
      status={status}
      day={current}
      picked={shown.picked}
      note={shown.note}
      ageDays={ageDays(baby.dob, openedAt)}
      dirty={edit !== null}
      saving={busy}
      message={message}
      deletable={
        fixedDay !== null && status === "ready" && canDeleteDay(current)
      }
      onPicked={(picked) => setEdit({ ...shown, picked })}
      onNote={(note) => setEdit({ ...shown, note })}
      onSave={onSave}
      onDelete={onDelete}
      onClose={onClose}
    />
  );
}
