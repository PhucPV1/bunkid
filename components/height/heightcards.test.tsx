import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { findElements } from "@/components/ui/testTree";
import { rangeBar, type HeightView } from "@/lib/rules/heightView";
import { ICON_PATHS } from "@/lib/ui/icons";
import {
  HeightGoalCard,
  HeightGoalLink,
  ParentalRangeCard,
  TargetPathCard,
  VelocityCard,
} from "./HeightCards";

const CHIP = "font-semibold whitespace-nowrap";

// Spec 2026-11-25 §6.3, item 2.
describe("HeightGoalCard", () => {
  const goal: NonNullable<HeightView["goal"]> = {
    target: "180",
    chip: { text: "Đang đúng hướng", tone: "good" },
    sentence: "Bun dài 61,5 cm lúc 2 tháng 15 ngày. Sát đường mục tiêu.",
  };

  it("the label, the status chip, the target in large figures and the sentence", () => {
    const html = renderToStaticMarkup(<HeightGoalCard goal={goal} isOwner />);
    expect(html).toContain(">Mục tiêu lúc trưởng thành</span>");
    expect(html).toContain("uppercase");
    expect(html).toContain(
      `${CHIP} bg-good-soft text-good-ink">Đang đúng hướng</span>`,
    );
    expect(html).toContain(
      '<span class="text-[44px] leading-[48px] font-bold tracking-[-0.02em] text-ink tabular-nums">180</span>',
    );
    expect(html).toContain(">cm</span>");
    expect(html).toContain(
      ">Bun dài 61,5 cm lúc 2 tháng 15 ngày. Sát đường mục tiêu.</p>",
    );
  });

  // At 375 px the label and a chip such as "Dưới đường mục tiêu" do not fit
  // on one line: the label wrapped onto two.
  // The longest pair, "190,5 cm" and "Dưới đường mục tiêu", is close to the
  // width of the card: the row wraps, so the chip can never run past its edge.
  it("the label has a line to itself; the chip sits on the line of the figure", () => {
    const html = renderToStaticMarkup(<HeightGoalCard goal={goal} isOwner />);
    expect(html).toContain(
      '>Mục tiêu lúc trưởng thành</span><div class="flex flex-wrap items-center justify-between gap-x-2 gap-y-1"><span class="flex items-baseline gap-2">',
    );
    expect(html.indexOf("Đang đúng hướng")).toBeGreaterThan(
      html.indexOf(">cm</span>"),
    );
    expect(html.indexOf("Đang đúng hướng")).toBeLessThan(html.indexOf("<p"));
  });

  it("below the line is said in a neutral chip, never in warn or danger", () => {
    const html = renderToStaticMarkup(
      <HeightGoalCard
        goal={{
          ...goal,
          chip: { text: "Dưới đường mục tiêu", tone: "neutral" },
        }}
        isOwner
      />,
    );
    expect(html).toContain(
      `${CHIP} bg-line text-ink">Dưới đường mục tiêu</span>`,
    );
    expect(html).not.toMatch(/warn|danger/);
  });

  it("no length yet: no chip", () => {
    const html = renderToStaticMarkup(
      <HeightGoalCard
        goal={{ ...goal, chip: null, sentence: "Chưa có lần đo chiều dài." }}
        isOwner
      />,
    );
    expect(html).not.toContain(CHIP);
    expect(html).toContain(">Chưa có lần đo chiều dài.</p>");
  });

  it("no goal, the owner: says so and offers to set one", () => {
    const onSet = vi.fn();
    const card = HeightGoalCard({ goal: null, isOwner: true, onSet });
    const html = renderToStaticMarkup(card);
    expect(html).toContain(">Chưa có mục tiêu chiều cao</p>");
    expect(html).toContain(">Đặt mục tiêu</button>");
    expect(html).not.toContain("Chủ gia đình");
    const [button] = findElements(card, (el) => el.props.onClick === onSet);
    expect(button).toBeDefined();
  });

  it("no goal, the owner, before the sheet exists: no button", () => {
    const html = renderToStaticMarkup(<HeightGoalCard goal={null} isOwner />);
    expect(html).toContain(">Chưa có mục tiêu chiều cao</p>");
    expect(html).not.toContain("<button");
  });

  it("no goal, another member: told that the owner has not set one", () => {
    const html = renderToStaticMarkup(
      <HeightGoalCard goal={null} isOwner={false} onSet={() => {}} />,
    );
    expect(html).toContain(">Chủ gia đình chưa đặt mục tiêu chiều cao.</p>");
    expect(html).not.toContain("<button");
  });
});

// Item 3.
describe("ParentalRangeCard", () => {
  const range = { mid: 174.5, low: 166, high: 183 };
  const parents = (
    target: number | null,
  ): NonNullable<HeightView["parents"]> => ({
    line: "Bố 172 cm · Mẹ 164 cm",
    bar: rangeBar(range, target),
    sentence:
      target === null
        ? "Khoảng dự kiến 166–183 cm."
        : "Khoảng dự kiến 166–183 cm. Mục tiêu 180 cm nằm trong khoảng, ở nửa trên.",
  });

  it("the parents' heights, the bar with its three numbers and the target, the two sentences", () => {
    const html = renderToStaticMarkup(
      <ParentalRangeCard parents={parents(180)} />,
    );
    expect(html).toContain(">Di truyền dự kiến</h2>");
    expect(html).toContain(">Bố 172 cm · Mẹ 164 cm</span>");
    expect(html).toContain(
      'role="img" aria-label="Khoảng dự kiến từ 166 đến 183 cm, giữa là 174,5 cm, mục tiêu 180 cm."',
    );
    for (const text of ["166", "174,5", "183", "Mục tiêu 180"])
      expect(html).toContain(`>${text}</span>`);
    expect(html).toContain(
      ">Khoảng dự kiến 166–183 cm. Mục tiêu 180 cm nằm trong khoảng, ở nửa trên.</p>",
    );
    expect(html).toContain(
      ">Tính từ chiều cao bố mẹ. Đây là ước lượng, phần lớn trẻ nằm trong khoảng này.</p>",
    );
  });

  it("the range is a good-coloured stretch from its low end to its high end, the middle a mark", () => {
    const html = renderToStaticMarkup(
      <ParentalRangeCard parents={parents(180)} />,
    );
    expect(html).toMatch(
      /class="absolute top-9 h-3 rounded-full bg-good\/35" style="left:20%;width:56\.66666666666\d*%"/,
    );
    expect(html).toMatch(/bg-good" style="left:48\.3333333333\d*%"/);
  });

  it("the target is an accent mark with its label, kept inside the card at either end", () => {
    const html = renderToStaticMarkup(
      <ParentalRangeCard parents={parents(200)} />,
    );
    expect(html).toContain(">Mục tiêu 200</span>");
    expect(html).toContain("bg-accent");
    expect(html).toContain('style="left:clamp(60px, 100%, calc(100% - 60px))"');
  });

  it("without a target: no accent mark and no label", () => {
    const html = renderToStaticMarkup(
      <ParentalRangeCard parents={parents(null)} />,
    );
    expect(html).not.toContain("Mục tiêu");
    expect(html).not.toContain("bg-accent");
  });

  it("before the parents' heights are entered: one line asking for them", () => {
    const html = renderToStaticMarkup(<ParentalRangeCard parents={null} />);
    expect(html).toContain(">Di truyền dự kiến</h2>");
    expect(html).toContain(">Nhập chiều cao bố mẹ để xem khoảng dự kiến.</p>");
    expect(html).not.toContain('role="img"');
    expect(html).not.toContain("Tính từ chiều cao bố mẹ");
  });
});

// Item 4.
describe("TargetPathCard", () => {
  const html = renderToStaticMarkup(
    <TargetPathCard
      title="Đường tới 180 cm"
      babyName="Bun"
      note="Đường mục tiêu là chiều dài ở từng tháng tuổi của một bé trai sẽ cao 180 cm khi lớn."
    >
      <div data-chart="" />
    </TargetPathCard>,
  );

  it("the title, the chart and the note", () => {
    expect(html).toContain(">Đường tới 180 cm</h2>");
    expect(html).toContain('<div data-chart=""></div>');
    expect(html).toContain(
      ">Đường mục tiêu là chiều dài ở từng tháng tuổi của một bé trai sẽ cao 180 cm khi lớn.</p>",
    );
    expect(html.indexOf("data-chart")).toBeGreaterThan(html.indexOf("</h2>"));
  });

  it("a legend of three: the baby, the target line in the sleep colour, the normal band; no median", () => {
    expect(html).toContain(
      '<span class="size-2.5 rounded-full bg-accent"></span>Bun',
    );
    expect(html).toContain(
      '<span class="w-4 border-t-2 border-dashed border-cat-sleep"></span>Đường mục tiêu',
    );
    expect(html).toContain(
      '<span class="h-2.5 w-3.5 rounded-[3px] bg-good/25"></span>Vùng bình thường',
    );
    expect(html).not.toContain("Mức giữa");
  });
});

// Item 5.
describe("VelocityCard", () => {
  it("the label, the chip, the speed and the line under it", () => {
    const html = renderToStaticMarkup(
      <VelocityCard
        velocity={{
          rate: "4,2 cm mỗi tháng",
          line: "Từ 10/10 đến 25/11 · bé cùng tuổi thường tăng khoảng 3,6 cm mỗi tháng",
          chip: { text: "Tăng tốt", tone: "good" },
        }}
      />,
    );
    expect(html).toContain(">Tốc độ tăng</span>");
    expect(html).toContain(
      `${CHIP} bg-good-soft text-good-ink">Tăng tốt</span>`,
    );
    expect(html).toContain(
      '<span class="text-xl leading-[26px] font-bold text-ink tabular-nums">4,2 cm mỗi tháng</span>',
    );
    expect(html).toContain(
      ">Từ 10/10 đến 25/11 · bé cùng tuổi thường tăng khoảng 3,6 cm mỗi tháng</span>",
    );
  });

  it("slower than usual is a neutral chip", () => {
    const html = renderToStaticMarkup(
      <VelocityCard
        velocity={{
          rate: "2,7 cm mỗi tháng",
          line: "Từ 10/02 đến 26/02 · bé cùng tuổi thường tăng khoảng 3,8 cm mỗi tháng",
          chip: { text: "Chậm hơn thường gặp", tone: "neutral" },
        }}
      />,
    );
    expect(html).toContain(
      `${CHIP} bg-line text-ink">Chậm hơn thường gặp</span>`,
    );
    expect(html).not.toMatch(/warn|danger/);
  });

  it("without two lengths far enough apart: says what is needed", () => {
    const html = renderToStaticMarkup(<VelocityCard velocity={null} />);
    expect(html).toContain(">Tốc độ tăng</span>");
    expect(html).toContain(
      ">Cần hai lần đo chiều dài cách nhau từ 14 ngày.</p>",
    );
    expect(html).not.toContain(CHIP);
  });
});

// Spec 2026-11-25 §6.4.
describe("HeightGoalLink", () => {
  const render = (link: Parameters<typeof HeightGoalLink>[0]["link"]) =>
    renderToStaticMarkup(<HeightGoalLink link={link} />);

  it("is one link to the Chiều cao page: a flag in an accent-tinted circle, the title, an arrow", () => {
    const html = render({
      title: "Mục tiêu chiều cao 180 cm",
      detail: "Sát đường mục tiêu",
      onTrack: true,
    });
    expect(html).toMatch(/^<a [^>]*href="\/tang-truong\/chieu-cao"/);
    expect(html.match(/<a /g)).toHaveLength(1);
    expect(html).toContain("glass");
    expect(html).toContain("rounded-[26px]");
    expect(html).toContain("size-10");
    expect(html).toContain("bg-accent-tint");
    expect(html).toContain(`d="${ICON_PATHS.flag}"`);
    expect(html).toContain(">Mục tiêu chiều cao 180 cm</span>");
    expect(html).toContain(`d="${ICON_PATHS.chevronRight}"`);
  });

  it("on track: the status in good, semibold", () => {
    expect(
      render({
        title: "Mục tiêu chiều cao 180 cm",
        detail: "Sát đường mục tiêu",
        onTrack: true,
      }),
    ).toContain(
      '<span class="text-[13px] leading-[18px] font-semibold text-good">Sát đường mục tiêu</span>',
    );
  });

  it("otherwise the line under the title is muted", () => {
    expect(
      render({
        title: "Mục tiêu chiều cao",
        detail: "Nhập chiều cao bố mẹ để xem khoảng dự kiến",
        onTrack: false,
      }),
    ).toContain(
      '<span class="text-[13px] leading-[18px] text-muted">Nhập chiều cao bố mẹ để xem khoảng dự kiến</span>',
    );
  });

  it("no line under the title while the status is not known yet", () => {
    const html = render({
      title: "Mục tiêu chiều cao 180 cm",
      detail: null,
      onTrack: false,
    });
    expect(html).toContain(">Mục tiêu chiều cao 180 cm</span>");
    expect(html).not.toContain("text-[13px]");
  });
});
