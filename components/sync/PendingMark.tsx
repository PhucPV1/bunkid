export function PendingMark({ pending }: { pending: boolean }) {
  if (!pending) return null;
  return (
    <span role="img" aria-label="Chờ đồng bộ" title="Chờ đồng bộ">
      ⏳
    </span>
  );
}
