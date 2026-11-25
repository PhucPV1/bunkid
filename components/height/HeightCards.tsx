import type { ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { StatusChip } from "@/components/ui/StatusChip";
import type { HeightView } from "@/lib/rules/heightView";

const CARD = "glass flex flex-col rounded-[26px] p-4";
const LABEL =
  "text-[13px] leading-[18px] font-semibold tracking-[0.04em] text-muted uppercase";
const BODY = "text-[15px] leading-[22px] text-ink";
const MUTED = "text-[13px] leading-[18px] text-muted";

// Spec 2026-11-25 §6.3, item 2: the target and where the baby stands against
// its line.
export function HeightGoalCard({
  goal,
  isOwner,
  onSet,
}: {
  goal: HeightView["goal"];
  isOwner: boolean;
  // Opens the sheet of §6.5. Without it the owner sees no button.
  onSet?: () => void;
}) {
  if (!goal)
    return (
      <section className={`${CARD} gap-3`}>
        <p className="text-xl leading-[26px] font-bold text-ink">
          Chưa có mục tiêu chiều cao
        </p>
        {isOwner ? (
          onSet && (
            <Button block onClick={onSet}>
              Đặt mục tiêu
            </Button>
          )
        ) : (
          <p className={MUTED}>Chủ gia đình chưa đặt mục tiêu chiều cao.</p>
        )}
      </section>
    );
  return (
    <section className={`${CARD} gap-2`}>
      <div className="flex items-center justify-between gap-2">
        <span className={LABEL}>Mục tiêu lúc trưởng thành</span>
        {goal.chip && (
          <StatusChip tone={goal.chip.tone}>{goal.chip.text}</StatusChip>
        )}
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-[44px] leading-[48px] font-bold tracking-[-0.02em] text-ink tabular-nums">
          {goal.target}
        </span>
        <span className="text-xl leading-[26px] font-bold text-ink">cm</span>
      </div>
      <p className={BODY}>{goal.sentence}</p>
    </section>
  );
}

// The label over the target mark is up to about 118 px wide ("Mục tiêu
// 190,5"): at either end of the bar it stays inside the card.
const labelLeft = (at: number) => `clamp(60px, ${at}%, calc(100% - 60px))`;
const NUMBER = "absolute top-[58px] -translate-x-1/2 text-xs tabular-nums";

// Item 3: the range expected from the parents' heights, and the target on it.
export function ParentalRangeCard({
  parents,
}: {
  parents: HeightView["parents"];
}) {
  return (
    <section className={`${CARD} gap-3`}>
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="text-base font-bold text-ink">Di truyền dự kiến</h2>
        {parents && <span className={MUTED}>{parents.line}</span>}
      </div>
      {parents ? (
        <>
          <div
            role="img"
            aria-label={parents.bar.label}
            className="relative h-[76px]"
          >
            {parents.bar.target && (
              <span
                className="absolute top-0 -translate-x-1/2 rounded-full bg-accent px-2.5 py-0.5 text-[13px] leading-[18px] font-semibold whitespace-nowrap text-on-accent"
                style={{ left: labelLeft(parents.bar.target.at) }}
              >
                {parents.bar.target.text}
              </span>
            )}
            <span className="absolute inset-x-0 top-9 h-3 rounded-full bg-line" />
            <span
              className="absolute top-9 h-3 rounded-full bg-good/35"
              style={{
                left: `${parents.bar.low.at}%`,
                width: `${parents.bar.high.at - parents.bar.low.at}%`,
              }}
            />
            <span
              className="absolute top-8 h-5 w-0.5 -translate-x-1/2 bg-good"
              style={{ left: `${parents.bar.mid.at}%` }}
            />
            {parents.bar.target && (
              <span
                className="absolute top-[26px] h-[30px] w-1 -translate-x-1/2 rounded-sm bg-accent"
                style={{ left: `${parents.bar.target.at}%` }}
              />
            )}
            <span
              className={`${NUMBER} text-muted`}
              style={{ left: `${parents.bar.low.at}%` }}
            >
              {parents.bar.low.text}
            </span>
            <span
              className={`${NUMBER} font-semibold text-ink`}
              style={{ left: `${parents.bar.mid.at}%` }}
            >
              {parents.bar.mid.text}
            </span>
            <span
              className={`${NUMBER} text-muted`}
              style={{ left: `${parents.bar.high.at}%` }}
            >
              {parents.bar.high.text}
            </span>
          </div>
          <p className={BODY}>{parents.sentence}</p>
          <p className={MUTED}>
            Tính từ chiều cao bố mẹ. Đây là ước lượng, phần lớn trẻ nằm trong
            khoảng này.
          </p>
        </>
      ) : (
        <p className={MUTED}>Nhập chiều cao bố mẹ để xem khoảng dự kiến.</p>
      )}
    </section>
  );
}

// Item 4: the frame round the chart of the length against the target line.
// The chart itself is loaded lazily and passed in as children.
export function TargetPathCard({
  title,
  babyName,
  note,
  children,
}: {
  title: string;
  babyName: string;
  note: string;
  children: ReactNode;
}) {
  return (
    <section className="glass flex flex-col gap-2.5 rounded-[26px] p-3">
      <h2 className="px-1 text-base font-bold text-ink">{title}</h2>
      {children}
      <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1 px-1 text-xs text-muted">
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-accent" />
          {babyName}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-4 border-t-2 border-dashed border-cat-sleep" />
          Đường mục tiêu
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-3.5 rounded-[3px] bg-good/25" />
          Vùng bình thường
        </span>
      </div>
      <p className={`px-1 ${MUTED}`}>{note}</p>
    </section>
  );
}

// Item 5: how fast the length grows, against what is usual at that age.
export function VelocityCard({
  velocity,
}: {
  velocity: HeightView["velocity"];
}) {
  return (
    <section className={`${CARD} gap-1.5`}>
      <div className="flex items-center justify-between gap-2">
        <span className={LABEL}>Tốc độ tăng</span>
        {velocity && (
          <StatusChip tone={velocity.chip.tone}>
            {velocity.chip.text}
          </StatusChip>
        )}
      </div>
      {velocity ? (
        <>
          <span className="text-xl leading-[26px] font-bold text-ink tabular-nums">
            {velocity.rate}
          </span>
          <span className={MUTED}>{velocity.line}</span>
        </>
      ) : (
        <p className={MUTED}>Cần hai lần đo chiều dài cách nhau từ 14 ngày.</p>
      )}
    </section>
  );
}
