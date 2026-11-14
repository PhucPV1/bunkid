import Link from "next/link";
import type { MenuItem } from "@/lib/nav";

export function MenuScreen({
  title,
  items,
}: {
  title: string;
  items: MenuItem[];
}) {
  return (
    <main className="mx-auto flex max-w-md flex-col gap-4 p-4">
      <h1 className="text-2xl font-semibold">{title}</h1>
      <ul className="divide-y rounded-2xl border">
        {items.map((item) => (
          <li key={item.label}>
            {item.href ? (
              <Link
                href={item.href}
                className="flex min-h-12 items-center justify-between px-4"
              >
                {item.label}
                <span aria-hidden="true">›</span>
              </Link>
            ) : (
              <span className="flex min-h-12 items-center justify-between px-4 text-muted">
                {item.label}
                <span className="text-sm">Sắp có</span>
              </span>
            )}
          </li>
        ))}
      </ul>
    </main>
  );
}
