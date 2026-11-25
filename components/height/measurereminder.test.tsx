import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { findElements } from "@/components/ui/testTree";
import { ICON_PATHS } from "@/lib/ui/icons";
import {
  MeasureReminderRow,
  MeasureReminderRowView,
} from "./MeasureReminderRow";

const state = vi.hoisted(() => ({
  prefs: {} as Record<string, unknown>,
  save: {} as Record<string, unknown>,
}));
const useNotificationPrefs = vi.hoisted(() => vi.fn());
const useSavePrefs = vi.hoisted(() => vi.fn());
const mutate = vi.hoisted(() => vi.fn());

vi.mock("@/lib/data/notificationPrefs", () => ({
  DEFAULT_PREFS: { growth_measure: true },
  useNotificationPrefs,
  useSavePrefs,
}));

const REMINDER = {
  title: "Nhắc đo mỗi tháng",
  detail: "Lần tới 15/12 · 08:00",
};
const view = (
  over: Partial<Parameters<typeof MeasureReminderRowView>[0]> = {},
) => ({
  reminder: REMINDER,
  checked: true,
  disabled: false,
  onChange: () => {},
  ...over,
});
const IDLE = { mutate, isPending: false, isError: false, error: null };

beforeEach(() => {
  mutate.mockClear();
  useNotificationPrefs.mockImplementation(() => state.prefs);
  useSavePrefs.mockImplementation(() => state.save);
  state.prefs = { data: { growth_measure: true }, isSuccess: true };
  state.save = IDLE;
});

// Spec 2026-11-25 §8.3.
describe("MeasureReminderRowView", () => {
  it("a glass row: a bell in an accent-tinted circle, the name, the next day, the switch", () => {
    const html = renderToStaticMarkup(<MeasureReminderRowView {...view()} />);
    expect(html).toContain("glass");
    expect(html).toContain("rounded-[26px]");
    expect(html).toContain("size-9");
    expect(html).toContain("bg-accent-tint");
    expect(html).toContain(`d="${ICON_PATHS.bell}"`);
    expect(html).toContain(">Nhắc đo mỗi tháng</span>");
    expect(html).toContain(">Lần tới 15/12 · 08:00</span>");
    expect(html).toContain('role="switch"');
    expect(html).toContain('aria-checked="true"');
    expect(html).toContain('aria-label="Nhắc đo định kỳ"');
  });

  it("shows the switch off and locked as told", () => {
    const html = renderToStaticMarkup(
      <MeasureReminderRowView {...view({ checked: false, disabled: true })} />,
    );
    expect(html).toContain('aria-checked="false"');
    expect(html).toContain('disabled=""');
  });

  it("hands a change of the switch on", () => {
    const onChange = vi.fn();
    const [toggle] = findElements(
      MeasureReminderRowView(view({ onChange })),
      (el) => el.props.checked !== undefined,
    );
    (toggle.props.onChange as (v: boolean) => void)(false);
    expect(onChange).toHaveBeenCalledWith(false);
  });
});

describe("MeasureReminderRow", () => {
  const render = () =>
    renderToStaticMarkup(
      <MeasureReminderRow userId="u1" reminder={REMINDER} />,
    );
  const toggle = () =>
    findElements(
      MeasureReminderRow({ userId: "u1", reminder: REMINDER }),
      (el) => el.props.checked !== undefined,
    )[0];

  it("shows the viewer's own Nhắc đo định kỳ preference", () => {
    expect(render()).toContain('aria-checked="true"');
    expect(useNotificationPrefs).toHaveBeenCalledWith("u1");
    expect(useSavePrefs).toHaveBeenCalledWith("u1");
    state.prefs = { data: { growth_measure: false }, isSuccess: true };
    expect(render()).toContain('aria-checked="false"');
  });

  it("saves the switch through the notification preferences", () => {
    (toggle().props.onChange as (v: boolean) => void)(false);
    expect(mutate).toHaveBeenCalledExactlyOnceWith({ growth_measure: false });
  });

  it("is locked until the preferences have loaded, and while a change is being saved", () => {
    state.prefs = { data: undefined, isSuccess: false };
    const loading = render();
    expect(loading).toContain('aria-checked="true"');
    expect(loading).toContain('disabled=""');
    state.prefs = { data: { growth_measure: true }, isSuccess: true };
    state.save = { ...IDLE, isPending: true };
    expect(render()).toContain('disabled=""');
    state.save = IDLE;
    expect(render()).not.toContain('disabled=""');
  });

  it("says why when the change could not be saved, or the preference could not be loaded", () => {
    expect(render()).not.toContain('role="alert"');
    state.save = { ...IDLE, isError: true, error: new Error("boom") };
    expect(render()).toContain('role="alert"');
    state.save = IDLE;
    state.prefs = {
      data: undefined,
      isSuccess: false,
      isError: true,
      error: new Error("boom"),
    };
    const failed = render();
    expect(failed).toContain('role="alert"');
    expect(failed).toContain('disabled=""');
  });
});
