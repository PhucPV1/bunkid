import {
  checkEpisode,
  type EpisodeErrors,
  episodeError,
  type EpisodeLike,
} from "./illness";
import { fromVnLocalInput, toVnLocalInput } from "./time";

// The columns of an episode a parent can change.
export type EpisodeTimes = { started_at?: string; ended_at?: string | null };

// The two datetime-local values of the "Sửa đợt ốm" sheet (spec §6.4), in
// Vietnam time. `end` is null for an open episode, which has no end field.
export type EpisodeRaw = { start: string; end: string | null };

export function episodeToRaw(episode: EpisodeLike): EpisodeRaw {
  return {
    start: toVnLocalInput(new Date(episode.started_at)),
    end: episode.ended_at ? toVnLocalInput(new Date(episode.ended_at)) : null,
  };
}

// Spec §6.4 "Lưu": what to save, or the sentence under each field. `opened` is
// the form as it was opened: a field left as it was keeps its stored value to
// the second (the field itself only holds minutes), and stays out of the
// patch. `patch` null means nothing changed.
export function buildEpisodePatch(input: {
  episode: EpisodeLike;
  opened: EpisodeRaw;
  raw: EpisodeRaw;
  episodes: EpisodeLike[];
  now: Date;
}):
  | { ok: true; patch: EpisodeTimes | null }
  | { ok: false; errors: EpisodeErrors } {
  const { episode, opened, raw, episodes, now } = input;
  const startChanged = raw.start !== opened.start;
  const endChanged = raw.end !== opened.end;
  const start = startChanged
    ? fromVnLocalInput(raw.start)
    : new Date(episode.started_at);
  const end =
    raw.end === null
      ? null
      : endChanged
        ? fromVnLocalInput(raw.end)
        : new Date(String(episode.ended_at));
  const missing: EpisodeErrors = {};
  if (Number.isNaN(start.getTime())) missing.started_at = "Nhập giờ bắt đầu";
  if (end && Number.isNaN(end.getTime()))
    missing.ended_at = "Nhập giờ kết thúc";
  if (missing.started_at || missing.ended_at)
    return { ok: false, errors: missing };

  const started_at = start.toISOString();
  const ended_at = end ? end.toISOString() : null;
  const errors = checkEpisode({
    id: episode.id,
    started_at,
    ended_at,
    episodes,
    now,
  });
  if (episodeError(errors)) return { ok: false, errors };
  if (!startChanged && !endChanged) return { ok: true, patch: null };
  return {
    ok: true,
    patch: {
      ...(startChanged ? { started_at } : {}),
      ...(endChanged ? { ended_at } : {}),
    },
  };
}

type Refused = { ok: false; message: string };

// Spec §5.7: a one-tap action is checked first. When it is refused the caller
// shows `message` in a toast and queues nothing.
function refusal(input: Parameters<typeof checkEpisode>[0]): Refused | null {
  const message = episodeError(checkEpisode(input));
  return message ? { ok: false, message } : null;
}

// "Bắt đầu đợt ốm": a new open episode that starts now.
export function planStart(
  episodes: EpisodeLike[],
  now: Date,
): { ok: true; startedAt: string } | Refused {
  const startedAt = now.toISOString();
  return (
    refusal({
      id: null,
      started_at: startedAt,
      ended_at: null,
      episodes,
      now,
    }) ?? {
      ok: true,
      startedAt,
    }
  );
}

// "Bé đã khỏi": the episode ends now.
export function planClose(
  episode: EpisodeLike,
  episodes: EpisodeLike[],
  now: Date,
): { ok: true; patch: { ended_at: string } } | Refused {
  const ended_at = now.toISOString();
  return (
    refusal({
      id: episode.id,
      started_at: episode.started_at,
      ended_at,
      episodes,
      now,
    }) ?? { ok: true, patch: { ended_at } }
  );
}

// "Mở lại đợt ốm": the end is cleared.
export function planReopen(
  episode: EpisodeLike,
  episodes: EpisodeLike[],
  now: Date,
): { ok: true; patch: { ended_at: null } } | Refused {
  return (
    refusal({
      id: episode.id,
      started_at: episode.started_at,
      ended_at: null,
      episodes,
      now,
    }) ?? { ok: true, patch: { ended_at: null } }
  );
}
