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
  solids: { token: "cat-bottle", icon: "bowl", label: "Ăn dặm" },
  water: { token: "cat-pump", icon: "glass", label: "Uống nước" },
  bath: { token: "cat-diaper", icon: "bath", label: "Tắm" },
  note: { token: "cat-tummy", icon: "doc", label: "Ghi chú" },
  symptom: { token: "cat-med", icon: "pulse", label: "Triệu chứng" },
};

// A log type this build does not know (written by a newer release while this
// phone still runs the old bundle) gets a neutral look instead of a crash.
const UNKNOWN_CATEGORY: (typeof CATEGORIES)[LogType] = {
  token: "cat-med",
  icon: "doc",
  label: "Bản ghi",
};

export function categoryOf(type: string): (typeof CATEGORIES)[LogType] {
  return Object.hasOwn(CATEGORIES, type)
    ? CATEGORIES[type as LogType]
    : UNKNOWN_CATEGORY;
}

// Chip behind a category icon: the category colour at 15% under the icon in full colour.
export const CATEGORY_CHIP: Record<CategoryToken, string> = {
  "cat-feed": "bg-cat-feed/15 text-cat-feed",
  "cat-bottle": "bg-cat-bottle/15 text-cat-bottle",
  "cat-sleep": "bg-cat-sleep/15 text-cat-sleep",
  "cat-diaper": "bg-cat-diaper/15 text-cat-diaper",
  "cat-pump": "bg-cat-pump/15 text-cat-pump",
  "cat-tummy": "bg-cat-tummy/15 text-cat-tummy",
  "cat-med": "bg-cat-med/15 text-cat-med",
  "cat-temp": "bg-cat-temp/15 text-cat-temp",
};

// Circle of a running timer: the category colour, solid, inside a 30% halo.
export const CATEGORY_RUNNING: Record<CategoryToken, string> = {
  "cat-feed": "bg-cat-feed ring-4 ring-cat-feed/30",
  "cat-bottle": "bg-cat-bottle ring-4 ring-cat-bottle/30",
  "cat-sleep": "bg-cat-sleep ring-4 ring-cat-sleep/30",
  "cat-diaper": "bg-cat-diaper ring-4 ring-cat-diaper/30",
  "cat-pump": "bg-cat-pump ring-4 ring-cat-pump/30",
  "cat-tummy": "bg-cat-tummy ring-4 ring-cat-tummy/30",
  "cat-med": "bg-cat-med ring-4 ring-cat-med/30",
  "cat-temp": "bg-cat-temp ring-4 ring-cat-temp/30",
};

// The same solid circle without the halo, under an icon in the page colour.
export const CATEGORY_SOLID: Record<CategoryToken, string> = {
  "cat-feed": "bg-cat-feed text-bg",
  "cat-bottle": "bg-cat-bottle text-bg",
  "cat-sleep": "bg-cat-sleep text-bg",
  "cat-diaper": "bg-cat-diaper text-bg",
  "cat-pump": "bg-cat-pump text-bg",
  "cat-tummy": "bg-cat-tummy text-bg",
  "cat-med": "bg-cat-med text-bg",
  "cat-temp": "bg-cat-temp text-bg",
};

// Only the icon takes the category colour, e.g. on a glass circle.
export const CATEGORY_TEXT: Record<CategoryToken, string> = {
  "cat-feed": "text-cat-feed",
  "cat-bottle": "text-cat-bottle",
  "cat-sleep": "text-cat-sleep",
  "cat-diaper": "text-cat-diaper",
  "cat-pump": "text-cat-pump",
  "cat-tummy": "text-cat-tummy",
  "cat-med": "text-cat-med",
  "cat-temp": "text-cat-temp",
};
