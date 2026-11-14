import { describe, expect, it } from "vitest";
import type { LogLike } from "@/lib/rules/describeLog";
import { homeStatusLines } from "@/lib/rules/status";

const NOW = new Date("2026-11-14T05:00:00Z"); // 12:00 giờ VN
const H = 3_600_000;
const ago = (hours: number) =>
  new Date(NOW.getTime() - hours * H).toISOString();
const log = (
  type: string,
  start: number,
  end: number | null,
  details: unknown = {},
): LogLike => ({
  type,
  started_at: ago(start),
  ended_at: end === null ? null : ago(end),
  details,
});
const bottle = (h: number) => log("bottle", h, h, { ml: 90, milk: "formula" });
const lines = (logs: LogLike[]) =>
  homeStatusLines({ logs, feedIntervalMin: 180, now: NOW });

describe("homeStatusLines", () => {
  it("shows the next feed time from the last feed start", () => {
    expect(lines([bottle(1)])).toEqual(["Cữ bú tiếp theo khoảng 14:00"]);
  });
  it("says the feed is due once the interval has passed", () => {
    expect(lines([bottle(4)])).toEqual(["Đã đến giờ bú (từ 11:00)"]);
  });
  it("says the baby is feeding while a breast timer runs", () => {
    expect(lines([log("breast", 0.2, null, { side: "left" })])).toEqual([
      "Đang bú",
    ]);
  });
  it("hides lines based on data older than 12 hours", () => {
    expect(lines([bottle(13), log("sleep", 14, 13)])).toEqual([]);
  });
  it("shows how long the baby has been awake or asleep", () => {
    expect(lines([bottle(1), log("sleep", 2, 0.75)])).toEqual([
      "Cữ bú tiếp theo khoảng 14:00",
      "Bé đã thức 45 phút",
    ]);
    expect(lines([log("sleep", 1.5, null)])).toEqual([
      "Bé đang ngủ 1 giờ 30 phút",
    ]);
  });
});
