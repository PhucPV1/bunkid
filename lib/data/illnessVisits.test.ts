import { beforeEach, describe, expect, it, vi } from "vitest";
import type { PhotoRow, VisitRow } from "@/lib/supabase/rows";
import {
  fetchVisits,
  type Visit,
  type VisitFields,
  useVisitActions,
  useVisits,
} from "./illness";

type Result = { data: unknown; error: unknown };

const db = vi.hoisted(() => ({
  calls: [] as unknown[][],
  results: {} as Record<string, Result[]>,
}));
const queryClient = vi.hoisted(() => ({ invalidateQueries: vi.fn() }));
const uploadPhoto = vi.hoisted(() => vi.fn(async (_input: unknown) => {}));
const deletePhoto = vi.hoisted(() => vi.fn(async (_photo: unknown) => {}));

vi.mock("@/lib/supabase/client", () => ({
  supabase: () => ({
    from: (table: string) => {
      const chain: Record<string, unknown> = {};
      for (const name of [
        "select",
        "eq",
        "not",
        "order",
        "insert",
        "update",
        "delete",
      ])
        chain[name] = (...args: unknown[]) => {
          db.calls.push([table, name, ...args]);
          return chain;
        };
      chain.then = (resolve: (value: Result) => void) =>
        resolve(db.results[table]?.shift() ?? { data: [], error: null });
      return chain;
    },
  }),
}));
vi.mock("@tanstack/react-query", () => ({
  useQuery: (options: unknown) => options,
  useMutation: (options: unknown) => options,
  useQueryClient: () => queryClient,
}));
vi.mock("./outbox", () => ({
  enqueueEpisodeChange: vi.fn(),
  withPendingEpisodes: vi.fn(),
  episodesKey: (babyId: string) => ["illness-episodes", babyId],
}));
vi.mock("./photos", () => ({ uploadPhoto, deletePhoto }));

const visit = (id: string, visitedAt: string) =>
  ({ id, baby_id: "b1", episode_id: "e1", visited_at: visitedAt }) as VisitRow;
const photo = (id: string, visitId: string) =>
  ({ id, visit_id: visitId, storage_path: `f1/b1/${id}.jpg` }) as PhotoRow;
const FIELDS: VisitFields = {
  visited_at: "2026-11-25T02:30:00.000Z",
  place: "Phòng khám Nhi",
  conclusion: null,
  advice: null,
};
const UUID = /^[0-9a-f-]{36}$/;

beforeEach(() => {
  db.calls = [];
  db.results = {};
  uploadPhoto.mockReset();
  uploadPhoto.mockImplementation(async () => {});
  deletePhoto.mockReset();
  deletePhoto.mockImplementation(async () => {});
  queryClient.invalidateQueries.mockClear();
});

// Spec 2026-11-26 §8.2.
describe("fetchVisits", () => {
  it("reads every visit of the baby, oldest first, each with its photos", async () => {
    db.results = {
      illness_visits: [
        {
          data: [
            visit("v1", "2026-11-24T02:00:00Z"),
            visit("v2", "2026-11-25T02:00:00Z"),
          ],
          error: null,
        },
      ],
      photos: [{ data: [photo("p1", "v2"), photo("p2", "v2")], error: null }],
    };
    const visits = await fetchVisits("b1");
    expect(visits.map((v) => [v.id, v.photos.map((p) => p.id)])).toEqual([
      ["v1", []],
      ["v2", ["p1", "p2"]],
    ]);
    expect(db.calls).toEqual([
      ["illness_visits", "select", "*"],
      ["illness_visits", "eq", "baby_id", "b1"],
      ["illness_visits", "order", "visited_at"],
      ["illness_visits", "order", "id"],
      ["photos", "select", "*"],
      ["photos", "eq", "baby_id", "b1"],
      ["photos", "not", "visit_id", "is", null],
      ["photos", "order", "created_at"],
      ["photos", "order", "id"],
    ]);
  });

  it("throws the server's error", async () => {
    const error = { code: "42501", message: "denied" };
    db.results = { photos: [{ data: null, error }] };
    await expect(fetchVisits("b1")).rejects.toBe(error);
  });
});

describe("useVisits", () => {
  it("is fresh for a minute and can wait", async () => {
    const options = useVisits("b1", false) as unknown as {
      queryKey: unknown[];
      staleTime: number;
      enabled: boolean;
    };
    expect(options.queryKey).toEqual(["illness-visits", "b1"]);
    expect(options.staleTime).toBe(60_000);
    expect(options.enabled).toBe(false);
    expect((useVisits("b1") as unknown as { enabled: boolean }).enabled).toBe(
      true,
    );
  });
});

type Mutation<T, R = unknown> = {
  mutationFn: (value: T) => Promise<R>;
  onSettled: () => Promise<void>;
};
type Saved = { id: string; failed: File[] };
const actions = () =>
  useVisitActions("b1", "f1") as unknown as {
    add: Mutation<
      { episodeId: string; fields: VisitFields; files: File[] },
      Saved
    >;
    update: Mutation<
      {
        id: string;
        patch: VisitFields | null;
        visitedAt: string;
        files: File[];
      },
      Saved
    >;
    removePhoto: Mutation<PhotoRow>;
    remove: Mutation<Visit>;
  };
const fileA = { name: "a.jpg" } as File;
const fileB = { name: "b.jpg" } as File;

describe("useVisitActions", () => {
  it("add saves the row under a new id, then each photo with the day of the visit", async () => {
    const saved = await actions().add.mutationFn({
      episodeId: "e1",
      fields: FIELDS,
      files: [fileA, fileB],
    });
    expect(saved.id).toMatch(UUID);
    expect(saved.failed).toEqual([]);
    expect(db.calls).toEqual([
      [
        "illness_visits",
        "insert",
        { id: saved.id, episode_id: "e1", baby_id: "b1", ...FIELDS },
      ],
    ]);
    // 02:30 UTC is 09:30 in Vietnam, the same day.
    expect(uploadPhoto.mock.calls.map(([input]) => input)).toEqual([
      {
        babyId: "b1",
        familyId: "f1",
        file: fileA,
        takenOn: "2026-11-25",
        caption: null,
        visitId: saved.id,
      },
      {
        babyId: "b1",
        familyId: "f1",
        file: fileB,
        takenOn: "2026-11-25",
        caption: null,
        visitId: saved.id,
      },
    ]);
  });

  it("a photo that fails is skipped; the ones after it still go up", async () => {
    uploadPhoto.mockImplementationOnce(async () => {
      throw new Error("boom");
    });
    const saved = await actions().add.mutationFn({
      episodeId: "e1",
      fields: FIELDS,
      files: [fileA, fileB],
    });
    expect(saved.failed).toEqual([fileA]);
    expect(uploadPhoto).toHaveBeenCalledTimes(2);
  });

  it("a refused row uploads nothing", async () => {
    const error = { code: "23503", message: "fk" };
    db.results = { illness_visits: [{ data: null, error }] };
    await expect(
      actions().add.mutationFn({
        episodeId: "e1",
        fields: FIELDS,
        files: [fileA],
      }),
    ).rejects.toBe(error);
    expect(uploadPhoto).not.toHaveBeenCalled();
  });

  it("update writes the changed row, then uploads the photos", async () => {
    db.results = { illness_visits: [{ data: [{ id: "v1" }], error: null }] };
    const saved = await actions().update.mutationFn({
      id: "v1",
      patch: FIELDS,
      visitedAt: FIELDS.visited_at,
      files: [fileA],
    });
    expect(saved).toEqual({ id: "v1", failed: [] });
    expect(db.calls).toEqual([
      ["illness_visits", "update", FIELDS],
      ["illness_visits", "eq", "id", "v1"],
      ["illness_visits", "select", "id"],
    ]);
    expect(uploadPhoto).toHaveBeenCalledWith(
      expect.objectContaining({ visitId: "v1", takenOn: "2026-11-25" }),
    );
  });

  it("update with nothing changed only uploads the photos", async () => {
    await actions().update.mutationFn({
      id: "v1",
      patch: null,
      visitedAt: FIELDS.visited_at,
      files: [fileA],
    });
    expect(db.calls).toEqual([]);
    expect(uploadPhoto).toHaveBeenCalledTimes(1);
  });

  it("update of a visit that is gone is refused", async () => {
    db.results = { illness_visits: [{ data: [], error: null }] };
    await expect(
      actions().update.mutationFn({
        id: "v1",
        patch: FIELDS,
        visitedAt: FIELDS.visited_at,
        files: [],
      }),
    ).rejects.toThrow("permission_denied");
  });

  it("remove deletes each photo, then the row", async () => {
    db.results = { illness_visits: [{ data: [{ id: "v1" }], error: null }] };
    const p1 = photo("p1", "v1");
    const p2 = photo("p2", "v1");
    await actions().remove.mutationFn({
      ...visit("v1", FIELDS.visited_at),
      photos: [p1, p2],
    });
    expect(deletePhoto.mock.calls).toEqual([[p1], [p2]]);
    expect(db.calls).toEqual([
      ["illness_visits", "delete"],
      ["illness_visits", "eq", "id", "v1"],
      ["illness_visits", "select", "id"],
    ]);
  });

  it("remove stops at the first step that fails and keeps the rest", async () => {
    const error = new Error("boom");
    deletePhoto.mockImplementationOnce(async () => {
      throw error;
    });
    await expect(
      actions().remove.mutationFn({
        ...visit("v1", FIELDS.visited_at),
        photos: [photo("p1", "v1"), photo("p2", "v1")],
      }),
    ).rejects.toBe(error);
    expect(deletePhoto).toHaveBeenCalledTimes(1);
    expect(db.calls).toEqual([]);
  });

  it("removePhoto is the delete of the Photos page", async () => {
    const p1 = photo("p1", "v1");
    await actions().removePhoto.mutationFn(p1);
    expect(deletePhoto).toHaveBeenCalledWith(p1);
  });

  it("every action reloads the visits and the space used", async () => {
    const all = actions();
    for (const action of [all.add, all.update, all.removePhoto, all.remove]) {
      queryClient.invalidateQueries.mockClear();
      await action.onSettled();
      expect(queryClient.invalidateQueries.mock.calls).toEqual([
        [{ queryKey: ["illness-visits", "b1"] }],
        [{ queryKey: ["photos-usage", "f1"] }],
      ]);
    }
  });
});
