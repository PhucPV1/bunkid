import { describe, expect, it } from "vitest";
import { exifDate } from "./exifDate";

// Builds a minimal JPEG: SOI, APP1 "Exif" with IFD0 (DateTime, ExifIFD pointer)
// and an Exif IFD holding DateTimeOriginal.
function jpeg(little: boolean, original: string | null, dateTime: string) {
  const tiff: number[] = [];
  const u16 = (n: number) => (little ? [n & 0xff, n >> 8] : [n >> 8, n & 0xff]);
  const u32 = (n: number) =>
    little
      ? [n & 0xff, (n >> 8) & 0xff, (n >> 16) & 0xff, n >>> 24]
      : [n >>> 24, (n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff];
  const text = (s: string) => [...s].map((c) => c.charCodeAt(0)).concat(0);
  // Layout: header(8) | IFD0 at 8: 2 entries (2+24+4=30) | ExifIFD at 38: 1 entry (2+12+4=18)
  // | DateTime string at 56 (20 bytes) | DateTimeOriginal at 76 (20 bytes)
  tiff.push(...(little ? [0x49, 0x49] : [0x4d, 0x4d]), ...u16(42), ...u32(8));
  tiff.push(...u16(2));
  tiff.push(...u16(0x0132), ...u16(2), ...u32(20), ...u32(56));
  tiff.push(...u16(0x8769), ...u16(4), ...u32(1), ...u32(original ? 38 : 0));
  tiff.push(...u32(0));
  tiff.push(...u16(original ? 1 : 0));
  if (original) tiff.push(...u16(0x9003), ...u16(2), ...u32(20), ...u32(76));
  else tiff.push(...new Array(12).fill(0));
  tiff.push(...u32(0));
  tiff.push(...text(dateTime));
  tiff.push(...text(original ?? "0000:00:00 00:00:00"));
  const body = [...text("Exif"), 0, ...tiff];
  const size = body.length + 2;
  return Uint8Array.from([
    0xff,
    0xd8,
    0xff,
    0xe1,
    size >> 8,
    size & 0xff,
    ...body,
    0xff,
    0xd9,
  ]);
}

describe("exifDate", () => {
  it("reads DateTimeOriginal in both byte orders", () => {
    expect(
      exifDate(jpeg(true, "2026:10:05 08:30:00", "2026:11:01 10:00:00")),
    ).toBe("2026-10-05");
    expect(
      exifDate(jpeg(false, "2026:09:20 22:10:00", "2026:11:01 10:00:00")),
    ).toBe("2026-09-20");
  });

  it("falls back to DateTime, and returns null for files without EXIF", () => {
    expect(exifDate(jpeg(true, null, "2026:11:01 10:00:00"))).toBe(
      "2026-11-01",
    );
    expect(exifDate(Uint8Array.from([0xff, 0xd8, 0xff, 0xd9]))).toBeNull();
    expect(exifDate(Uint8Array.from([0x89, 0x50, 0x4e, 0x47]))).toBeNull();
    expect(exifDate(new Uint8Array(0))).toBeNull();
  });
});
