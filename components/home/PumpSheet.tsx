"use client";

import { useId, useState, type FormEvent } from "react";
import { FIELD_INPUT, FIELD_LABEL } from "@/components/quick/styles";
import { Button } from "@/components/ui/Button";
import { Sheet } from "@/components/ui/Sheet";
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
  const formId = useId();
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
      {
        onSuccess: onClose,
        onError: (error) => setMessage(toVietnameseError(error)),
      },
    );
  }

  const field = (
    label: string,
    value: string,
    setValue: (next: string) => void,
  ) => (
    <label className="flex flex-col gap-1.5">
      <span className={FIELD_LABEL}>{label}</span>
      <input
        inputMode="numeric"
        className={`${FIELD_INPUT} tabular-nums`}
        value={value}
        onChange={(event) => setValue(event.target.value)}
      />
    </label>
  );

  return (
    <Sheet
      open
      onClose={onClose}
      title="Đã hút được bao nhiêu?"
      icon="cup"
      iconColor="cat-pump"
      dirty={left !== "" || right !== ""}
      footer={
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
            className="min-h-14!"
          >
            Lưu
          </Button>
          <Button variant="ghost" block onClick={onClose}>
            Bỏ qua
          </Button>
        </div>
      }
    >
      <form
        id={formId}
        onSubmit={submit}
        className="grid grid-cols-2 gap-3 pt-1"
      >
        {field("Bên trái (ml)", left, setLeft)}
        {field("Bên phải (ml)", right, setRight)}
      </form>
    </Sheet>
  );
}
