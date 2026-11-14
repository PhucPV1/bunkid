import { Icon } from "@/components/ui/Icon";

// Spec §7.1 step 8: only shown until today's dose is logged.
export function VitaminDButton({ onRecord }: { onRecord: () => void }) {
  return (
    <button
      type="button"
      onClick={onRecord}
      className="glass flex min-h-[50px] items-center justify-center gap-2 rounded-full border-dashed! border-muted! text-[15px] font-semibold text-ink"
    >
      <Icon name="pill" size={18} className="text-cat-med" />
      Ghi Vitamin D hôm nay
    </button>
  );
}
