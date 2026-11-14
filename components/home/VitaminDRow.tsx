export function VitaminDRow({
  doneAt,
  onRecord,
}: {
  doneAt: string | null;
  onRecord: () => void;
}) {
  if (doneAt)
    return (
      <p className="rounded-2xl bg-good-soft p-3 text-good-ink">
        ✓ Đã uống Vitamin D hôm nay lúc {doneAt}
      </p>
    );
  return (
    <button
      type="button"
      onClick={onRecord}
      className="min-h-11 rounded-2xl border border-dashed text-ink"
    >
      Ghi Vitamin D hôm nay
    </button>
  );
}
