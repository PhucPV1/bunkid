import type { ReactNode } from "react";
import type { CategoryToken } from "@/lib/ui/categories";

const RING: Record<CategoryToken, { arc: string; track: string }> = {
  "cat-feed": { arc: "stroke-cat-feed", track: "stroke-cat-feed/12" },
  "cat-bottle": { arc: "stroke-cat-bottle", track: "stroke-cat-bottle/12" },
  "cat-sleep": { arc: "stroke-cat-sleep", track: "stroke-cat-sleep/12" },
  "cat-diaper": { arc: "stroke-cat-diaper", track: "stroke-cat-diaper/12" },
  "cat-pump": { arc: "stroke-cat-pump", track: "stroke-cat-pump/12" },
  "cat-tummy": { arc: "stroke-cat-tummy", track: "stroke-cat-tummy/12" },
  "cat-med": { arc: "stroke-cat-med", track: "stroke-cat-med/12" },
  "cat-temp": { arc: "stroke-cat-temp", track: "stroke-cat-temp/12" },
};

const SIZE = 200;
const STROKE = 12;
const RADIUS = (SIZE - STROKE) / 2;
export const RING_CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function TimerRing({
  token,
  progress,
  children,
}: {
  token: CategoryToken;
  progress: number;
  children: ReactNode;
}) {
  const filled = Math.min(1, Math.max(0, progress));
  return (
    <div className="relative size-[200px] shrink-0">
      <svg
        aria-hidden="true"
        width={SIZE}
        height={SIZE}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="-rotate-90"
      >
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          strokeWidth={STROKE}
          className={RING[token].track}
        />
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={RING_CIRCUMFERENCE}
          strokeDashoffset={RING_CIRCUMFERENCE * (1 - filled)}
          className={RING[token].arc}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 px-4 text-center">
        {children}
      </div>
    </div>
  );
}
