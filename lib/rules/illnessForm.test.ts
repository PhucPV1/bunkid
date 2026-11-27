import { describe, expect, it } from "vitest";
import type { EpisodeLike } from "./illness";
import {
  buildEpisodePatch,
  episodeToRaw,
  planClose,
  planReopen,
  planStart,
} from "./illnessForm";

const vn = (text: string) => new Date(`${text.replace(" ", "T")}:00+07:00`);
const iso = (text: string) => vn(text).toISOString();
const episode = (
  start: string,
  end: string | null = null,
  id = "ep1",
): EpisodeLike => ({
  id,
  started_at: iso(start),
  ended_at: end === null ? null : iso(end),
});

const old = episode("2026-11-10 08:00", "2026-11-12 08:00", "old");
const now = vn("2026-11-27 08:00");

describe("episodeToRaw", () => {
  it("writes the times the way a datetime-local field holds them, in Vietnam time", () => {
    expect(episodeToRaw(episode("2026-11-24 23:30"))).toEqual({
      start: "2026-11-24T23:30",
      end: null,
    });
    expect(
      episodeToRaw(episode("2026-11-24 23:30", "2026-11-26 07:05")),
    ).toEqual({ start: "2026-11-24T23:30", end: "2026-11-26T07:05" });
  });
});

// Spec 2026-11-26 §6.4.
describe("buildEpisodePatch", () => {
  // Stored with seconds, as "Bé đã khỏi" and the invite write them.
  const closed: EpisodeLike = {
    id: "ep1",
    started_at: "2026-11-24T16:30:41.250Z",
    ended_at: "2026-11-26T00:05:12.000Z",
  };
  const opened = episodeToRaw(closed);
  const build = (raw: { start: string; end: string | null }) =>
    buildEpisodePatch({
      episode: closed,
      opened,
      raw,
      episodes: [old, closed],
      now,
    });

  it("nothing changed: nothing to save, and the stored seconds are left alone", () => {
    expect(build(opened)).toEqual({ ok: true, patch: null });
  });

  it("only a changed field goes into the patch", () => {
    expect(build({ ...opened, start: "2026-11-24T20:10" })).toEqual({
      ok: true,
      patch: { started_at: iso("2026-11-24 20:10") },
    });
    expect(build({ ...opened, end: "2026-11-26T09:00" })).toEqual({
      ok: true,
      patch: { ended_at: iso("2026-11-26 09:00") },
    });
    expect(
      build({ start: "2026-11-24T20:10", end: "2026-11-26T09:00" }),
    ).toEqual({
      ok: true,
      patch: {
        started_at: iso("2026-11-24 20:10"),
        ended_at: iso("2026-11-26 09:00"),
      },
    });
  });

  it("an unchanged field is checked with its stored value", () => {
    // The end stays 07:05:12; a start of 07:05 is before it, so this passes.
    expect(build({ ...opened, start: "2026-11-26T07:05" }).ok).toBe(true);
    expect(build({ ...opened, start: "2026-11-26T07:06" })).toEqual({
      ok: false,
      errors: { ended_at: "Giờ kết thúc phải sau giờ bắt đầu." },
    });
  });

  it("the errors of spec §5.7 come back by field", () => {
    expect(build({ ...opened, start: "2026-11-11T08:00" })).toEqual({
      ok: false,
      errors: { started_at: "Trùng thời gian với một đợt ốm khác." },
    });
    expect(build({ ...opened, end: "2026-11-27T09:00" })).toEqual({
      ok: false,
      errors: { ended_at: "Giờ kết thúc ở tương lai." },
    });
  });

  it("an emptied field asks for its time", () => {
    expect(build({ ...opened, start: "" })).toEqual({
      ok: false,
      errors: { started_at: "Nhập giờ bắt đầu" },
    });
    expect(build({ ...opened, end: "" })).toEqual({
      ok: false,
      errors: { ended_at: "Nhập giờ kết thúc" },
    });
  });

  it("an open episode has only its start", () => {
    const open = episode("2026-11-25 08:00");
    const raw = episodeToRaw(open);
    expect(
      buildEpisodePatch({
        episode: open,
        opened: raw,
        raw: { start: "2026-11-25T06:00", end: null },
        episodes: [old, open],
        now,
      }),
    ).toEqual({ ok: true, patch: { started_at: iso("2026-11-25 06:00") } });
  });
});

// Spec §5.7: the one-tap actions. A refusal is one sentence for a toast, and
// nothing is queued.
describe("planStart", () => {
  it("starts now", () => {
    expect(planStart([old], now)).toEqual({
      ok: true,
      startedAt: now.toISOString(),
    });
    expect(planStart([], now).ok).toBe(true);
  });

  it("is refused while another episode is open", () => {
    expect(planStart([old, episode("2026-11-25 08:00")], now)).toEqual({
      ok: false,
      message: "Trùng thời gian với một đợt ốm khác.",
    });
  });

  // Spec §5.5: from the invite the episode starts at the first fever reading.
  it("starts at the time it is given, and checks that time", () => {
    expect(planStart([old], now, iso("2026-11-26 20:15"))).toEqual({
      ok: true,
      startedAt: iso("2026-11-26 20:15"),
    });
    expect(planStart([old], now, iso("2026-11-11 20:15"))).toEqual({
      ok: false,
      message: "Trùng thời gian với một đợt ốm khác.",
    });
  });
});

describe("planClose", () => {
  const open = episode("2026-11-25 08:00");

  it("ends the episode now", () => {
    expect(planClose(open, [old, open], now)).toEqual({
      ok: true,
      patch: { ended_at: now.toISOString() },
    });
  });

  it("is refused when the start is not before now", () => {
    const ahead = episode("2026-11-27 08:00");
    expect(planClose(ahead, [ahead], now)).toEqual({
      ok: false,
      message: "Giờ kết thúc phải sau giờ bắt đầu.",
    });
  });
});

describe("planReopen", () => {
  const last = episode("2026-11-20 08:00", "2026-11-22 08:00", "last");

  it("clears the end", () => {
    expect(planReopen(last, [old, last], now)).toEqual({
      ok: true,
      patch: { ended_at: null },
    });
  });

  it("is refused when a later episode would overlap", () => {
    expect(planReopen(old, [old, last], now)).toEqual({
      ok: false,
      message: "Trùng thời gian với một đợt ốm khác.",
    });
  });
});
