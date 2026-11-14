import type { IconName } from "@/lib/ui/icons";
import { Button } from "./Button";
import { Icon } from "./Icon";

// Spec §10: an empty list — a 40 px muted icon, one sentence, and an action.
export function EmptyState({
  icon,
  text,
  action,
}: {
  icon: IconName;
  text: string;
  action?: { label: string; onClick: () => void };
}) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-10 text-center">
      <Icon name={icon} size={40} strokeWidth={1.6} className="text-muted" />
      <p className="text-base text-muted">{text}</p>
      {action && (
        <Button variant="secondary" size="md" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}
