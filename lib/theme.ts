import {
  nextNightBoundary,
  parseNightOverride,
  parseNightSchedule,
  toggleNightOverride,
  type NightOverride,
  type NightSchedule,
  type ThemePref,
} from "@/lib/rules/theme";
import { THEME_NAMES, THEMES, type ThemeName } from "@/lib/ui/tokens";

export type { ThemePref };
export type Theme = ThemeName;

export const THEME_STORAGE_KEY = "be-yeu-theme";
export const NIGHT_SCHEDULE_KEY = "be-yeu-night-schedule";
export const NIGHT_OVERRIDE_KEY = "be-yeu-night-override";

// The status bar takes each theme's page colour; colours live only in lib/ui/tokens.ts.
export const THEME_COLORS = Object.fromEntries(
  THEME_NAMES.map((name) => [name, THEMES[name].bg]),
) as Record<ThemeName, string>;

export const THEME_OPTIONS: { value: ThemePref; label: string }[] = [
  { value: "light", label: "Sáng" },
  { value: "dark", label: "Tối" },
  { value: "system", label: "Tự động" },
];

export function parseThemePref(raw: string | null): ThemePref {
  return raw === "light" || raw === "dark" ? raw : "system";
}

export function resolveTheme(
  pref: ThemePref,
  prefersDark: boolean,
): "light" | "dark" {
  if (pref !== "system") return pref;
  return prefersDark ? "dark" : "light";
}

export type ThemeState = {
  pref: ThemePref;
  schedule: NightSchedule;
  override: NightOverride;
  migrated: boolean;
};

export function readThemeState(
  get: (key: string) => string | null,
  now: Date,
): ThemeState {
  const raw = get(THEME_STORAGE_KEY);
  const schedule = parseNightSchedule(get(NIGHT_SCHEDULE_KEY));
  // Before Ban đêm had a schedule, "night" was a stored theme. Keep it on until the next boundary.
  if (raw === "night")
    return {
      pref: "system",
      schedule,
      override: toggleNightOverride("light", schedule, now),
      migrated: true,
    };
  return {
    pref: parseThemePref(raw),
    schedule,
    override: parseNightOverride(get(NIGHT_OVERRIDE_KEY)),
    migrated: false,
  };
}

// Keeps the boundary helper reachable for callers that only import lib/theme.
export { nextNightBoundary };

// Runs inline in <head> before the first paint, so it cannot import anything.
// Mirrors readThemeState + resolveActiveTheme; lib/theme.test.ts checks they agree.
export const THEME_INIT_SCRIPT = `(function(){var t="light";try{var ls=localStorage,p=ls.getItem("${THEME_STORAGE_KEY}"),dk=window.matchMedia("(prefers-color-scheme: dark)").matches,day=p==="light"||p==="dark"?p:(dk?"dark":"light"),s={enabled:true,start:"21:00",end:"06:00"},hm=/^([01][0-9]|2[0-3]):(00|30)$/;try{var rs=JSON.parse(ls.getItem("${NIGHT_SCHEDULE_KEY}")||"null");if(rs&&typeof rs.enabled==="boolean"&&typeof rs.start==="string"&&typeof rs.end==="string"&&hm.test(rs.start)&&hm.test(rs.end))s=rs;}catch(e){}var o=null;try{o=JSON.parse(ls.getItem("${NIGHT_OVERRIDE_KEY}")||"null");}catch(e){}var now=Date.now(),m=((Math.floor(now/60000)+420)%1440+1440)%1440;function mins(x){return parseInt(x.slice(0,2),10)*60+parseInt(x.slice(3,5),10);}var a=mins(s.start),b=mins(s.end),win=s.enabled&&a!==b&&(a<b?(m>=a&&m<b):(m>=a||m<b)),ou=o&&typeof o.on==="boolean"&&typeof o.until==="string"?Date.parse(o.until):NaN;if(p==="night")t="night";else if(!isNaN(ou)&&now<ou)t=o.on?"night":day;else t=win?"night":day;}catch(e){}document.documentElement.dataset.theme=t;})();`;
