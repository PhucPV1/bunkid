import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { SyncBarView } from "@/components/sync/SyncBar";
import { findElements } from "@/components/ui/testTree";
import type { HomeAlert } from "@/lib/rules/alerts";
import { ICON_PATHS } from "@/lib/ui/icons";
import { AlertBanners, type BannerInvite } from "./AlertBanners";

const red: HomeAlert = {
  key: "few-wet",
  level: "red",
  message: "Rất ít tã ướt",
};
const fever: HomeAlert = {
  key: "fever",
  level: "yellow",
  message: "Bé sốt nhẹ",
};
const pale: HomeAlert = {
  key: "stool-pale",
  level: "yellow",
  message: "Phân bạc màu",
};

describe("AlertBanners", () => {
  it("red: solid danger card with Gọi 115 and triage", () => {
    const html = renderToStaticMarkup(<AlertBanners alerts={[red]} />);
    expect(html).toContain('role="alert"');
    expect(html).toContain("rounded-[28px] bg-danger-solid");
    expect(html).toContain("text-on-danger");
    expect(html).toContain('href="tel:115"');
    expect(html).toContain("bg-bg");
    expect(html).toContain("text-danger");
    expect(html).toContain(`d="${ICON_PATHS.phone}"`);
    expect(html).toContain("Gọi 115</a>");
    expect(html).toContain("border-on-danger");
    expect(html).toContain('href="/trieu-chung"');
  });

  it("yellow: glass card with a warn border; triage only for fever", () => {
    const html = renderToStaticMarkup(<AlertBanners alerts={[fever, pale]} />);
    expect(html.match(/border-warn!/g)).toHaveLength(2);
    expect(html).toContain("text-warn-ink");
    expect(html).toContain(">Bé sốt nhẹ</p>");
    expect(html.match(/href="\/trieu-chung"/g)).toHaveLength(1);
    expect(html).not.toContain("tel:115");
  });

  it("renders nothing without alerts", () => {
    expect(renderToStaticMarkup(<AlertBanners alerts={[]} />)).toBe("");
  });
});

// Spec 2026-11-26 §7.2: the invite to start an illness episode, inside the
// fever banner, after what the banner already says and offers.
describe("AlertBanners with the invite", () => {
  const QUESTION =
    "Mở một đợt ốm để gom nhiệt độ, thuốc và triệu chứng vào một chỗ?";
  const feverHigh: HomeAlert = {
    key: "fever-high",
    level: "red",
    message: "Sốt rất cao: cần đi khám ngay.",
  };
  const invite = (alertKey: string, over: Partial<BannerInvite> = {}) => ({
    alertKey,
    busy: false,
    onStart: () => {},
    onDismiss: () => {},
    ...over,
  });
  const render = (alerts: HomeAlert[], value: BannerInvite | null) =>
    renderToStaticMarkup(<AlertBanners alerts={alerts} invite={value} />);
  // The banner (a direct child of the list) that holds a text.
  const bannerWith = (html: string, text: string) =>
    html
      .split('role="alert"')
      .slice(1)
      .find((part) => part.includes(text)) ?? "";

  it("yellow: the question and two buttons after Phân loại triệu chứng", () => {
    const html = render([fever, pale], invite("fever"));
    const banner = bannerWith(html, ">Bé sốt nhẹ</p>");
    const order = [
      ">Bé sốt nhẹ</p>",
      ">Phân loại triệu chứng</a>",
      `>${QUESTION}</p>`,
      ">Bắt đầu đợt ốm</button>",
      ">Không</button>",
    ].map((mark) => banner.indexOf(mark));
    expect(order.every((index) => index > -1)).toBe(true);
    expect(order).toEqual([...order].sort((a, b) => a - b));
    expect(banner).toMatch(/<button[^>]*min-h-11[^>]*border-warn[^>]*>Bắt đầu/);
    // Only in the banner it rides on.
    expect(html.match(/Bắt đầu đợt ốm/g)).toHaveLength(1);
    expect(bannerWith(html, ">Phân bạc màu</p>")).not.toContain(QUESTION);
  });

  it("red: after Gọi 115 and Phân loại triệu chứng, in the banner's own colours", () => {
    const html = render([feverHigh, red], invite("fever-high"));
    const banner = bannerWith(html, "Sốt rất cao");
    expect(banner.indexOf("Gọi 115</a>")).toBeLessThan(
      banner.indexOf(QUESTION),
    );
    expect(banner.indexOf(">Phân loại triệu chứng</a>")).toBeLessThan(
      banner.indexOf(QUESTION),
    );
    expect(banner).toMatch(
      /<button[^>]*min-h-11[^>]*border-on-danger[^>]*>Bắt đầu đợt ốm/,
    );
    expect(banner).toMatch(/<button[^>]*border-on-danger[^>]*>Không/);
    expect(bannerWith(html, "Rất ít tã ướt")).not.toContain(QUESTION);
  });

  it("the banners are unchanged without the invite", () => {
    expect(render([fever, feverHigh], null)).toBe(
      renderToStaticMarkup(<AlertBanners alerts={[fever, feverHigh]} />),
    );
    expect(render([fever], null)).not.toContain(QUESTION);
    // An invite for a banner that is not shown shows nowhere.
    expect(render([pale], invite("fever"))).not.toContain(QUESTION);
  });

  it("each button reports its tap; Bắt đầu đợt ốm waits while the episode is on its way", () => {
    const onStart = vi.fn();
    const onDismiss = vi.fn();
    // The invite is its own small component inside the banner: draw it too.
    const [part] = findElements(
      AlertBanners({
        alerts: [fever],
        invite: invite("fever", { onStart, onDismiss }),
      }),
      (el) => "invite" in el.props && typeof el.type === "function",
    );
    const draw = part.type as (props: typeof part.props) => ReactNode;
    const buttons = findElements(
      draw(part.props),
      (el) => el.type === "button",
    );
    expect(buttons.map((button) => button.props.children)).toEqual([
      "Bắt đầu đợt ốm",
      "Không",
    ]);
    for (const button of buttons) (button.props.onClick as () => void)();
    expect(onStart).toHaveBeenCalledOnce();
    expect(onDismiss).toHaveBeenCalledOnce();
    expect(render([fever], invite("fever", { busy: true }))).toMatch(
      /<button[^>]*disabled=""[^>]*>Bắt đầu đợt ốm</,
    );
  });
});

describe("SyncBarView", () => {
  it("is a small glass pill with a clock, no emoji", () => {
    const html = renderToStaticMarkup(<SyncBarView count={3} dropped={null} />);
    expect(html).toContain(">3 mục chờ đồng bộ</span>");
    expect(html).toContain("glass");
    expect(html).toContain("rounded-full");
    expect(html).toContain(`d="${ICON_PATHS.clock}"`);
    expect(html).not.toContain("⏳");
  });

  it("shows a refused write, and nothing when all is synced", () => {
    expect(
      renderToStaticMarkup(<SyncBarView count={0} dropped="hết quyền" />),
    ).toContain("Không lưu được: hết quyền.");
    expect(renderToStaticMarkup(<SyncBarView count={0} dropped={null} />)).toBe(
      "",
    );
  });
});
