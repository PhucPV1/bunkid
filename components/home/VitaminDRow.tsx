export function VitaminDRow({
  doneAt,
  onRecord,
}: {
  doneAt: string | null;
  onRecord: () => void;
}) {
  if (doneAt)
    return (
      <p className="rounded-2xl bg-emerald-50 p-3 text-emerald-900">
        ✓ Đã uống Vitamin D hôm nay lúc {doneAt}
      </p>
    );
  return (
    <button
      type="button"
      onClick={onRecord}
      className="min-h-11 rounded-2xl border border-dashed text-neutral-700"
    >
      Ghi Vitamin D hôm nay
    </button>
  );
}
