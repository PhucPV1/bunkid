import Link from "next/link";
import type { IconName } from "@/lib/ui/icons";
import { Button, buttonClass } from "./Button";
import { Icon } from "./Icon";

// Spec §10: an empty list — a 40 px muted icon, one sentence, and an action.
// Spec 2026-11-26 §6.2 and §6.3: optionally a second, smaller line, and an
// action that leads to another page.
export function EmptyState({
  icon,
  text,
  detail,
  action,
}: {
  icon: IconName;
  text: string;
  detail?: string;
  // With `href` the action is a link; otherwise a button that calls onClick.
  action?: { label: string; onClick?: () => void; href?: string };
}) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-10 text-center">
      <Icon name={icon} size={40} strokeWidth={1.6} className="text-muted" />
      <p className="text-base text-muted">{text}</p>
      {detail && (
        <p className="text-[13px] leading-[18px] text-muted">{detail}</p>
      )}
      {action &&
        (action.href !== undefined ? (
          <Link
            href={action.href}
            className={buttonClass({ variant: "secondary", size: "md" })}
          >
            {action.label}
          </Link>
        ) : (
          <Button variant="secondary" size="md" onClick={action.onClick}>
            {action.label}
          </Button>
        ))}
    </div>
  );
}
