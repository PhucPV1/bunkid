import type { LogType } from "@/lib/rules/logDetails";
import type { IconName } from "./icons";
import type { TokenName } from "./tokens";

export type CategoryToken = Extract<TokenName, `cat-${string}`>;

export const CATEGORIES: Record<
  LogType,
  { token: CategoryToken; icon: IconName; label: string }
> = {
  breast: { token: "cat-feed", icon: "heart", label: "Bú mẹ" },
  bottle: { token: "cat-bottle", icon: "bottle", label: "Bú bình" },
  sleep: { token: "cat-sleep", icon: "moon", label: "Ngủ" },
  diaper: { token: "cat-diaper", icon: "drop", label: "Thay tã" },
  pump: { token: "cat-pump", icon: "cup", label: "Hút sữa" },
  tummy: { token: "cat-tummy", icon: "smile", label: "Nằm sấp" },
  medicine: { token: "cat-med", icon: "pill", label: "Thuốc" },
  temperature: { token: "cat-temp", icon: "thermo", label: "Nhiệt độ" },
};
