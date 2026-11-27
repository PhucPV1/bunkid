"use client";

import { useId, useState, type FormEvent } from "react";
import { FIELD_INPUT, FIELD_LABEL } from "@/components/quick/styles";
import { Button } from "@/components/ui/Button";
import { Sheet } from "@/components/ui/Sheet";
import { toVietnameseError } from "@/lib/data/errors";
import { useEpisodeActions } from "@/lib/data/illness";
import { canReopen, type EpisodeErrors } from "@/lib/rules/illness";
import {
  buildEpisodePatch,
  type EpisodeRaw,
  episodeToRaw,
  planReopen,
} from "@/lib/rules/illnessForm";
import type { EpisodeRow } from "@/lib/supabase/rows";

const DELETE_QUESTION =
  "Xóa đợt ốm này? Các bản ghi nhiệt độ, thuốc, triệu chứng vẫn giữ nguyên.";

// Spec 2026-11-26 §6.4, drawn without hooks so a test can press its buttons.
export function EpisodeSheetView({
  formId,
  raw,
  errors,
  message,
  dirty,
  saving,
  busy,
  canReopen: reopen,
  canDelete,
  deleteBlock,
  onRaw,
  onSubmit,
  onReopen,
  onDelete,
  onClose,
}: {
  formId: string;
  raw: EpisodeRaw;
  errors: EpisodeErrors;
  // A refusal that belongs to no field (the server's, or of "Mở lại đợt ốm").
  message: string | null;
  dirty: boolean;
  // Lưu is on its way.
  saving: boolean;
  // Any change is on its way: every button waits.
  busy: boolean;
  canReopen: boolean;
  canDelete: boolean;
  // Why "Xóa đợt ốm" is off (spec §6.4 from M5), or null.
  deleteBlock: string | null;
  onRaw: (next: EpisodeRaw) => void;
  onSubmit: (event: FormEvent) => void;
  onReopen: () => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  const field = (
    label: string,
    value: string,
    setValue: (next: string) => void,
    error: string | undefined,
  ) => (
    <label className="flex flex-col gap-1.5">
      <span className={FIELD_LABEL}>{label}</span>
      <input
        type="datetime-local"
        className={FIELD_INPUT}
        value={value}
        onChange={(event) => setValue(event.target.value)}
      />
      {error && <span className="text-[13px] text-danger">{error}</span>}
    </label>
  );
  return (
    <Sheet
      open
      onClose={onClose}
      title="Sửa đợt ốm"
      dirty={dirty}
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
            busy={saving}
            disabled={busy}
            className="min-h-14!"
          >
            Lưu
          </Button>
          {reopen && (
            <Button
              variant="secondary"
              block
              disabled={busy}
              onClick={onReopen}
            >
              Mở lại đợt ốm
            </Button>
          )}
          {canDelete && (
            <Button
              variant="ghost"
              block
              disabled={busy || deleteBlock !== null}
              className="text-danger!"
              onClick={onDelete}
            >
              Xóa đợt ốm
            </Button>
          )}
          {canDelete && deleteBlock && (
            <p className="px-1 text-[13px] text-muted">{deleteBlock}</p>
          )}
        </div>
      }
    >
      <form
        id={formId}
        onSubmit={onSubmit}
        className="flex flex-col gap-4 pt-1"
      >
        {field(
          "Bắt đầu",
          raw.start,
          (start) => onRaw({ ...raw, start }),
          errors.started_at,
        )}
        {raw.end !== null &&
          field(
            "Kết thúc",
            raw.end,
            (end) => onRaw({ ...raw, end }),
            errors.ended_at,
          )}
      </form>
    </Sheet>
  );
}

export function EpisodeSheet({
  babyId,
  userId,
  episode,
  episodes,
  canDelete,
  deleteBlock,
  onClose,
  onDeleted,
}: {
  babyId: string;
  userId: string;
  episode: EpisodeRow;
  // Every episode of the baby, for the overlap check and for "Mở lại đợt ốm".
  episodes: EpisodeRow[];
  // The owner of the family or whoever started the episode.
  canDelete: boolean;
  // Why "Xóa đợt ốm" is off: the episode has visits, or they are not loaded.
  deleteBlock: string | null;
  onClose: () => void;
  // The episode is gone: its page has nothing left to show.
  onDeleted: () => void;
}) {
  const actions = useEpisodeActions(babyId, userId);
  const formId = useId();
  const [opened] = useState(() => episodeToRaw(episode));
  const [raw, setRaw] = useState(opened);
  const [errors, setErrors] = useState<EpisodeErrors>({});
  const [message, setMessage] = useState<string | null>(null);
  const onError = (error: unknown) => setMessage(toVietnameseError(error));

  function submit(event: FormEvent) {
    event.preventDefault();
    setMessage(null);
    const built = buildEpisodePatch({
      episode,
      opened,
      raw,
      episodes,
      now: new Date(),
    });
    if (!built.ok) {
      setErrors(built.errors);
      return;
    }
    setErrors({});
    if (built.patch === null) onClose();
    else
      actions.update.mutate(
        { id: episode.id, patch: built.patch },
        { onSuccess: onClose, onError },
      );
  }

  // A toast would sit under the sheet's backdrop, so a refusal shows here.
  function reopen() {
    const plan = planReopen(episode, episodes, new Date());
    if (!plan.ok) {
      setMessage(plan.message);
      return;
    }
    actions.update.mutate(
      { id: episode.id, patch: plan.patch },
      { onSuccess: onClose, onError },
    );
  }

  function remove() {
    if (window.confirm(DELETE_QUESTION))
      actions.remove.mutate(episode.id, { onSuccess: onDeleted, onError });
  }

  return (
    <EpisodeSheetView
      formId={formId}
      raw={raw}
      errors={errors}
      message={message}
      dirty={raw.start !== opened.start || raw.end !== opened.end}
      saving={actions.update.isPending}
      busy={actions.update.isPending || actions.remove.isPending}
      canReopen={canReopen(episode, episodes)}
      canDelete={canDelete}
      deleteBlock={deleteBlock}
      onRaw={setRaw}
      onSubmit={submit}
      onReopen={reopen}
      onDelete={remove}
      onClose={onClose}
    />
  );
}
