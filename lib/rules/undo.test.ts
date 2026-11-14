import { describe, expect, it } from "vitest";
import type { RunningLog } from "./timer";
import {
  canResume,
  instantToast,
  RESUME_BLOCKED,
  resumeBlocked,
  resumePatch,
  savedMessage,
  stopToast,
  stoppedOnly,
  UNDO_LABEL,
  undoFailedMessage,
} from "./undo";

const AT = new Date("2026-11-14T05:00:00Z"); // 12:00 giờ VN
const left: RunningLog = {
  id: "l1",
  type: "breast",
  details: { side: "left" },
};
const sleep: RunningLog = { id: "s1", type: "sleep", details: {} };
const breastLog = {
  id: "l1",
  type: "breast",
  started_at: "2026-11-14T04:48:00.000Z",
  details: { side: "left" },
  note: "bé bú ngoan",
};

describe("stoppedOnly", () => {
  it("is the timer a press only stops", () => {
    expect(stoppedOnly([left], { type: "breast", side: "left" })).toBe("l1");
    expect(stoppedOnly([sleep, left], { type: "sleep" })).toBe("s1");
  });

  it("is null when the press starts a timer or switches sides", () => {
    expect(stoppedOnly([], { type: "sleep" })).toBeNull();
    expect(stoppedOnly([left], { type: "breast", side: "right" })).toBeNull();
    expect(stoppedOnly([left], { type: "pump" })).toBeNull();
  });
});

describe("undo toasts", () => {
  it("an instant log: describes it at its own time, undo deletes it", () => {
    expect(
      instantToast({
        id: "n1",
        type: "bottle",
        details: { ml: 90, milk: "formula" },
        at: AT,
      }),
    ).toEqual({
      message: "Đã ghi Bình 90 ml sữa công thức lúc 12:00",
      undo: { kind: "delete", id: "n1" },
    });
  });

  it("a stopped timer: describes the duration at the stop time, undo resumes it", () => {
    expect(stopToast(breastLog, AT)).toEqual({
      message: "Đã ghi Bú trái · 12 phút lúc 12:00",
      undo: { kind: "resume", log: breastLog },
    });
  });

  it("resuming clears ended_at and keeps everything else", () => {
    expect(resumePatch(breastLog)).toEqual({
      started_at: "2026-11-14T04:48:00.000Z",
      ended_at: null,
      details: { side: "left" },
      note: "bé bú ngoan",
    });
  });

  it("only the owner or the log's creator can resume a stopped timer", () => {
    expect(canResume({ created_by: "u2" }, { role: "owner" }, "u1")).toBe(true);
    expect(canResume({ created_by: "u1" }, { role: "member" }, "u1")).toBe(
      true,
    );
    expect(canResume({ created_by: "u2" }, { role: "member" }, "u1")).toBe(
      false,
    );
  });

  it("cannot resume while a timer of the same type runs", () => {
    expect(resumeBlocked([left], breastLog)).toBe(true);
    expect(resumeBlocked([sleep], breastLog)).toBe(false);
    expect(resumeBlocked([], breastLog)).toBe(false);
    expect(RESUME_BLOCKED).toBe("đang có timer cùng loại chạy");
  });

  it("texts", () => {
    expect(UNDO_LABEL).toBe("Hoàn tác");
    expect(
      savedMessage(
        {
          type: "diaper",
          started_at: AT.toISOString(),
          ended_at: AT.toISOString(),
          details: { wet: true, dirty: false },
        },
        AT,
      ),
    ).toBe("Đã ghi Tã ướt lúc 12:00");
    expect(undoFailedMessage("Mất kết nối")).toBe(
      "Không hoàn tác được: Mất kết nối",
    );
  });
});
