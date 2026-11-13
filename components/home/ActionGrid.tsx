"use client";

import type { InstantType } from "@/lib/rules/quickEntry";
import type { RunningLog, TimerButton } from "@/lib/rules/timer";

const TIMERS: { label: string; button: TimerButton }[] = [
  { label: "Bú trái", button: { type: "breast", side: "left" } },
  { label: "Bú phải", button: { type: "breast", side: "right" } },
  { label: "Ngủ", button: { type: "sleep" } },
];

const INSTANTS: { label: string; type: InstantType }[] = [
  { label: "Bình", type: "bottle" },
  { label: "Tã", type: "diaper" },
  { label: "Thuốc", type: "medicine" },
  { label: "Nhiệt độ", type: "temperature" },
];

function isActive(running: RunningLog[], button: TimerButton): boolean {
  return running.some(
    (r) =>
      r.type === button.type &&
      (button.type !== "breast" || r.details.side === button.side),
  );
}

export function ActionGrid({
  running,
  busy,
  onTimer,
  onInstant,
}: {
  running: RunningLog[];
  busy: boolean;
  onTimer: (button: TimerButton) => void;
  onInstant: (type: InstantType) => void;
}) {
  const base = "min-h-16 rounded-2xl text-lg font-medium disabled:opacity-50";
  return (
    <section className="grid grid-cols-3 gap-3">
      {TIMERS.map(({ label, button }) => {
        const active = isActive(running, button);
        return (
          <button
            key={label}
            type="button"
            disabled={busy}
            onClick={() => onTimer(button)}
            className={`${base} ${active ? "bg-pink-500 text-white" : "bg-pink-50 text-pink-900"}`}
          >
            {active ? `Dừng ${label.toLowerCase()}` : label}
          </button>
        );
      })}
      {INSTANTS.map(({ label, type }) => (
        <button
          key={type}
          type="button"
          onClick={() => onInstant(type)}
          className={`${base} bg-neutral-100`}
        >
          {label}
        </button>
      ))}
    </section>
  );
}
