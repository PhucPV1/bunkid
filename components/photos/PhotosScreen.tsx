"use client";

import { useState, type FormEvent } from "react";
import { OnlineOnly } from "@/components/OnlineOnly";
import { toVietnameseError } from "@/lib/data/errors";
import {
  usePhotoActions,
  usePhotos,
  usePhotosUsage,
  usePhotoUrls,
} from "@/lib/data/photos";
import { PhotoReadError, readHead } from "@/lib/photoCompress";
import { exifDate } from "@/lib/rules/exifDate";
import {
  defaultTakenOn,
  groupByAgeMonth,
  parsePhotoForm,
  usage,
} from "@/lib/rules/photos";
import { vnDateString } from "@/lib/rules/time";
import type { Baby, PhotoRow } from "@/lib/supabase/rows";

const BAR = {
  ok: "bg-accent",
  warn: "bg-warn-ink",
  full: "bg-danger",
} as const;

export function PhotosScreen({
  baby,
  userId,
  isOwner,
}: {
  baby: Baby;
  userId: string;
  isOwner: boolean;
}) {
  const photos = usePhotos(baby.id);
  const rows = photos.data ?? [];
  const total = usePhotosUsage(baby.family_id);
  const [open, setOpen] = useState<{ photo: PhotoRow; url?: string } | null>(
    null,
  );
  const used = usage(total.data ?? 0);
  const groups = groupByAgeMonth(rows, baby.dob);

  return (
    <main className="mx-auto flex max-w-md flex-col gap-4 p-4">
      <h1 className="text-2xl font-semibold">Ảnh của bé</h1>
      <section className="flex flex-col gap-1">
        <div className="h-2 overflow-hidden rounded-full bg-soft">
          <div
            className={`h-full ${BAR[used.level]}`}
            style={{ width: `${used.percent}%` }}
          />
        </div>
        <p
          role={used.level === "ok" ? undefined : "status"}
          className={`text-sm ${used.level === "ok" ? "text-muted" : "text-danger-ink"}`}
        >
          {used.text}
        </p>
      </section>
      {used.level !== "full" && <UploadForm baby={baby} />}
      {photos.isError && !photos.data && (
        <p role="alert" className="text-danger">
          {toVietnameseError(photos.error)}
        </p>
      )}
      {photos.data && rows.length === 0 && (
        <p className="text-muted">Chưa có ảnh nào.</p>
      )}
      {groups.map((group) => (
        <PhotoGroup
          key={group.months}
          label={group.label}
          photos={group.photos}
          onOpen={(photo, url) => setOpen({ photo, url })}
        />
      ))}
      {open && (
        <PhotoViewer
          photo={open.photo}
          url={open.url}
          baby={baby}
          canDelete={isOwner || open.photo.created_by === userId}
          onClose={() => setOpen(null)}
        />
      )}
    </main>
  );
}

function UploadForm({ baby }: { baby: Baby }) {
  const actions = usePhotoActions(baby.id, baby.family_id);
  const [file, setFile] = useState<File | null>(null);
  const [takenOn, setTakenOn] = useState("");
  const [caption, setCaption] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  // Changing the key clears the file input after an upload.
  const [inputKey, setInputKey] = useState(0);
  const today = vnDateString(new Date());

  async function pick(next: File | null) {
    setFile(next);
    setMessage(null);
    if (!next) return;
    const day = exifDate(await readHead(next).catch(() => new Uint8Array()));
    setTakenOn(defaultTakenOn(day, next.lastModified, baby.dob, new Date()));
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!file) {
      setMessage("Chọn một ảnh trước.");
      return;
    }
    const parsed = parsePhotoForm(
      { takenOn, caption },
      { dob: baby.dob, today },
    );
    if (!parsed.ok) {
      setMessage(parsed.message);
      return;
    }
    actions.upload.mutate(
      { file, takenOn: parsed.value.taken_on, caption: parsed.value.caption },
      {
        onSuccess: () => {
          setFile(null);
          setCaption("");
          setInputKey((k) => k + 1);
          setMessage("Đã tải ảnh lên.");
        },
        onError: (e) =>
          setMessage(
            e instanceof PhotoReadError ? e.message : toVietnameseError(e),
          ),
      },
    );
  }

  const input = "min-h-11 rounded-xl border px-3";
  return (
    <OnlineOnly>
      <form
        onSubmit={submit}
        className="flex flex-col gap-3 rounded-2xl border p-4"
      >
        <label className="flex flex-col gap-1">
          Chọn ảnh
          <input
            key={inputKey}
            type="file"
            accept="image/*"
            className="min-h-11"
            onChange={(e) => void pick(e.target.files?.[0] ?? null)}
          />
        </label>
        {file && (
          <>
            <label className="flex flex-col gap-1">
              Ngày chụp
              <input
                type="date"
                className={input}
                min={baby.dob}
                max={today}
                value={takenOn}
                onChange={(e) => setTakenOn(e.target.value)}
              />
            </label>
            <label className="flex flex-col gap-1">
              Ghi chú (không bắt buộc)
              <input
                className={input}
                maxLength={200}
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
              />
            </label>
          </>
        )}
        {message && (
          <p role="status" className="text-sm">
            {message}
          </p>
        )}
        <button
          type="submit"
          disabled={!file || actions.upload.isPending}
          className="min-h-12 rounded-2xl bg-accent text-on-accent disabled:opacity-50"
        >
          {actions.upload.isPending ? "Đang tải lên…" : "Tải ảnh lên"}
        </button>
      </form>
    </OnlineOnly>
  );
}

function PhotoViewer({
  photo,
  url,
  baby,
  canDelete,
  onClose,
}: {
  photo: PhotoRow;
  url: string | undefined;
  baby: Baby;
  canDelete: boolean;
  onClose: () => void;
}) {
  const actions = usePhotoActions(baby.id, baby.family_id);
  const [message, setMessage] = useState<string | null>(null);
  return (
    <div
      className="fixed inset-0 z-20 flex flex-col bg-black/40 p-4 pt-[calc(1rem+env(safe-area-inset-top))] pb-[calc(1rem+env(safe-area-inset-bottom))]"
      onClick={onClose}
    >
      <div
        className="m-auto flex max-h-full w-full max-w-md flex-col gap-3 overflow-y-auto rounded-2xl bg-surface p-3"
        onClick={(e) => e.stopPropagation()}
      >
        {url ? (
          <img
            src={url}
            alt={photo.caption ?? ""}
            className="w-full rounded-xl"
          />
        ) : (
          <p className="text-muted">Cần mạng để xem ảnh.</p>
        )}
        <p className="text-sm text-muted">
          {photo.taken_on.split("-").reverse().join("/")}
        </p>
        {photo.caption && <p>{photo.caption}</p>}
        {message && (
          <p role="alert" className="text-danger">
            {message}
          </p>
        )}
        {canDelete && (
          <OnlineOnly>
            <button
              type="button"
              disabled={actions.remove.isPending}
              onClick={() => {
                if (window.confirm("Xóa ảnh này? Không khôi phục được."))
                  actions.remove.mutate(photo, {
                    onSuccess: onClose,
                    onError: (e) => setMessage(toVietnameseError(e)),
                  });
              }}
              className="min-h-12 rounded-2xl border text-danger disabled:opacity-50"
            >
              Xóa ảnh
            </button>
          </OnlineOnly>
        )}
        <button
          type="button"
          onClick={onClose}
          className="min-h-12 rounded-2xl border"
        >
          Đóng
        </button>
      </div>
    </div>
  );
}

function PhotoGroup({
  label,
  photos,
  onOpen,
}: {
  label: string;
  photos: PhotoRow[];
  onOpen: (photo: PhotoRow, url: string | undefined) => void;
}) {
  const urls = usePhotoUrls(photos.map((p) => p.storage_path));
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-lg font-medium">{label}</h2>
      <div className="grid grid-cols-3 gap-1">
        {photos.map((photo) => {
          const url = urls.data?.[photo.storage_path];
          return (
            <button
              key={photo.id}
              type="button"
              onClick={() => onOpen(photo, url)}
              className="aspect-square overflow-hidden rounded-lg bg-soft"
              aria-label={photo.caption ?? `Ảnh ngày ${photo.taken_on}`}
            >
              {url && (
                <img
                  src={url}
                  alt={photo.caption ?? ""}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}
