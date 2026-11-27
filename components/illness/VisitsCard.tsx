"use client";

import { useState } from "react";
import { OfflineNote } from "@/components/OnlineOnly";
import { PhotoViewer } from "@/components/photos/PhotosScreen";
import { Button } from "@/components/ui/Button";
import { ErrorCard } from "@/components/ui/ErrorCard";
import { Glass } from "@/components/ui/Glass";
import { Icon } from "@/components/ui/Icon";
import { NeedsNetwork, waitingForNetwork } from "@/components/ui/NeedsNetwork";
import { Skeleton } from "@/components/ui/Skeleton";
import { toVietnameseError } from "@/lib/data/errors";
import type { useVisits, Visit } from "@/lib/data/illness";
import { usePhotoUrls } from "@/lib/data/photos";
import { useOnline } from "@/lib/hooks/useOnline";
import type { EpisodeLike } from "@/lib/rules/illness";
import { visitHeading, visitsOf } from "@/lib/rules/visits";
import type { Baby, PhotoRow } from "@/lib/supabase/rows";
import { VisitSheet } from "./VisitSheet";

export type VisitCardRow = {
  id: string;
  heading: string;
  conclusion: string | null;
  advice: string | null;
  photos: { id: string; src: string | undefined }[];
};

// Spec 2026-11-26 §8.3, drawn without hooks so a test can press its buttons.
export function VisitsCardView({
  status,
  error,
  rows,
  online,
  onRetry,
  onAdd,
  onOpen,
  onPhoto,
}: {
  status: "loading" | "offline" | "error" | "ready";
  error: string | null;
  // Oldest first.
  rows: VisitCardRow[];
  online: boolean;
  onRetry: () => void;
  onAdd: () => void;
  onOpen: (visitId: string) => void;
  onPhoto: (visitId: string, photoId: string) => void;
}) {
  return (
    <Glass className="flex flex-col gap-3 p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-[15px] font-semibold text-ink">Lần khám</h2>
        <Button
          variant="secondary"
          size="md"
          disabled={!online || status !== "ready"}
          onClick={onAdd}
        >
          <Icon name="plus" size={18} />
          Thêm
        </Button>
      </div>
      {!online && <OfflineNote />}
      {status === "loading" ? (
        <Skeleton className="h-[60px]" />
      ) : status === "offline" ? (
        <NeedsNetwork what="lần khám" />
      ) : status === "error" ? (
        <ErrorCard message={error ?? ""} onRetry={onRetry} />
      ) : rows.length === 0 ? (
        <p className="text-[15px] text-muted">Chưa có lần khám nào.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-line">
          {rows.map((row) => (
            <li
              key={row.id}
              className="flex flex-col gap-2 py-2.5 first:pt-0 last:pb-0"
            >
              {/* The whole text opens the sheet; the photos open themselves. */}
              <button
                type="button"
                onClick={() => onOpen(row.id)}
                className="flex min-h-11 flex-col items-start gap-0.5 text-left"
              >
                <span className="text-[13px] text-muted tabular-nums">
                  {row.heading}
                </span>
                {row.conclusion && (
                  <>
                    <span className="pt-1 text-[12px] text-muted">
                      Bác sĩ kết luận
                    </span>
                    <span className="text-[15px] font-bold text-ink">
                      {row.conclusion}
                    </span>
                  </>
                )}
                {row.advice && (
                  <span className="pt-0.5 text-[13px] whitespace-pre-line text-ink">
                    {row.advice}
                  </span>
                )}
              </button>
              {row.photos.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {row.photos.map((photo, index) => (
                    <button
                      key={photo.id}
                      type="button"
                      aria-label={`Ảnh ${index + 1}`}
                      onClick={() => onPhoto(row.id, photo.id)}
                      className="h-[78px] w-[60px] overflow-hidden rounded-[10px] bg-line"
                    >
                      {photo.src && (
                        <img
                          src={photo.src}
                          alt=""
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </Glass>
  );
}

// The card of the episode's page, with its sheet and the photo viewer.
export function VisitsCard({
  baby,
  userId,
  isOwner,
  episode,
  visits,
}: {
  baby: Baby;
  userId: string;
  isOwner: boolean;
  episode: EpisodeLike;
  // The page reads the visits once, for this card and for "Xóa đợt ốm".
  visits: ReturnType<typeof useVisits>;
}) {
  const online = useOnline();
  const [editing, setEditing] = useState<Visit | "new" | null>(null);
  const [viewing, setViewing] = useState<PhotoRow | null>(null);
  const own = visitsOf(visits.data ?? [], episode.id);
  const urls = usePhotoUrls(
    own.flatMap((visit) => visit.photos.map((photo) => photo.storage_path)),
  );
  const status = visits.data
    ? "ready"
    : waitingForNetwork(visits)
      ? "offline"
      : visits.isError
        ? "error"
        : "loading";
  return (
    <>
      <VisitsCardView
        status={status}
        error={visits.isError ? toVietnameseError(visits.error) : null}
        rows={own.map((visit) => ({
          id: visit.id,
          heading: visitHeading(visit),
          conclusion: visit.conclusion,
          advice: visit.advice,
          photos: visit.photos.map((photo) => ({
            id: photo.id,
            src: urls.data?.[photo.storage_path],
          })),
        }))}
        online={online}
        onRetry={() => void visits.refetch()}
        onAdd={() => setEditing("new")}
        onOpen={(id) =>
          setEditing(own.find((visit) => visit.id === id) ?? null)
        }
        onPhoto={(visitId, photoId) =>
          setViewing(
            own
              .find((visit) => visit.id === visitId)
              ?.photos.find((photo) => photo.id === photoId) ?? null,
          )
        }
      />
      {editing && (
        <VisitSheet
          baby={baby}
          userId={userId}
          isOwner={isOwner}
          episode={episode}
          visit={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
        />
      )}
      {/* Seeing only: a photo of a visit is deleted in its sheet (§8.4). */}
      {viewing && (
        <PhotoViewer
          photo={viewing}
          url={urls.data?.[viewing.storage_path]}
          baby={baby}
          canDelete={false}
          onClose={() => setViewing(null)}
        />
      )}
    </>
  );
}
