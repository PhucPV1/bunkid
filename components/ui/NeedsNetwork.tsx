// Offline, TanStack Query pauses a query that has never loaded instead of
// fetching it, so "isPending" alone would pulse a skeleton for ever.
export function waitingForNetwork(query: {
  isPending: boolean;
  fetchStatus: string;
}): boolean {
  return query.isPending && query.fetchStatus === "paused";
}

// Shown in place of that skeleton. The query resumes by itself once online.
export function NeedsNetwork({ what }: { what: string }) {
  return (
    <p role="status" className="px-1 text-[15px] text-muted">
      Cần mạng để tải {what}. Trang sẽ tự tải khi có mạng lại.
    </p>
  );
}
