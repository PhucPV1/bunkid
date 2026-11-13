import { inflateSync } from "node:zlib";
import { describe, expect, it } from "vitest";
import { solidPng } from "./png";

describe("solidPng", () => {
  it("writes the PNG signature and the requested size", () => {
    const png = solidPng(16, [242, 140, 160]);
    expect([...png.subarray(0, 8)]).toEqual([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
    ]);
    expect(png.subarray(12, 16).toString("ascii")).toBe("IHDR");
    expect(png.readUInt32BE(16)).toBe(16);
    expect(png.readUInt32BE(20)).toBe(16);
  });

  it("fills every pixel with the colour", () => {
    const png = solidPng(2, [1, 2, 3]);
    const idatStart = png.indexOf("IDAT") + 4;
    const idatLength = png.readUInt32BE(idatStart - 8);
    const raw = inflateSync(png.subarray(idatStart, idatStart + idatLength));
    expect([...raw]).toEqual([0, 1, 2, 3, 1, 2, 3, 0, 1, 2, 3, 1, 2, 3]);
  });
});
