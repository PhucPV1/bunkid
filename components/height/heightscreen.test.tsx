import { renderToStaticMarkup } from "react-dom/server";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import type { Baby, GrowthRow } from "@/lib/supabase/rows";
import { HeightScreen } from "./HeightScreen";

const state = vi.hoisted(() => ({
  growth: {} as Record<string, unknown>,
  table: {} as Record<string, unknown>,
}));
const useGrowth = vi.hoisted(() => vi.fn());
const useWhoTable = vi.hoisted(() => vi.fn());

vi.mock("@/lib/data/growth", () => ({ useGrowth, useWhoTable }));
// The chart is loaded lazily; a stand-in shows what it was given.
vi.mock("next/dynamic", () => ({
  default:
    () =>
    ({
      unit,
      points,
      target,
      label,
    }: {
      unit: string;
      points: unknown[];
      target?: unknown[];
      label: string;
    }) => (
      <div
        data-chart={`${unit}:${points.length}:${target?.length ?? "none"}`}
        aria-label={label}
      />
    ),
}));

const LOADING = {
  data: undefined,
  isPending: true,
  isError: false,
  error: null,
  fetchStatus: "fetching",
  refetch: () => {},
};
const OFFLINE = { ...LOADING, fetchStatus: "paused" };
const FAILED = {
  ...LOADING,
  isPending: false,
  isError: true,
  error: new Error("boom"),
  fetchStatus: "idle",
};
const loaded = (data: unknown) => ({
  ...LOADING,
  data,
  isPending: false,
  fetchStatus: "idle",
});
// The median length is 58,5 cm on every day; z = (value / 58,5 − 1) × 8.
const TABLE = loaded({
  rows: Array.from({ length: 1857 }, (_, day) => [day, 1, 58.5, 0.125]),
});

const measure = (measured_on: string, length_cm: number) =>
  ({
    id: `g-${measured_on}`,
    baby_id: "b1",
    measured_on,
    weight_g: null,
    length_cm,
    head_cm: null,
    created_by: "u1",
    created_at: `${measured_on}T03:00:00.000Z`,
    updated_at: `${measured_on}T03:00:00.000Z`,
  }) as GrowthRow;
const ROWS = [measure("2026-11-15", 62), measure("2026-10-14", 58.5)];

const baby = (over: Partial<Baby> = {}) =>
  ({
    id: "b1",
    family_id: "f1",
    name: "Bun",
    dob: "2026-09-14",
    sex: "male",
    father_height_cm: 172,
    mother_height_cm: 164,
    target_height_cm: 180,
    ...over,
  }) as unknown as Baby;

function render(
  query: { growth?: unknown; table?: unknown } = {},
  who: Baby = baby(),
  isOwner = true,
) {
  state.growth = (query.growth ?? loaded(ROWS)) as Record<string, unknown>;
  state.table = (query.table ?? TABLE) as Record<string, unknown>;
  return renderToStaticMarkup(<HeightScreen baby={who} isOwner={isOwner} />);
}

beforeAll(() => {
  useGrowth.mockImplementation(() => state.growth);
  useWhoTable.mockImplementation(() => state.table);
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-11-20T05:00:00Z")); // 12:00 giờ VN
});
afterAll(() => vi.useRealTimers());

// Spec 2026-11-25 §6.3.
describe("HeightScreen", () => {
  it("is titled Chiều cao and goes back to Tăng trưởng", () => {
    const html = render();
    expect(html).toContain(">Chiều cao</h1>");
    expect(html).toMatch(/href="\/tang-truong"[^>]*>.*Tăng trưởng<\/a>/);
  });

  it("reads the measurements of this baby and the length table of the baby's sex", () => {
    useGrowth.mockClear();
    useWhoTable.mockClear();
    render();
    expect(useGrowth).toHaveBeenCalledWith("b1");
    expect(useWhoTable.mock.calls).toEqual([["lhfa", "boys"]]);
    useWhoTable.mockClear();
    render({}, baby({ sex: "female" }));
    expect(useWhoTable.mock.calls).toEqual([["lhfa", "girls"]]);
  });

  it("the blocks come in order: goal, parents, path, speed, the closing note", () => {
    const html = render();
    const order = [
      ">Mục tiêu lúc trưởng thành</span>",
      ">Di truyền dự kiến</h2>",
      ">Đường tới 180 cm</h2>",
      ">Tốc độ tăng</span>",
      ">Chiều cao lúc lớn phần lớn do di truyền. Kim Bun giúp theo dõi và nhắc việc, không thay lời khuyên của bác sĩ.</p>",
    ].map((mark) => html.indexOf(mark));
    expect(order.every((i) => i >= 0)).toBe(true);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
  });

  it("the goal card says where the newest length stands against the target line", () => {
    // 180 cm is z +0,47 for a man: the line is at 61,96 cm. 62 cm is on it.
    const html = render();
    expect(html).toContain(">180</span>");
    expect(html).toContain(
      ">Bun dài 62 cm lúc 2 tháng 1 ngày. Sát đường mục tiêu.</p>",
    );
    expect(html).toContain(">Đang đúng hướng</span>");
  });

  it("the parents' card carries their heights and the range", () => {
    const html = render();
    expect(html).toContain(">Bố 172 cm · Mẹ 164 cm</span>");
    expect(html).toContain(
      ">Khoảng dự kiến 166–183 cm. Mục tiêu 180 cm nằm trong khoảng, ở nửa trên.</p>",
    );
  });

  it("the chart gets the baby's lengths in cm and the target line", () => {
    const html = render();
    // chartRange at 67 days: the first year, a point a week, 53 points.
    expect(html).toContain('data-chart="cm:2:53"');
    expect(html).toContain(
      'aria-label="Đường tới 180 cm. 2 lần đo chiều dài."',
    );
    expect(html).toContain(
      "một bé trai sẽ cao 180 cm khi lớn, nếu giữ nguyên vị trí trên biểu đồ WHO.",
    );
  });

  it("the speed card compares the two lengths 32 days apart", () => {
    const html = render();
    expect(html).toContain(">3,3 cm mỗi tháng</span>");
    expect(html).toContain(
      ">Từ 14/10 đến 15/11 · bé cùng tuổi thường tăng khoảng 0,0 cm mỗi tháng</span>",
    );
  });

  it("no target: the goal card says so, there is no path, the rest stays", () => {
    const html = render({}, baby({ target_height_cm: null }));
    expect(html).toContain(">Chưa có mục tiêu chiều cao</p>");
    expect(html).not.toContain("Đường tới");
    expect(html).not.toContain("data-chart");
    expect(html).toContain(">Khoảng dự kiến 166–183 cm.</p>");
    expect(html).toContain(">Tốc độ tăng</span>");
  });

  it("no target, another member: told that the owner has not set one", () => {
    const html = render({}, baby({ target_height_cm: null }), false);
    expect(html).toContain(">Chủ gia đình chưa đặt mục tiêu chiều cao.</p>");
  });

  it("the owner gets a pencil that edits the goal and the parents' heights; other members do not", () => {
    expect(render()).toContain('aria-label="Sửa mục tiêu và chiều cao bố mẹ"');
    expect(render({}, baby(), false)).not.toContain(
      "Sửa mục tiêu và chiều cao bố mẹ",
    );
  });

  it("no target, the owner: a button to set one", () => {
    const html = render({}, baby({ target_height_cm: null }));
    expect(html).toContain(">Đặt mục tiêu</button>");
    expect(render({}, baby({ target_height_cm: null }), false)).not.toContain(
      "Đặt mục tiêu",
    );
  });

  it("the sheet is closed until asked for", () => {
    expect(render()).not.toContain("<dialog");
  });

  it("the pencil is there while the page loads too", () => {
    expect(render({ growth: LOADING })).toContain(
      'aria-label="Sửa mục tiêu và chiều cao bố mẹ"',
    );
  });

  it("no parents' heights: the card asks for them", () => {
    const html = render(
      {},
      baby({ father_height_cm: null, mother_height_cm: null }),
    );
    expect(html).toContain(">Nhập chiều cao bố mẹ để xem khoảng dự kiến.</p>");
  });

  it("no measurement: the goal says so and the speed card says what it needs", () => {
    const html = render({ growth: loaded([]) });
    expect(html).toContain(">Chưa có lần đo chiều dài.</p>");
    expect(html).toContain(
      ">Cần hai lần đo chiều dài cách nhau từ 14 ngày.</p>",
    );
    expect(html).toContain('data-chart="cm:0:53"');
  });

  it("older than the WHO table: one line in place of the path and the speed", () => {
    const html = render({}, baby({ dob: "2021-01-01" }));
    expect(html).toContain(">Bảng WHO trong app tới 5 tuổi.</p>");
    expect(html).not.toContain("data-chart");
    expect(html).not.toContain("Tốc độ tăng");
    expect(html).toContain(">Di truyền dự kiến</h2>");
    expect(html).toContain("Chiều cao lúc lớn phần lớn do di truyền.");
  });

  it("while the measurements or the table load: the header and placeholders only", () => {
    for (const html of [
      render({ growth: LOADING }),
      render({ table: LOADING }),
    ]) {
      expect(html).toContain(">Chiều cao</h1>");
      expect(html).toContain("kb-pulse");
      expect(html).not.toContain("Di truyền dự kiến");
      expect(html).not.toContain("Chiều cao lúc lớn");
    }
  });

  // The WHO table is loaded with networkMode "always": it never pauses, so
  // only the measurements can be waiting for the network.
  it("offline before the first load: says what needs the network", () => {
    expect(render({ growth: OFFLINE })).toContain(
      "Cần mạng để tải các lần đo. Trang sẽ tự tải khi có mạng lại.",
    );
  });

  it("a failed load: the error card with a retry", () => {
    for (const html of [
      render({ growth: FAILED }),
      render({ table: FAILED }),
    ]) {
      expect(html).toContain('role="alert"');
      expect(html).toContain(">Thử lại</button>");
      expect(html).not.toContain("Di truyền dự kiến");
    }
  });
});
