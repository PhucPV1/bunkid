import { Icon } from "@/components/ui/Icon";
import { ListGroup, ListRow } from "@/components/ui/ListGroup";
import { sortContacts } from "@/lib/rules/emergency";
import type { EmergencyContactRow } from "@/lib/supabase/rows";

// Spec §9 Khẩn cấp: a 64 px solid danger pill.
export function Call115Button({ label }: { label: string }) {
  return (
    <a
      href="tel:115"
      className="flex min-h-16 items-center justify-center gap-2 rounded-full bg-danger-solid px-5 text-lg font-semibold text-on-danger transition-transform duration-[120ms] active:scale-[0.97]"
    >
      <Icon name="phone" size={22} />
      <span>{label}</span>
    </a>
  );
}

// Spec gốc §6.7: 115 always first, then the family's contacts by sort.
export function CallList({ contacts }: { contacts: EmergencyContactRow[] }) {
  const list = sortContacts(contacts);
  return (
    <div className="flex flex-col gap-[18px]">
      <Call115Button label="Cấp cứu 115" />
      {list.length > 0 && (
        <ListGroup title="Danh bạ">
          {list.map((contact) => (
            <ListRow
              key={contact.id}
              label={contact.label}
              detail={contact.phone}
              icon="phone"
              iconColor="cat-med"
              href={`tel:${contact.phone}`}
              chevron={false}
            />
          ))}
        </ListGroup>
      )}
    </div>
  );
}
