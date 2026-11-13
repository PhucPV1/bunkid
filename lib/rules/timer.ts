import type { LogType } from "./logDetails";

export type TimerButton =
  | { type: "breast"; side: "left" | "right" }
  | { type: "sleep" | "pump" | "tummy" };
export type RunningLog = {
  id: string;
  type: LogType;
  details: Record<string, unknown>;
};
export type TimerAction =
  | { kind: "stop"; id: string }
  | { kind: "start"; type: LogType; details: Record<string, unknown> };

function startAction(button: TimerButton): TimerAction {
  return {
    kind: "start",
    type: button.type,
    details: button.type === "breast" ? { side: button.side } : {},
  };
}

export function planTimerPress(
  running: RunningLog[],
  button: TimerButton,
): TimerAction[] {
  const current = running.find((log) => log.type === button.type);
  if (!current) return [startAction(button)];
  if (button.type === "breast" && current.details.side !== button.side) {
    return [{ kind: "stop", id: current.id }, startAction(button)];
  }
  return [{ kind: "stop", id: current.id }];
}
