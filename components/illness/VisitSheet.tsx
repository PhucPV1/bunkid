"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { OfflineNote } from "@/components/OnlineOnly";
import { FIELD_INPUT, FIELD_LABEL } from "@/components/quick/styles";
import { Button } from "@/components/ui/Button";
import { ErrorCard } from "@/components/ui/ErrorCard";
import { Icon } from "@/components/ui/Icon";
import { Sheet } from "@/components/ui/Sheet";
import { toVietnameseError } from "@/lib/data/errors";
import {
  type Visit,
  type VisitFields,
  type VisitSaved,
  useVisitActions,
  useVisits,
} from "@/lib/data/illness";
import { usePhotosUsage, usePhotoUrls } from "@/lib/data/photos";
import { useOnline } from "@/lib/hooks/useOnline";
import type { EpisodeLike } from "@/lib/rules/illness";
import { usage } from "@/lib/rules/photos";
import {
  buildVisit,
  MAX_VISIT_PHOTOS,
  photoDeletable,
  type VisitRaw,
  visitDelete,
  visitToRaw,
} from "@/lib/rules/visits";
import type { Baby } from "@/lib/supabase/rows";
import { cx } from "@/lib/ui/cx";

const DELETE_VISIT = "Xóa lần khám này và các ảnh của nó?";
const DELETE_PHOTO = "Xóa ảnh này?";

// A photo in the sheet: saved (`pending` false) or picked and not sent yet.
export type VisitPhotoTile = {
  key: string;
  src: string | undefined;
  deletable: boolean;
  pending: boolean;
};

// Spec 2026-11-26 §8.4, drawn without hooks so a test can press its buttons.
export function VisitSheetView({
  formId,
  raw,
  error,
  message,
  failed,
  photos,
  room,
  full,
  online,
  saving,
  busy,
  deletion,
  dirty,
  inputKey,
  onRaw,
  onSubmit,
  onRetry,
  onPick,
  onDeletePhoto,
  onDelete,
  onClose,
}: {
  formId: string;
  raw: VisitRaw;
  // The sentence under "Lúc khám".
  error: string | null;
  // A refusal of the server.
  message: string | null;
  // Photos the last Lưu could not send.
  failed: number;
  photos: VisitPhotoTile[];
  // Fewer than six photos.
  room: boolean;
  // The family's photo store is full (§8.2).
  full: boolean;
  online: boolean;
  // Lưu is on its way.
  saving: boolean;
  // Any change is on its way: every button waits.
  busy: boolean;
  deletion: "hidden" | "blocked" | "allowed";
  dirty: boolean;
  // A new key clears the file input after a pick.
  inputKey: number;
  onRaw: (next: VisitRaw) => void;
  onSubmit: (event: FormEvent) => void;
  onRetry: () => void;
  onPick: (file: File) => void;
  onDeletePhoto: (key: string) => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  const text = (
    label: string,
    key: "place" | "conclusion",
    maxLength: number,
  ) => (
    <label className="flex flex-col gap-1.5">
      <span className={FIELD_LABEL}>{label}</span>
      <input
        className={FIELD_INPUT}
        maxLength={maxLength}
        value={raw[key]}
        onChange={(event) => onRaw({ ...raw, [key]: event.target.value })}
      />
    </label>
  );
  return (
    <Sheet
      open
      onClose={onClose}
      title="Lần khám"
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
            disabled={busy || !online || raw.at === ""}
            className="min-h-14!"
          >
            Lưu
          </Button>
          {deletion !== "hidden" && (
            <Button
              variant="ghost"
              block
              disabled={busy || !online || deletion === "blocked"}
              className="text-danger!"
              onClick={onDelete}
            >
              Xóa lần khám
            </Button>
          )}
          {deletion === "blocked" && (
            <p className="px-1 text-[13px] text-muted">
              Còn ảnh do người khác thêm. Nhờ người đó hoặc chủ gia đình xóa
              trước.
            </p>
          )}
        </div>
      }
    >
      <form
        id={formId}
        onSubmit={onSubmit}
        className="flex flex-col gap-4 pt-1"
      >
        <p className="text-[15px] text-muted">
          Chỉ cần ngày giờ. Các ô khác điền được sau.
        </p>
        {!online && <OfflineNote />}
        {/* Hidden while a save is on its way: "Thử lại" is that save. */}
        {failed > 0 && !busy && (
          <ErrorCard
            message={`Lần khám đã lưu, còn ${failed} ảnh chưa tải được.`}
            onRetry={onRetry}
          />
        )}
        <label className="flex flex-col gap-1.5">
          <span className={FIELD_LABEL}>Lúc khám</span>
          <input
            type="datetime-local"
            className={FIELD_INPUT}
            value={raw.at}
            onChange={(event) => onRaw({ ...raw, at: event.target.value })}
          />
          {error && <span className="text-[13px] text-danger">{error}</span>}
        </label>
        {text("Nơi khám", "place", 80)}
        {text("Bác sĩ kết luận", "conclusion", 120)}
        <label className="flex flex-col gap-1.5">
          <span className={FIELD_LABEL}>Lời dặn</span>
          <textarea
            rows={3}
            maxLength={500}
            className={`${FIELD_INPUT} py-2.5`}
            value={raw.advice}
            onChange={(event) => onRaw({ ...raw, advice: event.target.value })}
          />
        </label>
        <div className="flex flex-col gap-1.5">
          <span className={FIELD_LABEL}>Ảnh đơn thuốc, giấy khám</span>
          <div className="flex flex-wrap gap-2.5 pt-1">
            {photos.map((photo) => (
              <div key={photo.key} className="relative h-[78px] w-[60px]">
                <div
                  className={cx(
                    "h-full w-full overflow-hidden rounded-[10px] bg-line",
                    // Not sent yet: a dashed outline, the same in every theme.
                    photo.pending &&
                      "outline-2 outline-offset-2 outline-muted outline-dashed",
                  )}
                >
                  {photo.src && (
                    <img
                      src={photo.src}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  )}
                </div>
                {photo.deletable && (
                  // 44 × 44 to tap, around a small round mark on the corner.
                  <button
                    type="button"
                    aria-label="Xóa ảnh"
                    disabled={busy || (!photo.pending && !online)}
                    onClick={() => onDeletePhoto(photo.key)}
                    className="absolute -top-2.5 -right-2.5 flex size-11 items-center justify-center disabled:opacity-50"
                  >
                    <span className="flex size-6 items-center justify-center rounded-full bg-danger-solid text-on-danger">
                      <Icon name="close" size={14} />
                    </span>
                  </button>
                )}
              </div>
            ))}
            {room && !full && (
              // The native file input shows English, so it hides behind
              // a Vietnamese tile.
              <label
                className={cx(
                  "flex h-[78px] w-[60px] cursor-pointer flex-col items-center justify-center gap-1 rounded-[10px] border border-dashed border-muted text-[12px] font-semibold text-accent-text has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent-text",
                  (!online || busy) && "cursor-not-allowed opacity-50",
                )}
              >
                <Icon name="plus" size={20} />
                Thêm
                <input
                  key={inputKey}
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  disabled={!online || busy}
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) onPick(file);
                  }}
                />
              </label>
            )}
          </div>
          {room && full && (
            <p className="px-1 text-[13px] text-muted">
              Kho ảnh đã đầy. Xóa bớt ảnh ở trang Ảnh để thêm ảnh mới.
            </p>
          )}
        </div>
      </form>
    </Sheet>
  );
}

type Pending = { key: string; file: File; url: string };

// The sheet as it was opened, or as it was last saved: the visit's id (null
// until a new visit is saved), its stored fields, the form and its time.
type Base = {
  id: string | null;
  stored: VisitFields | null;
  raw: VisitRaw;
  at: string;
};

export function VisitSheet({
  baby,
  userId,
  isOwner,
  episode,
  visit,
  onClose,
}: {
  baby: Pick<Baby, "id" | "family_id">;
  userId: string;
  isOwner: boolean;
  episode: EpisodeLike;
  // null: a new visit.
  visit: Visit | null;
  onClose: () => void;
}) {
  const actions = useVisitActions(baby.id, baby.family_id);
  const visits = useVisits(baby.id);
  const used = usePhotosUsage(baby.family_id);
  const online = useOnline();
  const formId = useId();
  const [base, setBase] = useState<Base>(() => {
    const now = new Date();
    return {
      id: visit?.id ?? null,
      stored: visit,
      raw: visitToRaw(visit, now),
      at: visit?.visited_at ?? now.toISOString(),
    };
  });
  const [raw, setRaw] = useState(base.raw);
  const [pending, setPending] = useState<Pending[]>([]);
  // The picked photos the last Lưu could not send.
  const [failed, setFailed] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [inputKey, setInputKey] = useState(0);
  const made = useRef<string[]>([]);
  useEffect(() => {
    const urls = made.current;
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, []);

  // The visit as the server has it now: its photos change as they are
  // deleted, and a new visit has some once its first save is done.
  const current =
    visits.data?.find((item) => item.id === base.id) ??
    (visit && visit.id === base.id ? visit : null);
  const saved = current?.photos ?? [];
  const urls = usePhotoUrls(saved.map((photo) => photo.storage_path));
  const viewer = { userId, isOwner };
  const onError = (cause: unknown) => setMessage(toVietnameseError(cause));

  const saving = actions.add.isPending || actions.update.isPending;
  const busy =
    saving || actions.remove.isPending || actions.removePhoto.isPending;

  // Lưu and "Thử lại" both end here; neither may start a second save, nor
  // one offline or without a time (the button is off then too).
  function save() {
    if (busy || !online || raw.at === "") return;
    setMessage(null);
    const built = buildVisit({
      episode,
      stored: base.stored,
      opened: base.raw,
      openedAt: base.at,
      raw,
      now: new Date(),
    });
    if (!built.ok) {
      setError(built.error);
      return;
    }
    setError(null);
    const files = pending.map((item) => item.file);
    // Spec §8.4: photos that did not go up stay in the sheet, which now
    // edits the saved visit; the next Lưu only sends them.
    const onSuccess = (result: VisitSaved) => {
      if (result.failed.length === 0) {
        onClose();
        return;
      }
      setBase({
        id: result.id,
        stored: built.fields,
        raw,
        at: built.fields.visited_at,
      });
      const left = pending.filter((item) => result.failed.includes(item.file));
      setPending(left);
      setFailed(left.map((item) => item.key));
    };
    if (base.id === null)
      actions.add.mutate(
        { episodeId: episode.id, fields: built.fields, files },
        { onSuccess, onError },
      );
    else if (built.patch === null && files.length === 0) onClose();
    else
      actions.update.mutate(
        {
          id: base.id,
          patch: built.patch,
          visitedAt: built.fields.visited_at,
          files,
        },
        { onSuccess, onError },
      );
  }

  function pick(file: File) {
    const url = URL.createObjectURL(file);
    made.current.push(url);
    setPending((list) => [...list, { key: crypto.randomUUID(), file, url }]);
    setInputKey((key) => key + 1);
  }

  // A photo not sent yet just leaves the sheet; a saved one is deleted now,
  // without waiting for Lưu (§8.4).
  function deletePhoto(key: string) {
    const picked = pending.find((item) => item.key === key);
    if (picked) {
      URL.revokeObjectURL(picked.url);
      setPending((list) => list.filter((item) => item.key !== key));
      return;
    }
    const photo = saved.find((item) => item.id === key);
    if (photo && window.confirm(DELETE_PHOTO))
      actions.removePhoto.mutate(photo, { onError });
  }

  function remove() {
    if (current && window.confirm(DELETE_VISIT))
      actions.remove.mutate(current, { onSuccess: onClose, onError });
  }

  return (
    <VisitSheetView
      formId={formId}
      raw={raw}
      error={error}
      message={message}
      failed={pending.filter((item) => failed.includes(item.key)).length}
      photos={[
        ...saved.map((photo) => ({
          key: photo.id,
          src: urls.data?.[photo.storage_path],
          deletable: photoDeletable(photo, viewer),
          pending: false,
        })),
        ...pending.map((item) => ({
          key: item.key,
          src: item.url,
          deletable: true,
          pending: true,
        })),
      ]}
      room={saved.length + pending.length < MAX_VISIT_PHOTOS}
      full={usage(used.data ?? 0).level === "full"}
      online={online}
      saving={saving}
      busy={busy}
      deletion={current ? visitDelete(current, viewer) : "hidden"}
      dirty={
        pending.length > 0 ||
        (Object.keys(raw) as (keyof VisitRaw)[]).some(
          (key) => raw[key] !== base.raw[key],
        )
      }
      inputKey={inputKey}
      onRaw={setRaw}
      onSubmit={(event) => {
        event.preventDefault();
        save();
      }}
      onRetry={save}
      onPick={pick}
      onDeletePhoto={deletePhoto}
      onDelete={remove}
      onClose={onClose}
    />
  );
}
