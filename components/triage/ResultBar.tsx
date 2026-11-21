import { Icon } from "@/components/ui/Icon";

// Spec 2026-11-19 §6: in place of the tab bar while there is no result, with
// the same position, width and shadow.
export function ResultBar({
  count,
  onSubmit,
}: {
  // Picked chips (the locked fever chip included) plus switches that are on.
  count: number;
  onSubmit: () => void;
}) {
  return (
    <div className="glass-strong fixed inset-x-4 bottom-[max(calc(env(safe-area-inset-bottom)+10px),26px)] z-10 mx-auto flex max-w-md items-center gap-2 rounded-full p-1.5 shadow-[0_10px_30px_rgb(0_0_0/0.15)] in-data-[theme=dark]:shadow-[0_10px_30px_rgb(0_0_0/0.25)] in-data-[theme=night]:shadow-none print:hidden">
      <a
        href="tel:115"
        aria-label="Gọi cấp cứu 115"
        className="flex size-14 shrink-0 items-center justify-center rounded-full bg-danger-solid text-on-danger transition-transform duration-[120ms] active:scale-[0.97]"
      >
        <Icon name="phone" size={24} />
      </a>
      <button
        type="button"
        onClick={onSubmit}
        className="flex h-14 min-w-0 flex-1 items-center justify-center rounded-full bg-accent text-on-accent px-5 text-base font-semibold whitespace-nowrap transition-transform duration-[120ms] active:scale-[0.97]"
      >
        {count > 0 ? `Xem kết quả · đã chọn ${count}` : "Xem kết quả"}
      </button>
    </div>
  );
}
