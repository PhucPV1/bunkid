import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { SyncBarView } from "@/components/sync/SyncBar";
import type { HomeAlert } from "@/lib/rules/alerts";
import { ICON_PATHS } from "@/lib/ui/icons";
import { AlertBanners } from "./AlertBanners";

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
