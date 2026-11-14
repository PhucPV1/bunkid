import { describe, expect, it } from "vitest";
import { droppedWrites, takeRecentDrop } from "./outboxEvents";

describe("takeRecentDrop", () => {
  it("hands over the last refused write once, and only while it is recent", () => {
    droppedWrites.emit("Đã có người bắt đầu trước");
    expect(takeRecentDrop()).toBe("Đã có người bắt đầu trước");
    expect(takeRecentDrop()).toBeNull();
    droppedWrites.emit("Dữ liệu không hợp lệ");
    expect(takeRecentDrop(Date.now() + 61_000)).toBeNull();
  });
});
