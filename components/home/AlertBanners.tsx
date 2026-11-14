import type { HomeAlert } from "@/lib/rules/alerts";

export function AlertBanners({ alerts }: { alerts: HomeAlert[] }) {
  if (alerts.length === 0) return null;
  return (
    <div className="flex flex-col gap-2">
      {alerts.map((alert) => (
        <div
          key={alert.key}
          role="alert"
          className={`rounded-2xl p-4 ${alert.level === "red" ? "bg-alarm text-on-accent" : "bg-warn-soft text-warn-ink"}`}
        >
          <p className="font-semibold">{alert.message}</p>
          {alert.level === "red" && (
            <a
              href="tel:115"
              className="mt-3 inline-flex min-h-11 items-center rounded-xl bg-surface px-4 font-semibold text-danger"
            >
              Gọi 115
            </a>
          )}
        </div>
      ))}
    </div>
  );
}
