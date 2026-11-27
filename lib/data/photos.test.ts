import { beforeEach, describe, expect, it, vi } from "vitest";
import type { PhotoRow } from "@/lib/supabase/rows";
import { deletePhoto, uploadPhoto, usePhotos } from "./photos";

type Result = { data: unknown; error: unknown };

const db = vi.hoisted(() => ({
  calls: [] as unknown[][],
  results: [] as Result[],
}));
const nextResult = (): Result =>
  db.results.shift() ?? { data: [], error: null };

vi.mock("@/lib/supabase/client", () => ({
  supabase: () => ({
    from: (table: string) => {
      const chain: Record<string, unknown> = {};
      for (const name of [
        "select",
        "eq",
        "is",
        "order",
        "range",
        "insert",
        "delete",
      ])
        chain[name] = (...args: unknown[]) => {
          db.calls.push([table, name, ...args]);
          return chain;
        };
      chain.then = (resolve: (value: Result) => void) => resolve(nextResult());
      return chain;
    },
    storage: {
      from: (bucket: string) => ({
        upload: async (...args: unknown[]) => {
          db.calls.push([bucket, "upload", ...args]);
          return nextResult();
        },
        remove: async (...args: unknown[]) => {
          db.calls.push([bucket, "remove", ...args]);
          return nextResult();
        },
      }),
    },
  }),
}));
vi.mock("@/lib/photoCompress", () => ({
  compressPhoto: async () => ({ size: 1234 }) as Blob,
}));
// The hooks are called outside React here: each returns the options it was given.
vi.mock("@tanstack/react-query", () => ({
  keepPreviousData: "keep",
  useQuery: (options: unknown) => options,
  useMutation: (options: unknown) => options,
  useQueryClient: () => ({}),
}));

const UUID = /^[0-9a-f-]{36}$/;

beforeEach(() => {
  db.calls = [];
  db.results = [];
});

// Spec 2026-11-26 §8.2: the photos of a visit stay off the Photos page.
describe("usePhotos", () => {
  it("reads only the photos that belong to no visit", async () => {
    const options = usePhotos("b1") as unknown as {
      queryFn: () => Promise<unknown>;
    };
    await options.queryFn();
    expect(db.calls).toContainEqual(["photos", "is", "visit_id", null]);
  });
});

describe("uploadPhoto", () => {
  it("stores the object, then a row that points at the visit", async () => {
    await uploadPhoto({
      babyId: "b1",
      familyId: "f1",
      file: {} as File,
      takenOn: "2026-11-25",
      caption: null,
      visitId: "v1",
    });
    const [upload, insert] = db.calls;
    expect(upload[0]).toBe("photos");
    expect(upload[1]).toBe("upload");
    expect(upload[2]).toMatch(/^f1\/b1\/[0-9a-f-]{36}\.jpg$/);
    expect(insert[0]).toBe("photos");
    expect(insert[1]).toBe("insert");
    const row = insert[2] as Record<string, unknown>;
    expect(row).toMatchObject({
      baby_id: "b1",
      taken_on: "2026-11-25",
      caption: null,
      size_bytes: 1234,
      visit_id: "v1",
    });
    expect(row.id).toMatch(UUID);
    expect(row.storage_path).toBe(upload[2]);
  });

  it("a photo of the Photos page has no visit", async () => {
    await uploadPhoto({
      babyId: "b1",
      familyId: "f1",
      file: {} as File,
      takenOn: "2026-11-25",
      caption: "Tắm",
    });
    expect(db.calls[1][2]).toMatchObject({ caption: "Tắm", visit_id: null });
  });

  it("removes the object again when the row is refused", async () => {
    const error = { code: "42501", message: "denied" };
    db.results = [
      { data: null, error: null },
      { data: null, error },
    ];
    await expect(
      uploadPhoto({
        babyId: "b1",
        familyId: "f1",
        file: {} as File,
        takenOn: "2026-11-25",
        caption: null,
        visitId: "v1",
      }),
    ).rejects.toBe(error);
    expect(db.calls[2][1]).toBe("remove");
    expect(db.calls[2][2]).toEqual([db.calls[0][2]]);
  });
});

describe("deletePhoto", () => {
  const photo = { id: "p1", storage_path: "f1/b1/p1.jpg" } as PhotoRow;

  it("removes the object first, then the row", async () => {
    db.results = [
      { data: [], error: null },
      { data: [{ id: "p1" }], error: null },
    ];
    await deletePhoto(photo);
    expect(db.calls).toEqual([
      ["photos", "remove", ["f1/b1/p1.jpg"]],
      ["photos", "delete"],
      ["photos", "eq", "id", "p1"],
      ["photos", "select", "id"],
    ]);
  });

  it("no row deleted means not allowed", async () => {
    db.results = [
      { data: [], error: null },
      { data: [], error: null },
    ];
    await expect(deletePhoto(photo)).rejects.toThrow("permission_denied");
  });
});
