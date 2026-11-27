import type { Visit, VisitFields } from "@/lib/data/illness";
import type { PhotoRow, VisitRow } from "@/lib/supabase/rows";
import { formatDayShort } from "./days";
import type { EpisodeLike } from "./illness";
import {
  formatVnTime,
  fromVnLocalInput,
  toVnLocalInput,
  vnDateString,
} from "./time";

// Spec 2026-11-26 §8.4: a visit holds up to six photos.
export const MAX_VISIT_PHOTOS = 6;

const OUTSIDE = "Lúc khám nằm ngoài đợt ốm.";
const MINUTE_MS = 60_000;

type VisitValues = Pick<
  VisitRow,
  "visited_at" | "place" | "conclusion" | "advice"
>;

// The four fields of the "Lần khám" sheet as typed. `at` is a datetime-local
// value in Vietnam time.
export type VisitRaw = {
  at: string;
  place: string;
  conclusion: string;
  advice: string;
};

// A new visit opens on now; a saved one on its own values.
export function visitToRaw(visit: VisitValues | null, now: Date): VisitRaw {
  return {
    at: toVnLocalInput(visit ? new Date(visit.visited_at) : now),
    place: visit?.place ?? "",
    conclusion: visit?.conclusion ?? "",
    advice: visit?.advice ?? "",
  };
}

const text = (value: string) => value.trim() || null;

// Spec §8.4 "Lưu": the fields to save, or the sentence under "Lúc khám".
// "Lúc khám" must not be more than a minute ahead of now and must lie in the
// episode, both ends included (an open episode runs up to now): one sentence
// for both, since a time ahead of now is outside the episode too. A time left
// as it was opened keeps `openedAt` to the second (the field only holds
// minutes). `stored` is the visit as saved, or null for a new one; `patch` is
// null when nothing changed.
export function buildVisit(input: {
  episode: EpisodeLike;
  stored: VisitValues | null;
  opened: VisitRaw;
  openedAt: string;
  raw: VisitRaw;
  now: Date;
}):
  | { ok: true; fields: VisitFields; patch: VisitFields | null }
  | { ok: false; error: string } {
  const { episode, stored, opened, openedAt, raw, now } = input;
  const at =
    raw.at === opened.at ? new Date(openedAt) : fromVnLocalInput(raw.at);
  const ms = at.getTime();
  const latest = now.getTime() + MINUTE_MS;
  const end = episode.ended_at
    ? Math.min(Date.parse(episode.ended_at), latest)
    : latest;
  if (Number.isNaN(ms) || ms < Date.parse(episode.started_at) || ms > end)
    return { ok: false, error: OUTSIDE };
  const fields: VisitFields = {
    visited_at: at.toISOString(),
    place: text(raw.place),
    conclusion: text(raw.conclusion),
    advice: text(raw.advice),
  };
  const same =
    stored !== null &&
    Date.parse(stored.visited_at) === ms &&
    stored.place === fields.place &&
    stored.conclusion === fields.conclusion &&
    stored.advice === fields.advice;
  return { ok: true, fields, patch: same ? null : fields };
}

// Spec §8.3: the visits of one episode, oldest first.
export function visitsOf(visits: Visit[], episodeId: string): Visit[] {
  return visits
    .filter((visit) => visit.episode_id === episodeId)
    .sort(
      (a, b) =>
        Date.parse(a.visited_at) - Date.parse(b.visited_at) ||
        a.id.localeCompare(b.id),
    );
}

// "{dd/mm} {HH:mm} · {nơi khám}"; without a place, only the day and time.
export function visitHeading(visit: VisitValues): string {
  const at = new Date(visit.visited_at);
  const when = `${formatDayShort(vnDateString(at))} ${formatVnTime(at)}`;
  return visit.place ? `${when} · ${visit.place}` : when;
}

export type Viewer = { userId: string; isOwner: boolean };

// The policy of photos: the owner of the family or whoever added the photo.
export function photoDeletable(
  photo: Pick<PhotoRow, "created_by">,
  viewer: Viewer,
): boolean {
  return viewer.isOwner || photo.created_by === viewer.userId;
}

// "Xóa lần khám": hidden from anyone who is neither the owner of the family
// nor whoever added the visit; blocked while a photo is left that they may
// not delete.
export function visitDelete(
  visit: Pick<Visit, "created_by" | "photos">,
  viewer: Viewer,
): "hidden" | "blocked" | "allowed" {
  if (!viewer.isOwner && visit.created_by !== viewer.userId) return "hidden";
  return visit.photos.every((photo) => photoDeletable(photo, viewer))
    ? "allowed"
    : "blocked";
}

// Spec §6.4 from M5: why "Xóa đợt ốm" is off, or null when it is on. An
// episode with a visit cannot be deleted (the server refuses too), and
// without the visits loaded there is no telling.
export function episodeDeleteBlock(
  visits: Pick<Visit, "episode_id">[] | undefined,
  episodeId: string,
): string | null {
  if (!visits) return "Cần mạng để kiểm các lần khám.";
  return visits.some((visit) => visit.episode_id === episodeId)
    ? "Xóa các lần khám trước."
    : null;
}
