import { sortContacts } from "@/lib/rules/emergency";
import type { EmergencyContactRow } from "@/lib/supabase/rows";

// Spec §6.7: 115 always first, then the family's contacts by sort.
export function CallList({ contacts }: { contacts: EmergencyContactRow[] }) {
  return (
    <ul className="flex flex-col gap-2">
      <li>
        <a
          href="tel:115"
          className="flex min-h-14 items-center justify-between rounded-2xl bg-alarm px-4 text-lg font-semibold text-on-accent"
        >
          Cấp cứu 115
          <span aria-hidden="true">📞</span>
        </a>
      </li>
      {sortContacts(contacts).map((contact) => (
        <li key={contact.id}>
          <a
            href={`tel:${contact.phone}`}
            className="flex min-h-12 items-center justify-between rounded-2xl border px-4"
          >
            <span>
              <span className="block font-medium">{contact.label}</span>
              <span className="block text-sm text-muted">{contact.phone}</span>
            </span>
            <span aria-hidden="true">📞</span>
          </a>
        </li>
      ))}
    </ul>
  );
}
