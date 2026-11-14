export function StatusLines({ lines }: { lines: string[] }) {
  if (lines.length === 0) return null;
  return (
    <ul className="flex flex-col gap-1 text-ink">
      {lines.map((line) => (
        <li key={line}>{line}</li>
      ))}
    </ul>
  );
}
