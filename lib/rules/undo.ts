import { describeLog, type LogLike } from "./describeLog";
import type { LogPatch } from "./logForm";
import { formatVnTime } from "./time";
import { planTimerPress, type RunningLog, type TimerButton } from "./timer";

export const UNDO_LABEL = "Hoàn tác";

export type StoppedLog = {
  id: string;
  type: string;
  started_at: string;
  details: unknown;
  note: string | null;
};

export type UndoToast = {
  message: string;
  undo: { kind: "delete"; id: string } | { kind: "resume"; log: StoppedLog };
};

export function savedMessage(log: LogLike, at: Date): string {
  return `Đã ghi ${describeLog(log, at)} lúc ${formatVnTime(at)}`;
}

export function undoFailedMessage(reason: string): string {
  return `Không hoàn tác được: ${reason}`;
}

// Spec §7.4: Undo follows a press that only stops a timer, never one that
// starts a timer or switches breast sides.
export function stoppedOnly(
  running: RunningLog[],
  button: TimerButton,
): string | null {
  const plan = planTimerPress(running, button);
  return plan.length === 1 && plan[0].kind === "stop" ? plan[0].id : null;
}

export function instantToast(saved: {
  id: string;
  type: string;
  details: Record<string, unknown>;
  at: Date;
}): UndoToast {
  const iso = saved.at.toISOString();
  return {
    message: savedMessage(
      {
        type: saved.type,
        started_at: iso,
        ended_at: iso,
        details: saved.details,
      },
      saved.at,
    ),
    undo: { kind: "delete", id: saved.id },
  };
}

export function stopToast(log: StoppedLog, at: Date): UndoToast {
  return {
    message: savedMessage({ ...log, ended_at: at.toISOString() }, at),
    undo: { kind: "resume", log },
  };
}

// RLS logs_update: only the owner or the log's creator may set ended_at back to null.
export function canResume(
  log: { created_by: string },
  member: { role: string },
  userId: string,
): boolean {
  return member.role === "owner" || log.created_by === userId;
}

export const RESUME_BLOCKED = "đang có timer cùng loại chạy";

// logs_one_running_timer: one running timer per type, so a resume would be refused.
export function resumeBlocked(
  running: RunningLog[],
  log: { type: string },
): boolean {
  return running.some((other) => other.type === log.type);
}

export function resumePatch(log: StoppedLog): LogPatch {
  return {
    started_at: log.started_at,
    ended_at: null,
    details: (log.details ?? {}) as Record<string, unknown>,
    note: log.note,
  };
}
