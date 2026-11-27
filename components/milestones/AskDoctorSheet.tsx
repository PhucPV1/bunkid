"use client";

import { Sheet } from "@/components/ui/Sheet";

// Spec 2026-11-27 §4.5: the "Khi nào nên hỏi bác sĩ" lines, once for the
// whole screen.
export function AskDoctorSheet({
  lines,
  onClose,
}: {
  lines: readonly string[];
  onClose: () => void;
}) {
  return (
    <Sheet open onClose={onClose} title="Khi nào nên hỏi bác sĩ">
      <ul className="list-disc pl-5 text-base text-ink">
        {lines.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
    </Sheet>
  );
}
