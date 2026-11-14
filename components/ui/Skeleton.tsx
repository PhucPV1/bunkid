import { cx } from "@/lib/ui/cx";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cx(
        "animate-[kb-pulse_1.4s_ease-in-out_infinite] rounded-[16px] bg-line motion-reduce:animate-none",
        className,
      )}
    />
  );
}
