import { NavCard } from "@/components/ui/NavCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { TOOLS } from "@/lib/nav";

// Spec 2026-11-25 §3.5: the Tiện ích tab.
export function ToolsScreen() {
  return (
    <main className="mx-auto flex max-w-md flex-col gap-[22px] px-4 pt-2">
      <PageHeader title="Tiện ích" />
      <div className="grid grid-cols-2 gap-2.5">
        {TOOLS.map((item) => (
          <NavCard key={item.href} item={item} />
        ))}
      </div>
    </main>
  );
}
