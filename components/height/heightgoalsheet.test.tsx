import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PermissionDeniedError, toVietnameseError } from "@/lib/data/errors";
import type { Baby } from "@/lib/supabase/rows";
import { HeightGoalSheet } from "./HeightGoalSheet";

// A static render cannot press Lưu. The mutation is stood in for, so its
// options (what saving does) and its states (what the sheet shows) can be read.
const mutation = vi.hoisted(() => ({
  options: null as {
    mutationFn: (value: unknown) => Promise<void>;
    onSuccess: () => void;
  } | null,
  state: {
    isError: false,
    isPending: false,
    error: null as unknown,
    mutate: () => {},
    reset: () => {},
  },
}));
const invalidateQueries = vi.hoisted(() => vi.fn());
const updateBaby = vi.hoisted(() => vi.fn());

vi.mock("@tanstack/react-query", async (original) => ({
  ...(await original<typeof import("@tanstack/react-query")>()),
  useMutation: (options: typeof mutation.options) => {
    mutation.options = options;
    return mutation.state;
  },
  useQueryClient: () => ({ invalidateQueries }),
}));
vi.mock("@/lib/data/baby", () => ({ updateBaby }));

const baby = (over: Partial<Baby> = {}) =>
  ({
    id: "b1",
    family_id: "f1",
    name: "Bun",
    dob: "2026-09-14",
    sex: "male",
    father_height_cm: null,
    mother_height_cm: null,
    target_height_cm: null,
    ...over,
  }) as unknown as Baby;

const render = (who: Baby = baby(), onClose: () => void = () => {}) =>
  renderToStaticMarkup(<HeightGoalSheet baby={who} onClose={onClose} />);

beforeEach(() => {
  mutation.state.isError = false;
  mutation.state.isPending = false;
  mutation.state.error = null;
  invalidateQueries.mockClear();
  updateBaby.mockClear();
});

const BOX = "rounded-[18px] bg-good-soft px-4 py-3 text-good-ink";

// Spec 2026-11-25 §6.5.
describe("HeightGoalSheet", () => {
  it("is titled, says what the heights are for, and names the baby", () => {
    const html = render();
    expect(html).toContain("<dialog");
    expect(html).toContain(">Mục tiêu và chiều cao bố mẹ</h2>");
    expect(html).toContain(
      ">Nhập một lần. App dùng để tính khoảng chiều cao dự kiến của Bun.</p>",
    );
  });

  it("three decimal fields in cm, with no default value", () => {
    const html = render();
    for (const label of ["Bố", "Mẹ", "Mục tiêu của con"])
      expect(html).toContain(`>${label}</span>`);
    for (const name of [
      "Chiều cao của bố, cm",
      "Chiều cao của mẹ, cm",
      "Mục tiêu của con, cm",
    ])
      expect(html).toContain(`aria-label="${name}"`);
    expect(html.match(/inputMode="decimal"/g)).toHaveLength(3);
    expect(html.match(/ value=""/g)).toHaveLength(3);
    expect(html.match(/>cm<\/span>/g)).toHaveLength(3);
  });

  it("Lưu submits the form; there is nothing to delete", () => {
    const html = render();
    const formId = /<form id="([^"]+)"/.exec(html)?.[1];
    expect(formId).toBeTruthy();
    expect(html).toMatch(
      new RegExp(
        `type="submit"[^>]*form="${formId}"[^>]*>Lưu</button>|form="${formId}"[^>]*type="submit"[^>]*>Lưu</button>`,
      ),
    );
    expect(html).not.toContain("Xóa");
  });

  it("empty: no range box yet, only the note about a target outside the range", () => {
    const html = render();
    expect(html).not.toContain(BOX);
    expect(html).toContain(
      ">Nếu mục tiêu nằm ngoài khoảng dự kiến, app vẫn theo dõi nhưng sẽ nói rõ là khó đạt.</p>",
    );
  });

  it("opened on stored heights: they are filled in with a comma, and the range shows at once", () => {
    const html = render(
      baby({
        father_height_cm: 175,
        mother_height_cm: 160.5,
        target_height_cm: 180,
      }),
    );
    expect(html).toContain('value="175"');
    expect(html).toContain('value="160,5"');
    expect(html).toContain('value="180"');
    expect(html).toContain(
      `<div class="flex flex-col gap-1 ${BOX}"><span class="text-base font-bold">Khoảng dự kiến 166–183 cm</span><span class="text-[13px] leading-[18px]">Mục tiêu 180 cm nằm trong khoảng, ở nửa trên.</span></div>`,
    );
  });

  it("parents without a target: the range alone", () => {
    const html = render(
      baby({ father_height_cm: 175, mother_height_cm: 160.5 }),
    );
    expect(html).toContain(">Khoảng dự kiến 166–183 cm</span></div>");
  });

  it("a girl's range is the women's", () => {
    const html = render(
      baby({ sex: "female", father_height_cm: 175, mother_height_cm: 160.5 }),
    );
    expect(html).toContain(">Khoảng dự kiến 153–170 cm</span>");
  });

  it("shows no error before anything is submitted", () => {
    const html = render();
    expect(html).not.toContain("text-danger");
    expect(html).not.toContain('role="alert"');
  });

  // The save itself is never pressed in a browser check: dev talks to the
  // family's real database. These are the checks it gets.
  it("saving writes the three heights to this baby's profile", async () => {
    updateBaby.mockResolvedValue(undefined);
    render();
    const value = {
      father_height_cm: 172,
      mother_height_cm: 164,
      target_height_cm: null,
    };
    await mutation.options?.mutationFn(value);
    expect(updateBaby).toHaveBeenCalledWith("b1", value);
  });

  it("after a save the family context is refreshed and the sheet closes", () => {
    const onClose = vi.fn();
    render(baby(), onClose);
    mutation.options?.onSuccess();
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ["family-context"],
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("a save the database refuses is said in words, above the button", () => {
    mutation.state.isError = true;
    mutation.state.error = new PermissionDeniedError();
    const html = render();
    expect(html).toContain(
      `<p role="alert" class="text-[15px] text-danger">${toVietnameseError(new PermissionDeniedError())}</p>`,
    );
    expect(html.indexOf('role="alert"')).toBeLessThan(
      html.indexOf(">Lưu</button>"),
    );
  });

  it("while saving the button is busy and cannot be pressed twice", () => {
    mutation.state.isPending = true;
    expect(render()).toMatch(
      /<button[^>]*disabled=""[^>]*aria-busy="true"[^>]*>Lưu<\/button>/,
    );
  });
});
