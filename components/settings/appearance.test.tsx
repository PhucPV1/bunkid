import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { findElements } from "@/components/ui/testTree";
import { DEFAULT_NIGHT_SCHEDULE } from "@/lib/rules/theme";
import { lightSwatch } from "@/lib/theme";
import { ICON_PATHS } from "@/lib/ui/icons";
import { AppearanceGroupView, NightHoursSheet } from "./AppearanceGroup";

const base = {
  pref: "system" as const,
  onPref: () => {},
  lightStyle: "rose" as const,
  onLightStyle: () => {},
  schedule: DEFAULT_NIGHT_SCHEDULE,
  onSchedule: () => {},
  onOpenHours: () => {},
};

describe("AppearanceGroupView", () => {
  it("shows the three-way theme control, the night switch and the night hours", () => {
    const html = renderToStaticMarkup(<AppearanceGroupView {...base} />);
    expect(html).toContain(">Giao diện</h2>");
    expect(html).toContain('aria-label="Giao diện"');
    expect(html).toMatch(/aria-pressed="true"[^>]*>Tự động<\/button>/);
    expect(html).toMatch(/aria-pressed="false"[^>]*>Sáng<\/button>/);
    expect(html).toContain('role="switch"');
    expect(html).toContain('aria-checked="true"');
    expect(html).toContain(">Giờ ban đêm</span>");
    expect(html).toContain(">21:00–06:00</span>");
    expect(html).toContain(`d="${ICON_PATHS.moon}"`);
  });

  it("changes theme and toggles the schedule", () => {
    const onPref = vi.fn();
    const onSchedule = vi.fn();
    const tree = AppearanceGroupView({ ...base, onPref, onSchedule });
    const [segmented] = findElements(
      tree,
      (el) => el.props.options !== undefined,
    );
    (segmented.props.onChange as (v: string) => void)("dark");
    expect(onPref).toHaveBeenCalledWith("dark");
    const [nightSwitch] = findElements(
      tree,
      (el) => el.props.checked !== undefined,
    );
    (nightSwitch.props.onChange as (v: boolean) => void)(false);
    expect(onSchedule).toHaveBeenCalledWith({
      ...DEFAULT_NIGHT_SCHEDULE,
      enabled: false,
    });
  });

  it("night hours open a sheet only while the schedule is on", () => {
    const onOpenHours = vi.fn();
    const [row] = findElements(
      AppearanceGroupView({ ...base, onOpenHours }),
      (el) => el.props.label === "Giờ ban đêm",
    );
    (row.props.onClick as () => void)();
    expect(onOpenHours).toHaveBeenCalledOnce();
    const off = { ...DEFAULT_NIGHT_SCHEDULE, enabled: false };
    const [locked] = findElements(
      AppearanceGroupView({ ...base, schedule: off }),
      (el) => el.props.label === "Giờ ban đêm",
    );
    expect(locked.props.onClick).toBeUndefined();
  });

  it("has a Nền sáng row of five swatches right under the theme control", () => {
    const html = renderToStaticMarkup(<AppearanceGroupView {...base} />);
    expect(html).toContain(">Nền sáng</p>");
    expect(html).toContain('aria-label="Nền sáng"');
    for (const label of ["Trắng", "Hồng dịu", "Đào mơ", "Oải hương", "Biển sương"])
      expect(html).toContain(`>${label}</span>`);
    // No hex here: lib/themeGuard.test.ts scans every .tsx under components/, tests included.
    expect(html).toContain(lightSwatch("rose"));
    expect(html.indexOf('aria-label="Giao diện"')).toBeLessThan(
      html.indexOf('aria-label="Nền sáng"'),
    );
    expect(html.indexOf('aria-label="Nền sáng"')).toBeLessThan(
      html.indexOf(">Giờ ban đêm</span>"),
    );

    const onLightStyle = vi.fn();
    const swatches = findElements(
      AppearanceGroupView({ ...base, onLightStyle }),
      (el) => el.props.onSelect !== undefined,
    );
    expect(swatches.map((el) => el.props.label)).toEqual([
      "Trắng",
      "Hồng dịu",
      "Đào mơ",
      "Oải hương",
      "Biển sương",
    ]);
    expect(swatches.map((el) => el.props.selected)).toEqual([
      false,
      true,
      false,
      false,
      false,
    ]);
    (swatches[4].props.onSelect as () => void)();
    expect(onLightStyle).toHaveBeenCalledWith("sea");
  });
});

describe("NightHoursSheet", () => {
  it("picks start and end in 30-minute steps", () => {
    const html = renderToStaticMarkup(
      <NightHoursSheet
        open
        onClose={() => {}}
        schedule={DEFAULT_NIGHT_SCHEDULE}
        onSchedule={() => {}}
      />,
    );
    expect(html).toContain(">Giờ ban đêm</h2>");
    expect(html.match(/<select/g)).toHaveLength(2);
    expect(html.match(/<option/g)).toHaveLength(96);
    expect(html).toContain('<option value="21:00" selected="">21:00</option>');
    expect(html).toContain('<option value="06:00" selected="">06:00</option>');
    expect(html).toContain(">Bắt đầu");
    expect(html).toContain(">Kết thúc");
  });
});
