"use client";

import { useState } from "react";
import { ListGroup, ListRow } from "@/components/ui/ListGroup";
import { Sheet } from "@/components/ui/Sheet";

// Spec §9: the source disclaimer folds into one row that opens a sheet with the full text.
export function VaccineSourceRow({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <ListGroup>
        <ListRow
          label="Nguồn lịch tiêm"
          icon="book"
          iconColor="muted"
          onClick={() => setOpen(true)}
        />
      </ListGroup>
      <Sheet open={open} onClose={() => setOpen(false)} title="Nguồn lịch tiêm">
        <p className="pb-2 text-base leading-6 text-ink">{text}</p>
      </Sheet>
    </>
  );
}
