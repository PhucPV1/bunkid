export function cacheHasLog(data: unknown, id: string): boolean {
  if (Array.isArray(data))
    return data.some(
      (row) => typeof row === "object" && row !== null && row.id === id,
    );
  if (
    typeof data === "object" &&
    data !== null &&
    "pages" in data &&
    Array.isArray(data.pages)
  )
    return data.pages.some((page) => cacheHasLog(page, id));
  return false;
}
