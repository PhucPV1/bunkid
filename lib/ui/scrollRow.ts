// Spec 2026-11-27 §4.3: the scrollLeft that brings a cell of a horizontal row
// into view while moving the row as little as possible. Positions are in the
// row's content coordinates (0 = the row's first pixel). Only the row moves:
// scrollIntoView would also scroll the sheet's <dialog> while its panel is
// still sliding in, and the sheet would jump.
export function nearestScrollLeft({
  cellLeft,
  cellWidth,
  scrollLeft,
  clientWidth,
}: {
  cellLeft: number;
  cellWidth: number;
  scrollLeft: number;
  clientWidth: number;
}): number {
  if (cellLeft < scrollLeft) return cellLeft;
  if (cellLeft + cellWidth > scrollLeft + clientWidth)
    return cellLeft + cellWidth - clientWidth;
  return scrollLeft;
}

// Moves `row` so its picked cell (aria-pressed="true") is in view. The cell's
// left edge comes from the two boxes, so it does not depend on which ancestor
// is the cell's offsetParent.
export function keepPickedInView(row: HTMLElement | null): void {
  const cell = row?.querySelector<HTMLElement>('[aria-pressed="true"]');
  if (!row || !cell) return;
  row.scrollLeft = nearestScrollLeft({
    cellLeft:
      cell.getBoundingClientRect().left -
      row.getBoundingClientRect().left +
      row.scrollLeft,
    cellWidth: cell.offsetWidth,
    scrollLeft: row.scrollLeft,
    clientWidth: row.clientWidth,
  });
}
