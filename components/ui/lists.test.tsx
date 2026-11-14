import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { ICON_PATHS } from "@/lib/ui/icons";
import { ListGroup, ListRow } from "./ListGroup";
import { Skeleton } from "./Skeleton";
import { StatTile } from "./StatTile";
import { Switch } from "./Switch";
import { hostElements } from "./testTree";

describe("ListGroup", () => {
  it("is a glass list under an optional small uppercase title", () => {
    const html = renderToStaticMarkup(
      <ListGroup title="Gia đình">
        <ListRow label="Thành viên" />
      </ListGroup>,
    );
    expect(html).toContain(">Gia đình</h2>");
    expect(html).toContain("uppercase");
    expect(html).toContain('<ul class="glass overflow-hidden rounded-[22px]">');
    expect(renderToStaticMarkup(<ListGroup>x</ListGroup>)).not.toContain("<h2");
  });
});

describe("ListRow", () => {
  it("a link row has an icon chip, value and chevron", () => {
    const html = renderToStaticMarkup(
      <ListRow
        label="Thành viên"
        value="3 người"
        icon="users"
        iconColor="cat-sleep"
        href="/cai-dat/thanh-vien"
      />,
    );
    expect(html).toContain('href="/cai-dat/thanh-vien"');
    expect(html).toContain("bg-cat-sleep");
    expect(html).toContain("size-[30px]");
    expect(html).toContain(`d="${ICON_PATHS.users}"`);
    expect(html).toContain(">3 người</span>");
    expect(html).toContain(`d="${ICON_PATHS.chevronRight}"`);
    expect(html).toContain("min-h-[52px]");
  });

  it("a row with a switch shows no chevron and no link", () => {
    const html = renderToStaticMarkup(
      <ListRow
        label="Nhắc cữ bú"
        trailing={<Switch checked label="Nhắc cữ bú" onChange={() => {}} />}
      />,
    );
    expect(html).toContain('role="switch"');
    expect(html).not.toContain(ICON_PATHS.chevronRight);
    expect(html).not.toContain("<a ");
    expect(html).not.toContain('<button type="button" class="flex min-h');
  });

  it("an action row is a button with a detail line", () => {
    const onClick = vi.fn();
    const html = renderToStaticMarkup(
      <ListRow label="Tạm tắt nhắc" detail="Không" onClick={onClick} />,
    );
    expect(html).toContain(">Không</span>");
    expect(html).toContain(ICON_PATHS.chevronRight);
    const [button] = hostElements(ListRow({ label: "x", onClick }), "button");
    (button.props.onClick as () => void)();
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("chevron can be turned off", () => {
    expect(
      renderToStaticMarkup(<ListRow label="x" href="/a" chevron={false} />),
    ).not.toContain(ICON_PATHS.chevronRight);
  });
});

describe("StatTile", () => {
  it("shows label, value with tabular numbers, and a toned note", () => {
    const html = renderToStaticMarkup(
      <StatTile label="Tã ướt" value="6" note="Đủ nước" tone="good" />,
    );
    expect(html).toContain("glass rounded-[24px]");
    expect(html).toContain(">Tã ướt</span>");
    expect(html).toContain("tabular-nums");
    expect(html).toContain(">6</span>");
    expect(html).toContain("text-good");
    expect(
      renderToStaticMarkup(<StatTile label="a" value="1" />),
    ).not.toContain("text-[11px]");
  });
});

describe("Skeleton", () => {
  it("is a hidden pulsing placeholder that stops with reduced motion", () => {
    const html = renderToStaticMarkup(<Skeleton className="h-20" />);
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain("animate-[kb-pulse_1.4s_ease-in-out_infinite]");
    expect(html).toContain("motion-reduce:animate-none");
    expect(html).toContain("bg-line");
    expect(html).toContain("h-20");
  });
});
