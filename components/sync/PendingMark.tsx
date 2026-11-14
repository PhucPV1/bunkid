import { Icon } from "@/components/ui/Icon";

export function PendingMark({ pending }: { pending: boolean }) {
  if (!pending) return null;
  return (
    <span
      role="img"
      aria-label="Chờ đồng bộ"
      title="Chờ đồng bộ"
      className="inline-flex align-middle text-muted"
    >
      <Icon name="clock" size={14} />
    </span>
  );
}
