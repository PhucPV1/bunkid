"use client";

import { useId, useState, type FormEvent } from "react";
import { FIELD_INPUT, FIELD_LABEL } from "@/components/quick/styles";
import { Button } from "@/components/ui/Button";
import { Sheet } from "@/components/ui/Sheet";
import { toVietnameseError } from "@/lib/data/errors";
import { useMilestoneActions } from "@/lib/data/milestones";
import { usePhotos, usePhotoUrls } from "@/lib/data/photos";
import { parseMilestoneForm } from "@/lib/rules/milestones";
import { vnDateString } from "@/lib/rules/time";
import type { Baby, MilestoneRow } from "@/lib/supabase/rows";
import { cx } from "@/lib/ui/cx";

export function MilestoneSheet({
  code,
  title,
  row,
  baby,
  userId,
  onClose,
}: {
  code: string;
  title: string;
  row: MilestoneRow | null;
  baby: Baby;
  userId: string;
  onClose: () => void;
}) {
  const actions = useMilestoneActions(baby.id, userId);
  const formId = useId();
  const today = vnDateString(new Date());
  const photos = usePhotos(baby.id);
  // Recent photos first; the milestone keeps at most one (spec gốc §6.9).
  const choices = (photos.data ?? []).slice(0, 12);
  const urls = usePhotoUrls(choices.map((p) => p.storage_path));
  const [achievedOn, setAchievedOn] = useState(row?.achieved_on ?? today);
  const [note, setNote] = useState(row?.note ?? "");
  const [photoId, setPhotoId] = useState<string | null>(row?.photo_id ?? null);
  const [opened] = useState(() =>
    JSON.stringify({ achievedOn, note, photoId }),
  );
  const [message, setMessage] = useState<string | null>(null);
  const saving = actions.mark.isPending;
  const unmarking = actions.unmark.isPending;
  const done = {
    onSuccess: onClose,
    onError: (error: unknown) => setMessage(toVietnameseError(error)),
  };

  function submit(event: FormEvent) {
    event.preventDefault();
    const parsed = parseMilestoneForm(
      { achievedOn, note },
      { dob: baby.dob, today },
    );
    if (!parsed.ok) {
      setMessage(parsed.message);
      return;
    }
    actions.mark.mutate({ code, ...parsed.value, photo_id: photoId }, done);
  }

  return (
    <Sheet
      open
      onClose={onClose}
      title={title}
      dirty={JSON.stringify({ achievedOn, note, photoId }) !== opened}
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
            disabled={unmarking}
            className="min-h-14!"
          >
            Lưu
          </Button>
          {row && (
            <Button
              variant="ghost"
              block
              disabled={saving || unmarking}
              className="text-danger!"
              onClick={() => {
                if (window.confirm("Bỏ đánh dấu mốc này?"))
                  actions.unmark.mutate(code, done);
              }}
            >
              Bỏ đánh dấu
            </Button>
          )}
        </div>
      }
    >
      <form id={formId} onSubmit={submit} className="flex flex-col gap-4 pt-1">
        <label className="flex flex-col gap-1.5">
          <span className={FIELD_LABEL}>Ngày đạt</span>
          <input
            type="date"
            className={FIELD_INPUT}
            min={baby.dob}
            max={today}
            value={achievedOn}
            onChange={(event) => setAchievedOn(event.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className={FIELD_LABEL}>Ghi chú (không bắt buộc)</span>
          <textarea
            className={`${FIELD_INPUT} min-h-20 py-2.5`}
            maxLength={500}
            value={note}
            onChange={(event) => setNote(event.target.value)}
          />
        </label>
        {choices.length > 0 && (
          <fieldset className="flex flex-col gap-2">
            <legend className={`${FIELD_LABEL} mb-2`}>
              Gắn ảnh (không bắt buộc)
            </legend>
            <div className="grid grid-cols-4 gap-2">
              <button
                type="button"
                aria-pressed={photoId === null}
                onClick={() => setPhotoId(null)}
                className={cx(
                  "aspect-square rounded-[12px] text-[13px] font-semibold",
                  photoId === null ? "bg-ink text-bg" : "glass text-ink",
                )}
              >
                Không
              </button>
              {choices.map((photo) => (
                <button
                  key={photo.id}
                  type="button"
                  aria-pressed={photoId === photo.id}
                  aria-label={photo.caption ?? `Ảnh ngày ${photo.taken_on}`}
                  onClick={() => setPhotoId(photo.id)}
                  className={cx(
                    "aspect-square overflow-hidden rounded-[12px] bg-muted/15",
                    photoId === photo.id &&
                      "ring-2 ring-accent-text ring-offset-2 ring-offset-bg",
                  )}
                >
                  {urls.data?.[photo.storage_path] && (
                    <img
                      src={urls.data[photo.storage_path]}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-cover"
                    />
                  )}
                </button>
              ))}
            </div>
          </fieldset>
        )}
      </form>
    </Sheet>
  );
}
