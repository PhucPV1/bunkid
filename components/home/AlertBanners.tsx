import Link from "next/link";
import { Glass } from "@/components/ui/Glass";
import { Icon } from "@/components/ui/Icon";
import type { HomeAlert } from "@/lib/rules/alerts";

const PILL =
  "inline-flex min-h-11 items-center gap-1.5 rounded-full px-4 text-[15px] font-semibold transition-transform duration-[120ms] active:scale-[0.97]";

export function AlertBanners({ alerts }: { alerts: HomeAlert[] }) {
  if (alerts.length === 0) return null;
  return (
    <div className="flex flex-col gap-2.5">
      {alerts.map((alert) =>
        alert.level === "red" ? (
          <div
            key={alert.key}
            role="alert"
            className="rounded-[28px] bg-danger-solid p-4 text-on-danger"
          >
            <p className="text-base font-semibold">{alert.message}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <a href="tel:115" className={`${PILL} bg-bg text-danger`}>
                <Icon name="phone" size={18} />
                Gọi 115
              </a>
              {/* Spec §7.4 (spec gốc): red banners also open symptom triage. */}
              <Link
                href="/trieu-chung"
                className={`${PILL} border border-on-danger`}
              >
                Phân loại triệu chứng
              </Link>
            </div>
          </div>
        ) : (
          <Glass
            key={alert.key}
            role="alert"
            className="border-warn! p-4 text-warn-ink"
          >
            <p className="text-base font-semibold">{alert.message}</p>
            {alert.key === "fever" && (
              <Link
                href="/trieu-chung"
                className={`${PILL} mt-3 border border-warn`}
              >
                Phân loại triệu chứng
              </Link>
            )}
          </Glass>
        ),
      )}
    </div>
  );
}
