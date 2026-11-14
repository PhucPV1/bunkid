"use client";

import { useState, type FormEvent } from "react";
import { toVietnameseError } from "@/lib/data/errors";
import { useMilestoneActions } from "@/lib/data/milestones";
import { usePhotos, usePhotoUrls } from "@/lib/data/photos";
import { parseMilestoneForm } from "@/lib/rules/milestones";
import { vnDateString } from "@/lib/rules/time";
import type { Baby, MilestoneRow } from "@/lib/supabase/rows";

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
  const today = vnDateString(new Date());
  const photos = usePhotos(baby.id);
  // Recent photos first; the milestone keeps at most one (spec §6.9).
  const choices = (photos.data ?? []).slice(0, 12);
  const urls = usePhotoUrls(choices.map((p) => p.storage_path));
  const [achievedOn, setAchievedOn] = useState(row?.achieved_on ?? today);
  const [note, setNote] = useState(row?.note ?? "");
  const [photoId, setPhotoId] = useState<string | null>(row?.photo_id ?? null);
  const [message, setMessage] = useState<string | null>(null);
  const done = {
    onSuccess: onClose,
    onError: (e: unknown) => setMessage(toVietnameseError(e)),
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
    <div
      className="fixed inset-0 z-20 flex items-end bg-black/40"
      onClick={onClose}
    >
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[90dvh] w-full flex-col gap-3 overflow-y-auto rounded-t-3xl bg-surface p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))]"
      >
        <h2 className="text-xl font-semibold">{title}</h2>
        <label className="flex flex-col gap-1">
          Ngày đạt
          <input
            type="date"
            className="min-h-11 rounded-xl border px-3"
            min={baby.dob}
            max={today}
            value={achievedOn}
            onChange={(e) => setAchievedOn(e.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1">
          Ghi chú (không bắt buộc)
          <textarea
            className="min-h-20 rounded-xl border p-3"
            maxLength={500}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </label>
        {choices.length > 0 && (
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1">Gắn ảnh (không bắt buộc)</legend>
            <div className="grid grid-cols-4 gap-1">
              <button
                type="button"
                aria-pressed={photoId === null}
                onClick={() => setPhotoId(null)}
                className={`aspect-square rounded-lg border text-sm ${photoId === null ? "border-accent bg-accent-soft text-accent-ink" : ""}`}
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
                  className={`aspect-square overflow-hidden rounded-lg border-2 ${photoId === photo.id ? "border-accent" : "border-transparent"}`}
                >
                  {urls.data?.[photo.storage_path] && (
                    <img
                      src={urls.data[photo.storage_path]}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  )}
                </button>
              ))}
            </div>
          </fieldset>
        )}
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
            className="min-h-12 flex-1 rounded-2xl bg-accent text-on-accent"
          >
            Lưu
          </button>
        </div>
        {row && (
          <button
            type="button"
            onClick={() => actions.unmark.mutate(code, done)}
            className="min-h-11 rounded-2xl text-danger"
          >
            Bỏ đánh dấu
          </button>
        )}
      </form>
    </div>
  );
}
