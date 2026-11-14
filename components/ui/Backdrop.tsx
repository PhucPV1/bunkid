// Soft colour blobs behind the glass (spec §4.3). Hidden when printing or with reduced transparency.
export function Backdrop() {
  return (
    <div
      data-backdrop
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-1 overflow-hidden print:hidden"
    >
      <div className="absolute -top-[60px] -left-[90px] size-[300px] rounded-full bg-blob-1 opacity-80 blur-[72px]" />
      <div className="absolute top-[260px] -right-[110px] size-[320px] rounded-full bg-blob-2 opacity-80 blur-[72px]" />
      <div className="absolute top-[720px] -left-[60px] size-[340px] rounded-full bg-blob-3 opacity-80 blur-[72px]" />
    </div>
  );
}
