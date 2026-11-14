import { Skeleton } from "@/components/ui/Skeleton";

// Spec §10: loading draws the home page's shapes — hero 300, 3 number tiles, 4 list rows.
export function HomeSkeleton() {
  return (
    <div aria-busy="true" className="flex flex-col gap-[18px]">
      <Skeleton className="h-[300px] rounded-[32px]" />
      <div className="grid grid-cols-3 gap-2.5">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-[92px] rounded-[24px]" />
        ))}
      </div>
      {[0, 1, 2, 3].map((i) => (
        <Skeleton key={i} className="h-[60px]" />
      ))}
    </div>
  );
}
