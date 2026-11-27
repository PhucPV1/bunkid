import Link from "next/link";
import { Glass } from "@/components/ui/Glass";
import { Icon } from "@/components/ui/Icon";
import type { HomeAlert } from "@/lib/rules/alerts";

const PILL =
  "inline-flex min-h-11 items-center gap-1.5 rounded-full px-4 text-[15px] font-semibold transition-transform duration-[120ms] active:scale-[0.97]";

// Spec 2026-11-26 §5.5 and §7.2: the invite to start an illness episode, on
// the fever banner whose key is `alertKey` (inviteAlert).
export type BannerInvite = {
  alertKey: string;
  // "Bắt đầu đợt ốm" is on its way.
  busy: boolean;
  onStart: () => void;
  onDismiss: () => void;
};

// Spec §7.2: after the banner's own words and buttons, which stay first. The
// buttons take the banner's border colour, so neither outranks the banner's
// own buttons.
function Invite({ invite, border }: { invite: BannerInvite; border: string }) {
  return (
    <>
      <p className="mt-3 text-[15px] leading-5">
        Mở một đợt ốm để gom nhiệt độ, thuốc và triệu chứng vào một chỗ?
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={invite.busy}
          onClick={invite.onStart}
          className={`${PILL} border ${border} disabled:opacity-50`}
        >
          Bắt đầu đợt ốm
        </button>
        <button
          type="button"
          onClick={invite.onDismiss}
          className={`${PILL} border ${border}`}
        >
          Không
        </button>
      </div>
    </>
  );
}

export function AlertBanners({
  alerts,
  invite = null,
}: {
  alerts: HomeAlert[];
  invite?: BannerInvite | null;
}) {
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
            {invite?.alertKey === alert.key && (
              <Invite invite={invite} border="border-on-danger" />
            )}
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
            {invite?.alertKey === alert.key && (
              <Invite invite={invite} border="border-warn" />
            )}
          </Glass>
        ),
      )}
    </div>
  );
}
