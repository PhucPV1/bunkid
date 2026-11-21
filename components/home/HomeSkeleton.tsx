import { Skeleton } from "@/components/ui/Skeleton";

// The loading shapes of the home page (spec 2026-11-19 §3), at its sizes so
// little moves when the data lands: the hero at its shortest (a late feed makes
// the real one taller), three status tiles, the Bấm giờ and Ghi nhanh rows of
// five 58 px circles under their labels, then "24 giờ qua" and "Gần đây", each
// a 44 px title row over its stat tiles or list rows.
export function HomeSkeleton() {
  return (
    <div aria-busy="true" className="flex flex-col gap-3.5">
      <Skeleton className="h-[104px] rounded-[32px]" />
      <div className="grid grid-cols-3 gap-2">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-20 rounded-[24px]" />
        ))}
      </div>
      {[0, 1].map((row) => (
        <div key={row} className="flex flex-col gap-2.5">
          <Skeleton className="mx-1 h-[18px] w-24 rounded-full" />
          <div className="grid grid-cols-5 gap-1">
            {/* 80 px: the circle, its gap and the one-line label under it. */}
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="flex h-20 justify-center">
                <Skeleton className="size-[58px] rounded-full" />
              </div>
            ))}
          </div>
        </div>
      ))}
      <div className="flex flex-col gap-2.5">
        <div className="flex h-11 items-center px-1">
          <Skeleton className="h-[22px] w-28 rounded-full" />
        </div>
        <div className="grid grid-cols-3 gap-2.5">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-24 rounded-[24px]" />
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-2.5">
        <div className="flex h-11 items-center px-1">
          <Skeleton className="h-[22px] w-24 rounded-full" />
        </div>
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-[60px]" />
        ))}
      </div>
    </div>
  );
}
