import { describe, expect, it } from "vitest";
import type { Visit } from "@/lib/data/illness";
import type { PhotoRow } from "@/lib/supabase/rows";
import {
  buildVisit,
  episodeDeleteBlock,
  photoDeletable,
  visitDelete,
  visitHeading,
  visitsOf,
  visitToRaw,
} from "./visits";

const iso = (text: string) =>
  new Date(`${text.replace(" ", "T")}:00+07:00`).toISOString();
const NOW = new Date("2026-11-26T10:00:30+07:00");
const open = { id: "e1", started_at: iso("2026-11-24 23:30"), ended_at: null };
const closed = {
  id: "e1",
  started_at: iso("2026-11-20 08:00"),
  ended_at: iso("2026-11-22 09:30"),
};
const photo = (id: string, createdBy: string) =>
  ({ id, created_by: createdBy }) as PhotoRow;
const visit = (
  id: string,
  episodeId: string,
  at: string,
  over: Partial<Visit> = {},
): Visit =>
  ({
    id,
    episode_id: episodeId,
    baby_id: "b1",
    visited_at: iso(at),
    place: null,
    conclusion: null,
    advice: null,
    created_by: "u1",
    created_at: iso(at),
    updated_at: iso(at),
    photos: [],
    ...over,
  }) as Visit;

// Spec 2026-11-26 §8.4.
describe("visitToRaw", () => {
  it("a new visit starts now, with every other field empty", () => {
    expect(visitToRaw(null, NOW)).toEqual({
      at: "2026-11-26T10:00",
      place: "",
      conclusion: "",
      advice: "",
    });
  });

  it("an existing visit opens on its own values, in Vietnam time", () => {
    const saved = visit("v1", "e1", "2026-11-25 09:15", {
      place: "Phòng khám Nhi",
      conclusion: "Viêm họng",
      advice: null,
    });
    expect(visitToRaw(saved, NOW)).toEqual({
      at: "2026-11-25T09:15",
      place: "Phòng khám Nhi",
      conclusion: "Viêm họng",
      advice: "",
    });
  });
});

describe("buildVisit", () => {
  const opened = visitToRaw(null, NOW);
  const build = (
    raw: Partial<typeof opened>,
    episode: typeof open | typeof closed = open,
    stored: Parameters<typeof buildVisit>[0]["stored"] = null,
  ) =>
    buildVisit({
      episode,
      stored,
      opened,
      openedAt: NOW.toISOString(),
      raw: { ...opened, ...raw },
      now: NOW,
    });

  it("an untouched time keeps the moment the sheet opened, to the second", () => {
    expect(build({})).toEqual({
      ok: true,
      fields: {
        visited_at: NOW.toISOString(),
        place: null,
        conclusion: null,
        advice: null,
      },
      patch: {
        visited_at: NOW.toISOString(),
        place: null,
        conclusion: null,
        advice: null,
      },
    });
  });

  it("trims the texts; a blank one is saved as null", () => {
    const built = build({
      at: "2026-11-25T09:15",
      place: "  Phòng khám Nhi ",
      conclusion: "   ",
      advice: "Uống nhiều nước\n",
    });
    expect(built).toMatchObject({
      ok: true,
      fields: {
        visited_at: iso("2026-11-25 09:15"),
        place: "Phòng khám Nhi",
        conclusion: null,
        advice: "Uống nhiều nước",
      },
    });
  });

  it("the time must lie inside the episode, both ends included", () => {
    const outside = { ok: false, error: "Lúc khám nằm ngoài đợt ốm." };
    expect(build({ at: "2026-11-24T23:29" })).toEqual(outside);
    expect(build({ at: "2026-11-24T23:30" })).toMatchObject({ ok: true });
    expect(build({ at: "2026-11-21T10:00" }, closed)).toMatchObject({
      ok: true,
    });
    expect(build({ at: "2026-11-22T09:30" }, closed)).toMatchObject({
      ok: true,
    });
    expect(build({ at: "2026-11-22T09:31" }, closed)).toEqual(outside);
  });

  it("an open episode reaches now plus one minute, not further", () => {
    expect(build({ at: "2026-11-26T10:01" })).toMatchObject({ ok: true });
    expect(build({ at: "2026-11-26T10:02" })).toEqual({
      ok: false,
      error: "Lúc khám nằm ngoài đợt ốm.",
    });
  });

  it("a closed episode's default (now) is outside it", () => {
    expect(build({}, closed)).toEqual({
      ok: false,
      error: "Lúc khám nằm ngoài đợt ốm.",
    });
  });

  it("an emptied time is outside the episode", () => {
    expect(build({ at: "" })).toEqual({
      ok: false,
      error: "Lúc khám nằm ngoài đợt ốm.",
    });
  });

  it("editing: nothing changed gives no patch; a change gives every field", () => {
    const saved = visit("v1", "e1", "2026-11-25 09:15", {
      place: "Phòng khám Nhi",
    });
    const raw = visitToRaw(saved, NOW);
    const edit = (next: Partial<typeof raw>) =>
      buildVisit({
        episode: open,
        stored: saved,
        opened: raw,
        openedAt: saved.visited_at,
        raw: { ...raw, ...next },
        now: NOW,
      });
    expect(edit({})).toEqual({
      ok: true,
      fields: {
        visited_at: saved.visited_at,
        place: "Phòng khám Nhi",
        conclusion: null,
        advice: null,
      },
      patch: null,
    });
    expect(edit({ conclusion: "Viêm họng" })).toMatchObject({
      ok: true,
      patch: {
        visited_at: saved.visited_at,
        place: "Phòng khám Nhi",
        conclusion: "Viêm họng",
        advice: null,
      },
    });
  });
});

describe("visitsOf", () => {
  it("the visits of one episode, oldest first, whatever order they come in", () => {
    const visits = [
      visit("v3", "e1", "2026-11-26 08:00"),
      visit("v9", "e2", "2026-11-25 08:00"),
      visit("v1", "e1", "2026-11-25 08:00"),
    ];
    expect(visitsOf(visits, "e1").map((v) => v.id)).toEqual(["v1", "v3"]);
  });
});

describe("visitHeading", () => {
  it("is the day and time, then the place when there is one", () => {
    expect(
      visitHeading(
        visit("v1", "e1", "2026-11-25 09:05", { place: "Phòng khám Nhi" }),
      ),
    ).toBe("25/11 09:05 · Phòng khám Nhi");
    expect(visitHeading(visit("v1", "e1", "2026-11-25 09:05"))).toBe(
      "25/11 09:05",
    );
  });
});

describe("who may delete", () => {
  const owner = { userId: "u9", isOwner: true };
  const member = { userId: "u2", isOwner: false };

  it("a photo: the owner of the family or whoever added it", () => {
    expect(photoDeletable(photo("p1", "u1"), owner)).toBe(true);
    expect(photoDeletable(photo("p1", "u2"), member)).toBe(true);
    expect(photoDeletable(photo("p1", "u1"), member)).toBe(false);
  });

  it("a visit: hidden from others; blocked by a photo they cannot delete", () => {
    const mine = visit("v1", "e1", "2026-11-25 09:05", { created_by: "u2" });
    expect(visitDelete(mine, member)).toBe("allowed");
    expect(visitDelete({ ...mine, created_by: "u1" }, member)).toBe("hidden");
    expect(visitDelete({ ...mine, photos: [photo("p1", "u2")] }, member)).toBe(
      "allowed",
    );
    expect(
      visitDelete(
        { ...mine, photos: [photo("p1", "u2"), photo("p2", "u1")] },
        member,
      ),
    ).toBe("blocked");
    expect(
      visitDelete(
        { ...mine, created_by: "u1", photos: [photo("p2", "u1")] },
        owner,
      ),
    ).toBe("allowed");
  });
});

// Spec §6.4: "Xóa đợt ốm" from M5.
describe("episodeDeleteBlock", () => {
  it("visits not loaded: the network is needed to check them", () => {
    expect(episodeDeleteBlock(undefined, "e1")).toBe(
      "Cần mạng để kiểm các lần khám.",
    );
  });

  it("an episode with a visit cannot be deleted; one without can", () => {
    const visits = [visit("v1", "e2", "2026-11-25 08:00")];
    expect(episodeDeleteBlock(visits, "e2")).toBe("Xóa các lần khám trước.");
    expect(episodeDeleteBlock(visits, "e1")).toBeNull();
    expect(episodeDeleteBlock([], "e1")).toBeNull();
  });
});
