"use client";

import { useState, type FormEvent } from "react";
import { OnlineOnly } from "@/components/OnlineOnly";
import { FIELD_INPUT, FIELD_LABEL } from "@/components/quick/styles";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorCard } from "@/components/ui/ErrorCard";
import { Glass } from "@/components/ui/Glass";
import { PageHeader } from "@/components/ui/PageHeader";
import { Sheet } from "@/components/ui/Sheet";
import { Skeleton } from "@/components/ui/Skeleton";
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
  warn: "bg-warn",
  full: "bg-danger",
} as const;

const dmy = (day: string) => day.split("-").reverse().join("/");

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
    <main className="mx-auto flex max-w-md flex-col gap-[18px] px-4 pt-2 pb-4">
      <PageHeader
        title="Ảnh của bé"
        back={{ href: "/kham-pha", label: "Khám phá" }}
      />
      <section className="flex flex-col gap-1.5 px-1">
        <div className="h-2 overflow-hidden rounded-full bg-line">
          <div
            className={`h-full rounded-full ${BAR[used.level]}`}
            style={{ width: `${used.percent}%` }}
          />
        </div>
        <p
          role={used.level === "ok" ? undefined : "status"}
          className={`text-[13px] ${used.level === "ok" ? "text-muted" : "text-danger"}`}
        >
          {used.text}
        </p>
      </section>
      {used.level !== "full" && <UploadForm baby={baby} />}
      {photos.isPending && photos.fetchStatus === "paused" ? (
        <p className="px-1 text-[15px] text-muted">Cần mạng để tải ảnh.</p>
      ) : photos.isPending ? (
        <div className="grid grid-cols-3 gap-1.5">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="aspect-square rounded-[12px]" />
          ))}
        </div>
      ) : photos.isError && !photos.data ? (
        <ErrorCard
          message={toVietnameseError(photos.error)}
          onRetry={() => void photos.refetch()}
        />
      ) : rows.length === 0 ? (
        <EmptyState icon="image" text="Chưa có ảnh nào." />
      ) : (
        groups.map((group) => (
          <PhotoGroup
            key={group.months}
            label={group.label}
            photos={group.photos}
            onOpen={(photo, url) => setOpen({ photo, url })}
          />
        ))
      )}
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

  return (
    <OnlineOnly>
      <Glass as="form" onSubmit={submit} className="flex flex-col gap-3 p-4">
        <label className="flex flex-col gap-1.5">
          <span className={FIELD_LABEL}>Chọn ảnh</span>
          <input
            key={inputKey}
            type="file"
            accept="image/*"
            className="min-h-11 text-[15px] text-ink"
            onChange={(e) => void pick(e.target.files?.[0] ?? null)}
          />
        </label>
        {file && (
          <>
            <label className="flex flex-col gap-1.5">
              <span className={FIELD_LABEL}>Ngày chụp</span>
              <input
                type="date"
                className={FIELD_INPUT}
                min={baby.dob}
                max={today}
                value={takenOn}
                onChange={(e) => setTakenOn(e.target.value)}
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={FIELD_LABEL}>Ghi chú (không bắt buộc)</span>
              <input
                className={FIELD_INPUT}
                maxLength={200}
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
              />
            </label>
          </>
        )}
        {message && (
          <p role="status" className="text-[15px] text-ink">
            {message}
          </p>
        )}
        <Button
          type="submit"
          block
          disabled={!file}
          busy={actions.upload.isPending}
        >
          {actions.upload.isPending ? "Đang tải lên…" : "Tải ảnh lên"}
        </Button>
      </Glass>
    </OnlineOnly>
  );
}

export function PhotoViewer({
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
    <Sheet
      open
      onClose={onClose}
      title={dmy(photo.taken_on)}
      footer={
        canDelete ? (
          <OnlineOnly>
            <Button
              variant="ghost"
              block
              busy={actions.remove.isPending}
              className="text-danger!"
              onClick={() => {
                if (window.confirm("Xóa ảnh này? Không khôi phục được."))
                  actions.remove.mutate(photo, {
                    onSuccess: onClose,
                    onError: (e) => setMessage(toVietnameseError(e)),
                  });
              }}
            >
              Xóa ảnh
            </Button>
          </OnlineOnly>
        ) : undefined
      }
    >
      <div className="flex flex-col gap-3 pt-1">
        {url ? (
          <img
            src={url}
            alt={photo.caption ?? ""}
            className="w-full rounded-[16px]"
          />
        ) : (
          <p className="text-[15px] text-muted">Cần mạng để xem ảnh.</p>
        )}
        {photo.caption && <p className="text-base text-ink">{photo.caption}</p>}
        {message && (
          <p role="alert" className="text-[15px] text-danger">
            {message}
          </p>
        )}
      </div>
    </Sheet>
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
    <section className="flex flex-col gap-2.5">
      <h2 className="px-1 text-xl leading-[26px] font-bold text-ink">
        {label}
      </h2>
      <div className="grid grid-cols-3 gap-1.5">
        {photos.map((photo) => {
          const url = urls.data?.[photo.storage_path];
          return (
            <button
              key={photo.id}
              type="button"
              onClick={() => onOpen(photo, url)}
              className="aspect-square overflow-hidden rounded-[12px] bg-line"
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
