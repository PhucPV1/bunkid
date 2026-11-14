export const SHEET_DRAG_CLOSE_PX = 80;

export function dragOffset(dy: number): number {
  return Math.max(0, dy);
}

export function shouldDismissDrag(dy: number): boolean {
  return dy > SHEET_DRAG_CLOSE_PX;
}
