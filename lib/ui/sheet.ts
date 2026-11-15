export const SHEET_DRAG_CLOSE_PX = 80;

export function dragOffset(dy: number): number {
  return Math.max(0, dy);
}

export function shouldDismissDrag(dy: number): boolean {
  return dy > SHEET_DRAG_CLOSE_PX;
}

export type CloseStep = "close" | "confirm" | "keep";

// Spec §5.1: every way of closing a sheet asks this first.
// While the discard dialog is up, another close request (Esc) means "Tiếp tục nhập".
export function closeStep(dirty: boolean, confirming: boolean): CloseStep {
  if (confirming) return "keep";
  return dirty ? "confirm" : "close";
}
