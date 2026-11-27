"use client";

import type { Ref } from "react";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Sheet } from "@/components/ui/Sheet";
import { TRIAGE } from "@/lib/content/triage";
import { formatDayShort } from "@/lib/rules/days";
import type { StripDay, SymptomDay } from "@/lib/rules/symptomDay";
import { parseCodes, symptomShorts } from "@/lib/rules/symptomForm";
import { CATEGORIES } from "@/lib/ui/categories";
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
