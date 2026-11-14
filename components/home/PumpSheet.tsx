"use client";

import { useState, type FormEvent } from "react";
import { toVietnameseError } from "@/lib/data/errors";
import { useSetPumpAmounts } from "@/lib/data/logs";
import { parsePumpAmounts } from "@/lib/rules/pumpForm";

export function PumpSheet({
  logId,
  babyId,
  userId,
  onClose,
}: {
  logId: string;
  babyId: string;
  userId: string;
  onClose: () => void;
}) {
  const save = useSetPumpAmounts(babyId, userId);
  const [left, setLeft] = useState("");
  const [right, setRight] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  function submit(event: FormEvent) {
    event.preventDefault();
    const parsed = parsePumpAmounts({ left, right });
    if (!parsed.ok) {
      setMessage(parsed.message);
      return;
    }
    save.mutate(
      { id: logId, details: parsed.details },
      { onSuccess: onClose, onError: (e) => setMessage(toVietnameseError(e)) },
    );
  }

  const input = "min-h-11 rounded-xl border px-3";
  return (
    <div
      className="fixed inset-0 z-20 flex items-end bg-black/40"
      onClick={onClose}
    >
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="flex w-full flex-col gap-3 rounded-t-3xl bg-surface p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))]"
      >
        <h2 className="text-xl font-semibold">Đã hút được bao nhiêu?</h2>
        <div className="flex gap-3">
          <label className="flex flex-1 flex-col gap-1">
            Bên trái (ml)
            <input
              inputMode="numeric"
              className={input}
              value={left}
              onChange={(e) => setLeft(e.target.value)}
            />
          </label>
          <label className="flex flex-1 flex-col gap-1">
            Bên phải (ml)
            <input
              inputMode="numeric"
              className={input}
              value={right}
              onChange={(e) => setRight(e.target.value)}
            />
          </label>
        </div>
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
            Bỏ qua
          </button>
          <button
            type="submit"
            disabled={save.isPending}
            className="min-h-12 flex-1 rounded-2xl bg-accent text-on-accent disabled:opacity-50"
          >
            Lưu
          </button>
        </div>
      </form>
    </div>
  );
}
