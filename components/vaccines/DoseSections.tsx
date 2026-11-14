import { ListGroup } from "@/components/ui/ListGroup";
import { doseKey } from "@/lib/rules/vaccineForm";
import { STATE_SECTIONS, type ScheduleItem } from "@/lib/rules/vaccines";
import { DoseLine } from "./DoseLine";

// Spec §9 Tiêm chủng: one ListGroup per state, in STATE_SECTIONS order.
export function DoseSections({
  items,
  pending,
  onOpen,
}: {
  items: ScheduleItem[];
  pending: Set<string>;
  onOpen: (item: ScheduleItem) => void;
}) {
  return (
    <>
      {STATE_SECTIONS.map((section) => {
        const list = items.filter((item) => item.state === section.state);
        if (list.length === 0) return null;
        return (
          <ListGroup
            key={section.state}
            title={`${section.title} (${list.length})`}
          >
            {list.map((item) => {
              const key = doseKey(item.dose.code, item.dose.doseNo);
              return (
                <li key={key} className="border-b border-line last:border-b-0">
                  <button
                    type="button"
                    onClick={() => onOpen(item)}
                    className="flex min-h-[52px] w-full flex-col items-start gap-0.5 px-4 py-2.5 text-left"
                  >
                    <DoseLine item={item} pending={pending.has(key)} />
                  </button>
                </li>
              );
            })}
          </ListGroup>
        );
      })}
    </>
  );
}
