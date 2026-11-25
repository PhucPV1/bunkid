# Kim Bun — Sức khỏe M3c: trang Chiều cao và sheet nhập Implementation Plan

Steps use checkbox (`- [ ]`) syntax for tracking.

**Spec:** `docs/blueprint/specs/2026-11-25-kim-bun-chieu-cao-tang-truong-suc-khoe-design.md` (§6.5 sheet; §6.3 mục 1, 2, 9, các trạng thái của trang và phần bé quá 1856 ngày tuổi; phần tương ứng của §9.1 và §9.2)

**Status:** approved 2026-11-25 (người dùng duyệt cả chỗ dời chip của thẻ mục tiêu nêu ở Diễn giải spec, mục 3)

**Goal:** Có trang Chiều cao ở `/tang-truong/chieu-cao`: chủ gia đình nhập chiều cao bố, mẹ và mục tiêu, rồi xem khoảng di truyền, đường tới mục tiêu và tốc độ tăng. Lối vào từ màn Tăng trưởng và trang Sức khỏe là M3d; cho tới lúc đó trang chỉ mở được bằng đường dẫn.

**Architecture:**

- **Sheet:** `components/height/HeightGoalSheet.tsx` dùng `Sheet` có sẵn, kiểm bằng `parseHeightGoal`, lưu bằng `updateBaby` (không qua outbox), rồi làm mới `["family-context"]`. Khung xem trước tính bằng luật thuần `goalPreview`.
- **Trang:** `components/height/HeightScreen.tsx` tải các lần đo và bảng chiều dài WHO, gọi `heightView` (M3b) rồi xếp bốn thẻ; chủ gia đình có nút bút chì và nút "Đặt mục tiêu" để mở sheet.
- **Thẻ mục tiêu:** chip chuyển xuống hàng của số để nhãn nằm một dòng.
- Không có migration, không thêm gói, không thêm token màu.

**Tech Stack:** Next.js 16.4.3, React 19.3.1, TypeScript 5.9.3 `strict`, Tailwind CSS 4.3.3, TanStack Query, Recharts 3.10.1, Vitest, Bun. Không thêm gói nào.

**Nhánh:** `feat/kim-bun-suc-khoe-m3c`, cắt từ `main` @ `09baf6c` (đã có M3b và bản sửa nhãn né đường mục tiêu; migration ba cột chiều cao đã ở DB thật). Baseline: 1484 test vitest xanh (176 file), typecheck sạch.

**Các mốc của spec này:**

| Mốc                | Nội dung                                                                                                                   | Plan                          |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------- | ----------------------------- |
| M1, M2             | §3, §4 dòng 1 đến 3, §5                                                                                                    | đã xong, ở `main`             |
| M3a, M3b           | §6.1, §6.2; luật hiển thị, bốn thẻ, đường mục tiêu của §6.3                                                                | đã xong, ở `main` @ `09baf6c` |
| **M3c (plan này)** | §6.5 sheet; §6.3 trang                                                                                                     | file này                      |
| M3d                | §6.4 thẻ "Mục tiêu chiều cao" ở màn Tăng trưởng (§5.3 mục 4); hàng mục tiêu trên thẻ Tăng trưởng của trang Sức khỏe (§3.4) | chưa viết                     |
| M4                 | §7 Thói quen và dinh dưỡng, dòng 5 và 6 của §4                                                                             | chưa viết                     |
| M5                 | §8 Push, dòng 4 của §4, §9.3                                                                                               | chưa viết                     |

**Diễn giải spec** (chỗ spec chưa nói rõ, hoặc phải chọn một cách đọc):

1. **M3 thành bốn plan.** Hai lối vào (thẻ ở màn Tăng trưởng, hàng mục tiêu ở trang Sức khỏe) để sang M3d cho plan này vừa sức đọc. Sau M3c trang đã dùng được trọn nhưng chỉ mở bằng đường dẫn `/tang-truong/chieu-cao`; chưa ai trong nhà tình cờ thấy nó.
2. **Chưa ai bấm "Lưu" của sheet trước khi người dùng tự bấm.** Dev nối vào Supabase thật, nên bước trình duyệt chỉ gõ thử vào ô rồi đóng sheet, không lưu. Đường lưu có test tới mức một bản dựng tĩnh cho phép: ô nhập (`parseHeightGoal`, M3a), hàm lưu gọi `updateBaby` đúng bé và đúng ba cột, sau khi lưu thì làm mới `["family-context"]` và đóng sheet, lỗi của DB hiện thành chữ, nút bận khi đang lưu; quyền ghi của DB có pgTAP 014. Nhưng chính lần ghi từ sheet tới DB thật thì lần đầu chạy là lúc người dùng nhập số của nhà mình. Báo cáo cuối phải nói rõ điều này.
3. **Chip của thẻ mục tiêu chuyển xuống hàng của số "{t} cm"** (Task 3). Lần kiểm trình duyệt của M3b thấy nhãn "Mục tiêu lúc trưởng thành" bị xuống hai dòng ở 375 px mỗi khi thẻ có chip. **Đây là chỗ sửa spec; người dùng đã duyệt cùng plan này ngày 2026-11-25** (§6.3 mục 2 đã ghi, có đánh dấu); bản vẽ đặt chip cạnh nhãn. Cặp dài nhất, "190,5 cm" và "Dưới đường mục tiêu", ước chừng 304 px trên 311 px của thẻ; hàng này được phép xuống dòng (`flex-wrap`), nên nếu chữ rộng hơn ước lượng thì chip xuống dưới số chứ không tràn khỏi thẻ.
4. **Sheet:** tên đọc cho trình đọc màn hình của ba ô là "Chiều cao của bố, cm", "Chiều cao của mẹ, cm", "Mục tiêu của con, cm" (ô thứ ba bản vẽ ghi "Chiều cao mục tiêu, cm"; đổi cho trùng chữ hiện trên màn, để điều khiển bằng giọng nói tìm ra ô). Dòng "Nếu mục tiêu nằm ngoài khoảng dự kiến, app vẫn theo dõi nhưng sẽ nói rõ là khó đạt." luôn hiện, kể cả khi chưa có hộp khoảng dự kiến. Lỗi của từng ô hiện sau khi bấm "Lưu", như `GrowthSheet`.
5. **`goalPreview`** là luật thuần cho hộp xem trước: chỉ có khi cả bố và mẹ hợp lệ; mục tiêu chưa hợp lệ thì hộp chỉ ghi khoảng.
6. **Trạng thái của trang** dùng các khối có sẵn: đang tải thì ba ô xám; mất mạng trước lần tải đầu của các lần đo thì "Cần mạng để tải các lần đo…"; lỗi thì thẻ lỗi có nút "Thử lại". Bảng WHO tải với `networkMode: "always"` nên không bao giờ ở trạng thái chờ mạng: mất mạng thì nó báo lỗi. Nút bút chì của chủ gia đình có mặt ngay cả khi trang đang tải.
7. **Bé quá 1856 ngày tuổi** (thừa hưởng từ M3b, ghi lại cho M3d và M4): thẻ mục tiêu vẫn xét lần đo chiều dài gần nhất nằm trong bảng WHO, có thể đã cũ nhiều năm. Với bé nhà mình còn gần 5 năm nữa mới tới.
8. **Trang tạm của Task 4** dựng thẻ mục tiêu ở các trạng thái dữ liệu thật chưa có (đã có mục tiêu, cặp số và chip dài nhất) và mở sheet trên một bé giả có sẵn số. Trạng thái "đã có mục tiêu" của trang thật chỉ thấy được sau khi người dùng tự nhập và lưu.
9. **Kiểm trình duyệt** chỉ xem, không bấm Lưu. Theo quy ước của người dùng, mặc định dùng Claude in Chrome; cỡ 375 px cần khung Browser trong app và phải hỏi người dùng trước khi dùng.

## Global Constraints

- Giữ toàn bộ mục 2 của spec UI: chỉ tiếng Việt; Next.js 16.4.3, React 19.3.1, Tailwind 4.3.3, Bun 1.x, TypeScript 5.9.3 `strict`; Safari iOS ≥ 16.4; bề ngang 375–440 pt; vùng chạm ≥ 44×44 pt; không thêm dependency, không web font; logic thuần đặt trong `lib/rules/` và có unit test.
- Trước khi dùng API của Next, đọc trang tương ứng trong `node_modules/next/dist/docs/` (AGENTS.md).
- Mọi màu chỉ đặt trong `app/globals.css` và `lib/ui/tokens.ts`. Spec này không thêm token màu. `lib/themeGuard.test.ts` cấm mã hex trong `components/**/*.tsx`; mã hex trong bản vẽ không được chép vào component.
- Mọi thay đổi phải đúng ở cả 7 theme: `light`, `rose`, `peach`, `lavender`, `sea`, `dark`, `night`.
- `glass` nằm trong `glass` hay `glass-strong` không có blur riêng (hotfix 7822c90): lớp trong chỉ còn màu nền và viền.
- Mọi ngày giờ tính theo giờ Việt Nam (UTC+7), dùng `formatVnTime`, `vnDateString`, `ageDays`, `ageOnDay` có sẵn.
- Số đo (`growth`) vẫn ghi qua outbox như hiện tại. Hồ sơ bé (`babies`) vẫn ghi bằng `updateBaby` (`lib/data/baby.ts`), chỉ chủ gia đình ghi được (policy `babies_update` hiện có); spec này không đổi policy nào.
- Chữ về sức khỏe: chỉ dùng đúng các câu ghi trong spec này. App không chẩn đoán, không nêu tên bệnh, không nêu liều thuốc, không gợi ý thực phẩm chức năng, không dùng câu nào cam kết đạt chiều cao mục tiêu.
- Mọi con số y khoa mới phải lấy từ nguồn ghi ở §6.2, §7.1, §7.3 và ghi `source`, `reviewedAt` trong file nội dung; không lấy số từ trí nhớ.
- Bảng WHO trong app chỉ có ngày tuổi 0–1856. Ngoài khoảng đó không đánh giá, không cảnh báo, không vẽ đường mục tiêu.
- Ở bề ngang 375 px không chữ nào trong các khối mới bị cắt "…". Được xuống dòng: tiêu đề và nội dung thẻ cảnh báo, dòng chênh dưới thanh vị trí, các đoạn chú thích `text-muted`, dòng mô tả của thẻ và hàng danh sách (tối đa 2 dòng), các dòng dinh dưỡng.
- Dev đang nối vào Supabase thật của gia đình. Kiểm tay không được bấm Lưu, không bắt đầu hay dừng đồng hồ, không bật tắt công tắc. Trạng thái nào dữ liệu thật không có thì xem trên trang fixture tạm, xóa trước khi commit.
- Tải file từ `cdn.who.int` (§6.2) cần người dùng đồng ý trước khi chạy.
- Push lên `main` cần người dùng đồng ý từng lần.
- Test hiện có phải xanh: 1153 test vitest, pgTAP 001–013, `bun run typecheck`, `bun run build`.

### Ghi chú khi thực thi (của plan này, không thuộc spec)

- **Patch.** Mọi thay đổi nằm trong các khối `diff`, đánh số **Patch 1** đến **Patch 6** theo thứ tự xuất hiện trong file này. Áp bằng lệnh dưới (dán cả hàm vào cùng một lần gọi shell), hoặc sửa tay: dòng bắt đầu bằng `-` là bỏ, `+` là thêm.

```bash
kb_patch() {
  awk -v n="$1" 'BEGIN { f = sprintf("%c%c%c", 96, 96, 96) }
    $0 == f "diff" { c++; on = (c == n); next }
    $0 == f { on = 0 }
    on' docs/blueprint/plans/2026-11-25-kim-bun-chieu-cao-suc-khoe-m3c.md
}
kb_patch 1 | git apply --verbose   # đổi số 1 thành số patch cần áp
```

- **Đã chạy thử.** 6 patch đã được áp lần lượt lên một bản sao ở ngoài repo, bắt đầu từ `main` @ `09baf6c`. Trong bản chạy thử mỗi task là hai commit (test trước, code sau; còn làm theo plan thì mỗi task một commit ở Step 5). `tsc --noEmit` sạch sau mỗi commit code; số test đỏ và xanh của từng task là số đo thật trên cả bộ test. Trang tạm của Task 4 đã qua `tsc --noEmit`. Chưa chạy trong lúc viết plan: `bun run build` và bước kiểm trình duyệt.
- **`bun run build` và `bun run dev`** có thể dừng một lần với thông báo cảnh báo bảo mật của Next.js 16.4.3 rồi chạy được ở lần thứ hai. Không chạy lệnh `next upgrade` mà nó gợi ý.
- **Màu.** Không patch nào thêm màu hay token; màu chỉ đi qua lớp Tailwind của token có sẵn. `lib/themeGuard.test.ts` phải xanh.
- **pgTAP.** Plan này không đụng DB nên không chạy pgTAP.
- **Không bấm "Lưu".** Dev nối vào Supabase thật của gia đình. Trong sheet chỉ gõ thử rồi đóng, chọn bỏ thay đổi. Điều này áp dụng cả với sheet mở trên trang tạm.
- **Lên `main`.** Spec yêu cầu người dùng đồng ý từng lần. Task 4 dừng lại hỏi, không tự push. Người dùng không muốn đẩy một thay đổi còn lỗi đã biết: nếu bước trình duyệt lộ ra lỗi thì nêu lỗi và cách sửa trước, rồi mới hỏi.
- **Người dùng muốn màn hình gọn.** Không thêm chữ nào ngoài plan; nếu người dùng muốn bỏ bớt chữ thì ghi lại yêu cầu và sửa theo, kèm test và sửa spec.
- **Dòng `Co-Authored-By`.** Các lệnh commit trong plan ghi `Claude Fable 5.2`, là model của phiên viết plan. Phiên thực thi chạy model khác thì thay bằng dòng attribution mà phiên đó quy định.
- **Không chạy lệnh nào nhắc tới file `.env`** (một hook chặn).

## Contracts with Other Plans

Plan này đứng sau M3b (đã ở `main` @ `09baf6c`). M3d đứng sau.

**Consumes (từ M3a và M3b):** `parseHeightGoal`, `heightGoalRaw`, `HeightGoalRaw`, `HeightGoalInput`, `HeightGoalErrors`, `midParental`, `targetVsRange` (`lib/rules/heightGoal.ts`); `heightView`, `HeightView` (`lib/rules/heightView.ts`); `HeightGoalCard`, `ParentalRangeCard`, `TargetPathCard`, `VelocityCard` (`components/height/HeightCards.tsx`); `GrowthChart` với prop `target`; `updateBaby` nhận ba cột chiều cao; `Baby` có ba cột đó. **Từ các mốc trước:** `Sheet`, `Button`, `IconButton`, `PageHeader`, `Skeleton`, `ErrorCard`, `NeedsNetwork`, `waitingForNetwork`; `FIELD_INPUT`, `FIELD_LABEL`; `useGrowth`, `useWhoTable`; `toVietnameseError`, `PermissionDeniedError`; `whoSex`; `AuthGate`.

**Produces:**

- `lib/rules/heightView.ts`: `goalPreview(raw: HeightGoalRaw, sex: WhoSex): { range: string; target: string | null } | null`.
- `components/height/HeightGoalSheet.tsx`: `HeightGoalSheet({ baby: Baby; onClose: () => void })`.
- `components/height/HeightScreen.tsx`: `HeightScreen({ baby: Baby; isOwner: boolean })`; trang `app/tang-truong/chieu-cao/page.tsx` (đường dẫn `/tang-truong/chieu-cao`, tab "Sức khỏe" vẫn sáng vì `activeTab` xét theo tiền tố `/tang-truong`).
- `components/height/HeightCards.tsx`: trong `HeightGoalCard` chip nằm cùng hàng với số; prop không đổi.
- **Vitest sau M3c:** 1521 test, 178 file.
- **Ghi chú cho M3d:** thẻ lối vào ở màn Tăng trưởng đã được dựng thử trên nền plan này (luật `goalLink`, khối `HeightGoalLink`, nối vào `GrowthScreen`; 1532 test) và chờ viết thành plan cùng hàng mục tiêu ở trang Sức khỏe.

---

### Task 1: Sheet "Mục tiêu và chiều cao bố mẹ" (§6.5)

**Files:**

- Create: `components/height/HeightGoalSheet.tsx`
- Modify: `lib/rules/heightView.ts`
- Test: `components/height/heightgoalsheet.test.tsx` (mới), `lib/rules/heightView.test.ts`

**Interfaces:**

- Consumes: `parseHeightGoal`, `heightGoalRaw`, `HeightGoalRaw`, `HeightGoalInput`, `HeightGoalErrors`, `midParental`, `targetVsRange`; `Sheet`, `Button`, `FIELD_INPUT`, `FIELD_LABEL`; `updateBaby`; `toVietnameseError`, `PermissionDeniedError`; `whoSex`.
- Produces: `goalPreview(raw, sex)`; `HeightGoalSheet({ baby, onClose })`. Test của sheet thay `useMutation` và `useQueryClient` bằng bản giả để đọc được hàm lưu và các trạng thái của nó; phần còn lại của `@tanstack/react-query` giữ nguyên.

- [x] **Step 0: Tạo nhánh**

```bash
git checkout main && git pull --ff-only && git checkout -b feat/kim-bun-suc-khoe-m3c
```

- [x] **Step 1: Viết test đỏ (Patch 1)**

```diff
diff --git a/components/height/heightgoalsheet.test.tsx b/components/height/heightgoalsheet.test.tsx
new file mode 100644
index 0000000..28678f1
--- /dev/null
+++ b/components/height/heightgoalsheet.test.tsx
@@ -0,0 +1,185 @@
+import { renderToStaticMarkup } from "react-dom/server";
+import { beforeEach, describe, expect, it, vi } from "vitest";
+import { PermissionDeniedError, toVietnameseError } from "@/lib/data/errors";
+import type { Baby } from "@/lib/supabase/rows";
+import { HeightGoalSheet } from "./HeightGoalSheet";
+
+// A static render cannot press Lưu. The mutation is stood in for, so its
+// options (what saving does) and its states (what the sheet shows) can be read.
+const mutation = vi.hoisted(() => ({
+  options: null as {
+    mutationFn: (value: unknown) => Promise<void>;
+    onSuccess: () => void;
+  } | null,
+  state: {
+    isError: false,
+    isPending: false,
+    error: null as unknown,
+    mutate: () => {},
+    reset: () => {},
+  },
+}));
+const invalidateQueries = vi.hoisted(() => vi.fn());
+const updateBaby = vi.hoisted(() => vi.fn());
+
+vi.mock("@tanstack/react-query", async (original) => ({
+  ...(await original<typeof import("@tanstack/react-query")>()),
+  useMutation: (options: typeof mutation.options) => {
+    mutation.options = options;
+    return mutation.state;
+  },
+  useQueryClient: () => ({ invalidateQueries }),
+}));
+vi.mock("@/lib/data/baby", () => ({ updateBaby }));
+
+const baby = (over: Partial<Baby> = {}) =>
+  ({
+    id: "b1",
+    family_id: "f1",
+    name: "Bun",
+    dob: "2026-09-14",
+    sex: "male",
+    father_height_cm: null,
+    mother_height_cm: null,
+    target_height_cm: null,
+    ...over,
+  }) as unknown as Baby;
+
+const render = (who: Baby = baby(), onClose: () => void = () => {}) =>
+  renderToStaticMarkup(<HeightGoalSheet baby={who} onClose={onClose} />);
+
+beforeEach(() => {
+  mutation.state.isError = false;
+  mutation.state.isPending = false;
+  mutation.state.error = null;
+  invalidateQueries.mockClear();
+  updateBaby.mockClear();
+});
+
+const BOX = "rounded-[18px] bg-good-soft px-4 py-3 text-good-ink";
+
+// Spec 2026-11-25 §6.5.
+describe("HeightGoalSheet", () => {
+  it("is titled, says what the heights are for, and names the baby", () => {
+    const html = render();
+    expect(html).toContain("<dialog");
+    expect(html).toContain(">Mục tiêu và chiều cao bố mẹ</h2>");
+    expect(html).toContain(
+      ">Nhập một lần. App dùng để tính khoảng chiều cao dự kiến của Bun.</p>",
+    );
+  });
+
+  it("three decimal fields in cm, with no default value", () => {
+    const html = render();
+    for (const label of ["Bố", "Mẹ", "Mục tiêu của con"])
+      expect(html).toContain(`>${label}</span>`);
+    for (const name of [
+      "Chiều cao của bố, cm",
+      "Chiều cao của mẹ, cm",
+      "Mục tiêu của con, cm",
+    ])
+      expect(html).toContain(`aria-label="${name}"`);
+    expect(html.match(/inputMode="decimal"/g)).toHaveLength(3);
+    expect(html.match(/ value=""/g)).toHaveLength(3);
+    expect(html.match(/>cm<\/span>/g)).toHaveLength(3);
+  });
+
+  it("Lưu submits the form; there is nothing to delete", () => {
+    const html = render();
+    const formId = /<form id="([^"]+)"/.exec(html)?.[1];
+    expect(formId).toBeTruthy();
+    expect(html).toMatch(
+      new RegExp(
+        `type="submit"[^>]*form="${formId}"[^>]*>Lưu</button>|form="${formId}"[^>]*type="submit"[^>]*>Lưu</button>`,
+      ),
+    );
+    expect(html).not.toContain("Xóa");
+  });
+
+  it("empty: no range box yet, only the note about a target outside the range", () => {
+    const html = render();
+    expect(html).not.toContain(BOX);
+    expect(html).toContain(
+      ">Nếu mục tiêu nằm ngoài khoảng dự kiến, app vẫn theo dõi nhưng sẽ nói rõ là khó đạt.</p>",
+    );
+  });
+
+  it("opened on stored heights: they are filled in with a comma, and the range shows at once", () => {
+    const html = render(
+      baby({
+        father_height_cm: 175,
+        mother_height_cm: 160.5,
+        target_height_cm: 180,
+      }),
+    );
+    expect(html).toContain('value="175"');
+    expect(html).toContain('value="160,5"');
+    expect(html).toContain('value="180"');
+    expect(html).toContain(
+      `<div class="flex flex-col gap-1 ${BOX}"><span class="text-base font-bold">Khoảng dự kiến 166–183 cm</span><span class="text-[13px] leading-[18px]">Mục tiêu 180 cm nằm trong khoảng, ở nửa trên.</span></div>`,
+    );
+  });
+
+  it("parents without a target: the range alone", () => {
+    const html = render(
+      baby({ father_height_cm: 175, mother_height_cm: 160.5 }),
+    );
+    expect(html).toContain(">Khoảng dự kiến 166–183 cm</span></div>");
+  });
+
+  it("a girl's range is the women's", () => {
+    const html = render(
+      baby({ sex: "female", father_height_cm: 175, mother_height_cm: 160.5 }),
+    );
+    expect(html).toContain(">Khoảng dự kiến 153–170 cm</span>");
+  });
+
+  it("shows no error before anything is submitted", () => {
+    const html = render();
+    expect(html).not.toContain("text-danger");
+    expect(html).not.toContain('role="alert"');
+  });
+
+  // The save itself is never pressed in a browser check: dev talks to the
+  // family's real database. These are the checks it gets.
+  it("saving writes the three heights to this baby's profile", async () => {
+    updateBaby.mockResolvedValue(undefined);
+    render();
+    const value = {
+      father_height_cm: 172,
+      mother_height_cm: 164,
+      target_height_cm: null,
+    };
+    await mutation.options?.mutationFn(value);
+    expect(updateBaby).toHaveBeenCalledWith("b1", value);
+  });
+
+  it("after a save the family context is refreshed and the sheet closes", () => {
+    const onClose = vi.fn();
+    render(baby(), onClose);
+    mutation.options?.onSuccess();
+    expect(invalidateQueries).toHaveBeenCalledWith({
+      queryKey: ["family-context"],
+    });
+    expect(onClose).toHaveBeenCalledTimes(1);
+  });
+
+  it("a save the database refuses is said in words, above the button", () => {
+    mutation.state.isError = true;
+    mutation.state.error = new PermissionDeniedError();
+    const html = render();
+    expect(html).toContain(
+      `<p role="alert" class="text-[15px] text-danger">${toVietnameseError(new PermissionDeniedError())}</p>`,
+    );
+    expect(html.indexOf('role="alert"')).toBeLessThan(
+      html.indexOf(">Lưu</button>"),
+    );
+  });
+
+  it("while saving the button is busy and cannot be pressed twice", () => {
+    mutation.state.isPending = true;
+    expect(render()).toMatch(
+      /<button[^>]*disabled=""[^>]*aria-busy="true"[^>]*>Lưu<\/button>/,
+    );
+  });
+});
diff --git a/lib/rules/heightView.test.ts b/lib/rules/heightView.test.ts
index 5ef8007..6520f71 100644
--- a/lib/rules/heightView.test.ts
+++ b/lib/rules/heightView.test.ts
@@ -2,7 +2,7 @@ import { describe, expect, it } from "vitest";
 import type { LmsRow } from "@/lib/content/who";
 import { addDays } from "./days";
 import type { GrowthMeasure } from "./growthAlerts";
-import { heightView, rangeBar } from "./heightView";
+import { goalPreview, heightView, rangeBar } from "./heightView";

 const DOB = "2026-01-01";
 // The baby is 76 days old "today".
@@ -239,3 +239,55 @@ describe("heightView: past the WHO table", () => {
     expect(edge.velocity).not.toBeNull();
   });
 });
+
+// Spec 2026-11-25 §6.5: what the sheet shows while the heights are typed.
+describe("goalPreview", () => {
+  it("both parents valid: the range, and nothing about a target that is not there", () => {
+    expect(
+      goalPreview({ father: "175", mother: "160,5", target: "" }, "boys"),
+    ).toEqual({
+      range: "Khoảng dự kiến 166–183 cm",
+      target: null,
+    });
+  });
+
+  it("with a valid target: where it sits against the range", () => {
+    expect(
+      goalPreview({ father: "175", mother: "160.5", target: "180" }, "boys"),
+    ).toEqual({
+      range: "Khoảng dự kiến 166–183 cm",
+      target: "Mục tiêu 180 cm nằm trong khoảng, ở nửa trên.",
+    });
+    expect(
+      goalPreview({ father: "175", mother: "160,5", target: "190" }, "boys")
+        ?.target,
+    ).toBe(
+      "Mục tiêu 190 cm cao hơn khoảng dự kiến. App vẫn theo dõi, nhưng mục tiêu này khó đạt.",
+    );
+  });
+
+  it("a girl's range sits 13 cm lower", () => {
+    expect(
+      goalPreview({ father: "175", mother: "160,5", target: "" }, "girls")
+        ?.range,
+    ).toBe("Khoảng dự kiến 153–170 cm");
+  });
+
+  it("a target that is not a valid height is left out, the range stays", () => {
+    for (const target of ["abc", "100", "250"])
+      expect(
+        goalPreview({ father: "175", mother: "160,5", target }, "boys"),
+      ).toEqual({ range: "Khoảng dự kiến 166–183 cm", target: null });
+  });
+
+  it("no range until both parents are valid", () => {
+    for (const raw of [
+      { father: "", mother: "", target: "180" },
+      { father: "175", mother: "", target: "180" },
+      { father: "", mother: "160", target: "" },
+      { father: "17", mother: "160", target: "" },
+      { father: "175", mother: "x", target: "" },
+    ])
+      expect(goalPreview(raw, "boys"), JSON.stringify(raw)).toBeNull();
+  });
+});
```

- [x] **Step 2: Chạy để thấy đỏ**

Run: `bunx vitest run`
Expected: FAIL, `Test Files  2 failed | 175 passed (177)`, `Tests  5 failed | 1484 passed (1489)`. Lý do đỏ: chưa có `goalPreview`; file test của sheet không chạy được test nào vì chưa có `./HeightGoalSheet`.

- [x] **Step 3: Viết code (Patch 2)**

```diff
diff --git a/components/height/HeightGoalSheet.tsx b/components/height/HeightGoalSheet.tsx
new file mode 100644
index 0000000..9b5bec1
--- /dev/null
+++ b/components/height/HeightGoalSheet.tsx
@@ -0,0 +1,133 @@
+"use client";
+
+import { useMutation, useQueryClient } from "@tanstack/react-query";
+import { useId, useState, type FormEvent } from "react";
+import { FIELD_INPUT, FIELD_LABEL } from "@/components/quick/styles";
+import { Button } from "@/components/ui/Button";
+import { Sheet } from "@/components/ui/Sheet";
+import { whoSex } from "@/lib/content/who";
+import { updateBaby } from "@/lib/data/baby";
+import { toVietnameseError } from "@/lib/data/errors";
+import {
+  type HeightGoalErrors,
+  type HeightGoalInput,
+  type HeightGoalRaw,
+  heightGoalRaw,
+  parseHeightGoal,
+} from "@/lib/rules/heightGoal";
+import { goalPreview } from "@/lib/rules/heightView";
+import type { Baby } from "@/lib/supabase/rows";
+
+const FIELDS: { key: keyof HeightGoalRaw; label: string; name: string }[] = [
+  { key: "father", label: "Bố", name: "Chiều cao của bố, cm" },
+  { key: "mother", label: "Mẹ", name: "Chiều cao của mẹ, cm" },
+  { key: "target", label: "Mục tiêu của con", name: "Mục tiêu của con, cm" },
+];
+const NOTE = "text-[13px] leading-[18px] text-muted";
+
+// Spec 2026-11-25 §6.5: the parents' heights and the target, entered by the
+// owner of the family. Saved straight to the baby's profile, not through the
+// outbox.
+export function HeightGoalSheet({
+  baby,
+  onClose,
+}: {
+  baby: Baby;
+  onClose: () => void;
+}) {
+  const queryClient = useQueryClient();
+  const formId = useId();
+  const [opened] = useState<HeightGoalRaw>(() => heightGoalRaw(baby));
+  const [raw, setRaw] = useState<HeightGoalRaw>(opened);
+  const [errors, setErrors] = useState<HeightGoalErrors>({});
+  const save = useMutation({
+    mutationFn: (value: HeightGoalInput) => updateBaby(baby.id, value),
+    onSuccess: () => {
+      void queryClient.invalidateQueries({ queryKey: ["family-context"] });
+      onClose();
+    },
+  });
+  const preview = goalPreview(raw, whoSex(baby.sex));
+
+  function submit(event: FormEvent) {
+    event.preventDefault();
+    const parsed = parseHeightGoal(raw);
+    if (!parsed.ok) {
+      setErrors(parsed.errors);
+      return;
+    }
+    setErrors({});
+    save.mutate(parsed.value);
+  }
+
+  return (
+    <Sheet
+      open
+      onClose={onClose}
+      title="Mục tiêu và chiều cao bố mẹ"
+      dirty={JSON.stringify(raw) !== JSON.stringify(opened)}
+      footer={
+        <div className="flex flex-col gap-2">
+          {save.isError && (
+            <p role="alert" className="text-[15px] text-danger">
+              {toVietnameseError(save.error)}
+            </p>
+          )}
+          <Button
+            type="submit"
+            form={formId}
+            block
+            busy={save.isPending}
+            className="min-h-14!"
+          >
+            Lưu
+          </Button>
+        </div>
+      }
+    >
+      <form id={formId} onSubmit={submit} className="flex flex-col gap-4 pt-1">
+        <p className={NOTE}>
+          Nhập một lần. App dùng để tính khoảng chiều cao dự kiến của{" "}
+          {baby.name}.
+        </p>
+        {FIELDS.map((field) => (
+          <label key={field.key} className="flex flex-col gap-1.5">
+            <span className={FIELD_LABEL}>{field.label}</span>
+            <span className="flex items-center gap-2">
+              <input
+                inputMode="decimal"
+                aria-label={field.name}
+                className={`${FIELD_INPUT} tabular-nums`}
+                value={raw[field.key]}
+                onChange={(event) => {
+                  setRaw({ ...raw, [field.key]: event.target.value });
+                  save.reset();
+                }}
+              />
+              <span className="text-[15px] text-muted">cm</span>
+            </span>
+            {errors[field.key] && (
+              <span className="text-[13px] text-danger">
+                {errors[field.key]}
+              </span>
+            )}
+          </label>
+        ))}
+        {preview && (
+          <div className="flex flex-col gap-1 rounded-[18px] bg-good-soft px-4 py-3 text-good-ink">
+            <span className="text-base font-bold">{preview.range}</span>
+            {preview.target && (
+              <span className="text-[13px] leading-[18px]">
+                {preview.target}
+              </span>
+            )}
+          </div>
+        )}
+        <p className={NOTE}>
+          Nếu mục tiêu nằm ngoài khoảng dự kiến, app vẫn theo dõi nhưng sẽ nói
+          rõ là khó đạt.
+        </p>
+      </form>
+    </Sheet>
+  );
+}
diff --git a/lib/rules/heightView.ts b/lib/rules/heightView.ts
index 06c3009..df60700 100644
--- a/lib/rules/heightView.ts
+++ b/lib/rules/heightView.ts
@@ -8,10 +8,12 @@ import {
   formatCm,
   type GoalStatus,
   goalStatus,
+  type HeightGoalRaw,
   type LengthVelocity,
   lengthVelocity,
   midParental,
   type ParentalRange,
+  parseHeightGoal,
   targetCurve,
   targetVsRange,
   targetZ,
@@ -182,3 +184,30 @@ export function heightView(input: {
     beyondTable,
   };
 }
+
+// Spec 2026-11-25 §6.5: the box the sheet shows while the heights are typed.
+// Null until both parents' heights are valid; a target that is not a valid
+// height is left out.
+export function goalPreview(
+  raw: HeightGoalRaw,
+  sex: WhoSex,
+): { range: string; target: string | null } | null {
+  const parents = parseHeightGoal({ ...raw, target: "" });
+  if (
+    !parents.ok ||
+    parents.value.father_height_cm === null ||
+    parents.value.mother_height_cm === null
+  )
+    return null;
+  const range = midParental(
+    parents.value.father_height_cm,
+    parents.value.mother_height_cm,
+    sex,
+  );
+  const goal = parseHeightGoal({ father: "", mother: "", target: raw.target });
+  const target = goal.ok ? goal.value.target_height_cm : null;
+  return {
+    range: `Khoảng dự kiến ${range.low}–${range.high} cm`,
+    target: target === null ? null : targetVsRange(target, range),
+  };
+}
```

- [x] **Step 4: Chạy để thấy xanh**

Run: `bunx vitest run && bun run typecheck`
Expected: `Test Files  177 passed (177)`, `Tests  1501 passed (1501)`; `tsc --noEmit` không báo lỗi.

- [x] **Step 5: Commit**

```bash
git add components/height/HeightGoalSheet.tsx components/height/heightgoalsheet.test.tsx lib/rules/heightView.ts lib/rules/heightView.test.ts
git commit -m "feat(height): the sheet for the goal and the parents' heights" -m "Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>"
```

### Task 2: Trang Chiều cao ở `/tang-truong/chieu-cao` (§6.3)

**Files:**

- Create: `components/height/HeightScreen.tsx`, `app/tang-truong/chieu-cao/page.tsx`
- Test: `components/height/heightscreen.test.tsx` (mới)

**Interfaces:**

- Consumes: `HeightGoalSheet` (Task 1); `heightView`; bốn thẻ của `HeightCards.tsx`; `GrowthChart` (tải lười bằng `dynamic`); `useGrowth`, `useWhoTable`; `PageHeader`, `IconButton`, `Skeleton`, `ErrorCard`, `NeedsNetwork`, `waitingForNetwork`; `AuthGate`.
- Produces: `HeightScreen({ baby, isOwner })`; đường dẫn `/tang-truong/chieu-cao`.

- [x] **Step 1: Viết test đỏ (Patch 3)**

```diff
diff --git a/components/height/heightscreen.test.tsx b/components/height/heightscreen.test.tsx
new file mode 100644
index 0000000..5afad9c
--- /dev/null
+++ b/components/height/heightscreen.test.tsx
@@ -0,0 +1,273 @@
+import { renderToStaticMarkup } from "react-dom/server";
+import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
+import type { Baby, GrowthRow } from "@/lib/supabase/rows";
+import { HeightScreen } from "./HeightScreen";
+
+const state = vi.hoisted(() => ({
+  growth: {} as Record<string, unknown>,
+  table: {} as Record<string, unknown>,
+}));
+const useGrowth = vi.hoisted(() => vi.fn());
+const useWhoTable = vi.hoisted(() => vi.fn());
+
+vi.mock("@/lib/data/growth", () => ({ useGrowth, useWhoTable }));
+// The chart is loaded lazily; a stand-in shows what it was given.
+vi.mock("next/dynamic", () => ({
+  default:
+    () =>
+    ({
+      unit,
+      points,
+      target,
+      label,
+    }: {
+      unit: string;
+      points: unknown[];
+      target?: unknown[];
+      label: string;
+    }) => (
+      <div
+        data-chart={`${unit}:${points.length}:${target?.length ?? "none"}`}
+        aria-label={label}
+      />
+    ),
+}));
+
+const LOADING = {
+  data: undefined,
+  isPending: true,
+  isError: false,
+  error: null,
+  fetchStatus: "fetching",
+  refetch: () => {},
+};
+const OFFLINE = { ...LOADING, fetchStatus: "paused" };
+const FAILED = {
+  ...LOADING,
+  isPending: false,
+  isError: true,
+  error: new Error("boom"),
+  fetchStatus: "idle",
+};
+const loaded = (data: unknown) => ({
+  ...LOADING,
+  data,
+  isPending: false,
+  fetchStatus: "idle",
+});
+// The median length is 58,5 cm on every day; z = (value / 58,5 − 1) × 8.
+const TABLE = loaded({
+  rows: Array.from({ length: 1857 }, (_, day) => [day, 1, 58.5, 0.125]),
+});
+
+const measure = (measured_on: string, length_cm: number) =>
+  ({
+    id: `g-${measured_on}`,
+    baby_id: "b1",
+    measured_on,
+    weight_g: null,
+    length_cm,
+    head_cm: null,
+    created_by: "u1",
+    created_at: `${measured_on}T03:00:00.000Z`,
+    updated_at: `${measured_on}T03:00:00.000Z`,
+  }) as GrowthRow;
+const ROWS = [measure("2026-11-15", 62), measure("2026-10-14", 58.5)];
+
+const baby = (over: Partial<Baby> = {}) =>
+  ({
+    id: "b1",
+    family_id: "f1",
+    name: "Bun",
+    dob: "2026-09-14",
+    sex: "male",
+    father_height_cm: 172,
+    mother_height_cm: 164,
+    target_height_cm: 180,
+    ...over,
+  }) as unknown as Baby;
+
+function render(
+  query: { growth?: unknown; table?: unknown } = {},
+  who: Baby = baby(),
+  isOwner = true,
+) {
+  state.growth = (query.growth ?? loaded(ROWS)) as Record<string, unknown>;
+  state.table = (query.table ?? TABLE) as Record<string, unknown>;
+  return renderToStaticMarkup(<HeightScreen baby={who} isOwner={isOwner} />);
+}
+
+beforeAll(() => {
+  useGrowth.mockImplementation(() => state.growth);
+  useWhoTable.mockImplementation(() => state.table);
+  vi.useFakeTimers({ toFake: ["Date"] });
+  vi.setSystemTime(new Date("2026-11-20T05:00:00Z")); // 12:00 giờ VN
+});
+afterAll(() => vi.useRealTimers());
+
+// Spec 2026-11-25 §6.3.
+describe("HeightScreen", () => {
+  it("is titled Chiều cao and goes back to Tăng trưởng", () => {
+    const html = render();
+    expect(html).toContain(">Chiều cao</h1>");
+    expect(html).toMatch(/href="\/tang-truong"[^>]*>.*Tăng trưởng<\/a>/);
+  });
+
+  it("reads the measurements of this baby and the length table of the baby's sex", () => {
+    useGrowth.mockClear();
+    useWhoTable.mockClear();
+    render();
+    expect(useGrowth).toHaveBeenCalledWith("b1");
+    expect(useWhoTable.mock.calls).toEqual([["lhfa", "boys"]]);
+    useWhoTable.mockClear();
+    render({}, baby({ sex: "female" }));
+    expect(useWhoTable.mock.calls).toEqual([["lhfa", "girls"]]);
+  });
+
+  it("the blocks come in order: goal, parents, path, speed, the closing note", () => {
+    const html = render();
+    const order = [
+      ">Mục tiêu lúc trưởng thành</span>",
+      ">Di truyền dự kiến</h2>",
+      ">Đường tới 180 cm</h2>",
+      ">Tốc độ tăng</span>",
+      ">Chiều cao lúc lớn phần lớn do di truyền. Kim Bun giúp theo dõi và nhắc việc, không thay lời khuyên của bác sĩ.</p>",
+    ].map((mark) => html.indexOf(mark));
+    expect(order.every((i) => i >= 0)).toBe(true);
+    expect([...order].sort((a, b) => a - b)).toEqual(order);
+  });
+
+  it("the goal card says where the newest length stands against the target line", () => {
+    // 180 cm is z +0,47 for a man: the line is at 61,96 cm. 62 cm is on it.
+    const html = render();
+    expect(html).toContain(">180</span>");
+    expect(html).toContain(
+      ">Bun dài 62 cm lúc 2 tháng 1 ngày. Sát đường mục tiêu.</p>",
+    );
+    expect(html).toContain(">Đang đúng hướng</span>");
+  });
+
+  it("the parents' card carries their heights and the range", () => {
+    const html = render();
+    expect(html).toContain(">Bố 172 cm · Mẹ 164 cm</span>");
+    expect(html).toContain(
+      ">Khoảng dự kiến 166–183 cm. Mục tiêu 180 cm nằm trong khoảng, ở nửa trên.</p>",
+    );
+  });
+
+  it("the chart gets the baby's lengths in cm and the target line", () => {
+    const html = render();
+    // chartRange at 67 days: the first year, a point a week, 53 points.
+    expect(html).toContain('data-chart="cm:2:53"');
+    expect(html).toContain(
+      'aria-label="Đường tới 180 cm. 2 lần đo chiều dài."',
+    );
+    expect(html).toContain(
+      "một bé trai sẽ cao 180 cm khi lớn, nếu giữ nguyên vị trí trên biểu đồ WHO.",
+    );
+  });
+
+  it("the speed card compares the two lengths 32 days apart", () => {
+    const html = render();
+    expect(html).toContain(">3,3 cm mỗi tháng</span>");
+    expect(html).toContain(
+      ">Từ 14/10 đến 15/11 · bé cùng tuổi thường tăng khoảng 0,0 cm mỗi tháng</span>",
+    );
+  });
+
+  it("no target: the goal card says so, there is no path, the rest stays", () => {
+    const html = render({}, baby({ target_height_cm: null }));
+    expect(html).toContain(">Chưa có mục tiêu chiều cao</p>");
+    expect(html).not.toContain("Đường tới");
+    expect(html).not.toContain("data-chart");
+    expect(html).toContain(">Khoảng dự kiến 166–183 cm.</p>");
+    expect(html).toContain(">Tốc độ tăng</span>");
+  });
+
+  it("no target, another member: told that the owner has not set one", () => {
+    const html = render({}, baby({ target_height_cm: null }), false);
+    expect(html).toContain(">Chủ gia đình chưa đặt mục tiêu chiều cao.</p>");
+  });
+
+  it("the owner gets a pencil that edits the goal and the parents' heights; other members do not", () => {
+    expect(render()).toContain('aria-label="Sửa mục tiêu và chiều cao bố mẹ"');
+    expect(render({}, baby(), false)).not.toContain(
+      "Sửa mục tiêu và chiều cao bố mẹ",
+    );
+  });
+
+  it("no target, the owner: a button to set one", () => {
+    const html = render({}, baby({ target_height_cm: null }));
+    expect(html).toContain(">Đặt mục tiêu</button>");
+    expect(render({}, baby({ target_height_cm: null }), false)).not.toContain(
+      "Đặt mục tiêu",
+    );
+  });
+
+  it("the sheet is closed until asked for", () => {
+    expect(render()).not.toContain("<dialog");
+  });
+
+  it("the pencil is there while the page loads too", () => {
+    expect(render({ growth: LOADING })).toContain(
+      'aria-label="Sửa mục tiêu và chiều cao bố mẹ"',
+    );
+  });
+
+  it("no parents' heights: the card asks for them", () => {
+    const html = render(
+      {},
+      baby({ father_height_cm: null, mother_height_cm: null }),
+    );
+    expect(html).toContain(">Nhập chiều cao bố mẹ để xem khoảng dự kiến.</p>");
+  });
+
+  it("no measurement: the goal says so and the speed card says what it needs", () => {
+    const html = render({ growth: loaded([]) });
+    expect(html).toContain(">Chưa có lần đo chiều dài.</p>");
+    expect(html).toContain(
+      ">Cần hai lần đo chiều dài cách nhau từ 14 ngày.</p>",
+    );
+    expect(html).toContain('data-chart="cm:0:53"');
+  });
+
+  it("older than the WHO table: one line in place of the path and the speed", () => {
+    const html = render({}, baby({ dob: "2021-01-01" }));
+    expect(html).toContain(">Bảng WHO trong app tới 5 tuổi.</p>");
+    expect(html).not.toContain("data-chart");
+    expect(html).not.toContain("Tốc độ tăng");
+    expect(html).toContain(">Di truyền dự kiến</h2>");
+    expect(html).toContain("Chiều cao lúc lớn phần lớn do di truyền.");
+  });
+
+  it("while the measurements or the table load: the header and placeholders only", () => {
+    for (const html of [
+      render({ growth: LOADING }),
+      render({ table: LOADING }),
+    ]) {
+      expect(html).toContain(">Chiều cao</h1>");
+      expect(html).toContain("kb-pulse");
+      expect(html).not.toContain("Di truyền dự kiến");
+      expect(html).not.toContain("Chiều cao lúc lớn");
+    }
+  });
+
+  // The WHO table is loaded with networkMode "always": it never pauses, so
+  // only the measurements can be waiting for the network.
+  it("offline before the first load: says what needs the network", () => {
+    expect(render({ growth: OFFLINE })).toContain(
+      "Cần mạng để tải các lần đo. Trang sẽ tự tải khi có mạng lại.",
+    );
+  });
+
+  it("a failed load: the error card with a retry", () => {
+    for (const html of [
+      render({ growth: FAILED }),
+      render({ table: FAILED }),
+    ]) {
+      expect(html).toContain('role="alert"');
+      expect(html).toContain(">Thử lại</button>");
+      expect(html).not.toContain("Di truyền dự kiến");
+    }
+  });
+});
```

- [x] **Step 2: Chạy để thấy đỏ**

Run: `bunx vitest run`
Expected: FAIL, `Test Files  1 failed | 177 passed (178)`, `Tests  1501 passed (1501)`. File test mới không chạy được test nào vì chưa có `./HeightScreen`.

- [x] **Step 3: Viết code (Patch 4)**

```diff
diff --git a/app/tang-truong/chieu-cao/page.tsx b/app/tang-truong/chieu-cao/page.tsx
new file mode 100644
index 0000000..80be20e
--- /dev/null
+++ b/app/tang-truong/chieu-cao/page.tsx
@@ -0,0 +1,16 @@
+"use client";
+
+import { AuthGate } from "@/components/AuthGate";
+import { HeightScreen } from "@/components/height/HeightScreen";
+
+export default function Page() {
+  return (
+    <AuthGate need="baby">
+      {({ session, ctx }) =>
+        ctx?.baby && session ? (
+          <HeightScreen baby={ctx.baby} isOwner={ctx.member.role === "owner"} />
+        ) : null
+      }
+    </AuthGate>
+  );
+}
diff --git a/components/height/HeightScreen.tsx b/components/height/HeightScreen.tsx
new file mode 100644
index 0000000..426ecfa
--- /dev/null
+++ b/components/height/HeightScreen.tsx
@@ -0,0 +1,141 @@
+"use client";
+
+import dynamic from "next/dynamic";
+import { useState } from "react";
+import { ErrorCard } from "@/components/ui/ErrorCard";
+import { IconButton } from "@/components/ui/IconButton";
+import { NeedsNetwork, waitingForNetwork } from "@/components/ui/NeedsNetwork";
+import { PageHeader } from "@/components/ui/PageHeader";
+import { Skeleton } from "@/components/ui/Skeleton";
+import { whoSex, type LmsRow } from "@/lib/content/who";
+import { toVietnameseError } from "@/lib/data/errors";
+import { useGrowth, useWhoTable } from "@/lib/data/growth";
+import { heightView } from "@/lib/rules/heightView";
+import type { Baby } from "@/lib/supabase/rows";
+import {
+  HeightGoalCard,
+  ParentalRangeCard,
+  TargetPathCard,
+  VelocityCard,
+} from "./HeightCards";
+import { HeightGoalSheet } from "./HeightGoalSheet";
+
+const NOTE = "px-1 text-[13px] leading-[18px] text-muted";
+
+function ChartUnavailable() {
+  return <p className="h-72 text-muted">Biểu đồ cần mạng để tải lần đầu.</p>;
+}
+
+const GrowthChart = dynamic(
+  () =>
+    import("@/components/growth/GrowthChart")
+      .then((m) => m.GrowthChart)
+      .catch(() => ChartUnavailable),
+  { ssr: false, loading: () => <div className="h-72" /> },
+);
+
+// Spec 2026-11-25 §6.3: the target height, the range the parents' heights
+// give, the path to the target and how fast the baby is growing.
+export function HeightScreen({
+  baby,
+  isOwner,
+}: {
+  baby: Baby;
+  isOwner: boolean;
+}) {
+  const growth = useGrowth(baby.id);
+  // Spec §6.5: only the owner of the family may open the sheet.
+  const [editing, setEditing] = useState(false);
+  const edit = isOwner ? () => setEditing(true) : undefined;
+  const sex = whoSex(baby.sex);
+  const table = useWhoTable("lhfa", sex);
+  const view =
+    growth.data && table.data
+      ? heightView({
+          baby: {
+            name: baby.name,
+            dob: baby.dob,
+            sex,
+            father_height_cm: baby.father_height_cm,
+            mother_height_cm: baby.mother_height_cm,
+            target_height_cm: baby.target_height_cm,
+          },
+          rows: growth.data,
+          table: table.data.rows as LmsRow[],
+          today: new Date(),
+        })
+      : null;
+
+  return (
+    <main className="mx-auto flex max-w-md flex-col gap-[18px] px-4 pt-2 pb-4">
+      <PageHeader
+        title="Chiều cao"
+        back={{ href: "/tang-truong", label: "Tăng trưởng" }}
+        action={
+          edit && (
+            <IconButton
+              label="Sửa mục tiêu và chiều cao bố mẹ"
+              icon="pencil"
+              onClick={edit}
+            />
+          )
+        }
+      />
+      {view ? (
+        <>
+          <HeightGoalCard goal={view.goal} isOwner={isOwner} onSet={edit} />
+          <ParentalRangeCard parents={view.parents} />
+          {view.beyondTable ? (
+            <p className={NOTE}>Bảng WHO trong app tới 5 tuổi.</p>
+          ) : (
+            <>
+              {view.path && (
+                <TargetPathCard
+                  title={view.path.title}
+                  babyName={baby.name}
+                  note={view.path.note}
+                >
+                  <GrowthChart
+                    band={view.path.band}
+                    points={view.path.points}
+                    last={view.path.last}
+                    to={view.path.to}
+                    unit="cm"
+                    label={view.path.ariaLabel}
+                    target={view.path.target}
+                  />
+                </TargetPathCard>
+              )}
+              <VelocityCard velocity={view.velocity} />
+            </>
+          )}
+          <p className={NOTE}>
+            Chiều cao lúc lớn phần lớn do di truyền. Kim Bun giúp theo dõi và
+            nhắc việc, không thay lời khuyên của bác sĩ.
+          </p>
+        </>
+      ) : waitingForNetwork(growth) ? (
+        <NeedsNetwork what="các lần đo" />
+      ) : growth.isError && !growth.data ? (
+        <ErrorCard
+          message={toVietnameseError(growth.error)}
+          onRetry={() => void growth.refetch()}
+        />
+      ) : table.isError ? (
+        <ErrorCard
+          message={toVietnameseError(table.error)}
+          onRetry={() => void table.refetch()}
+        />
+      ) : (
+        <div className="flex flex-col gap-[18px]">
+          {[0, 1, 2].map((i) => (
+            <Skeleton key={i} className="h-[120px]" />
+          ))}
+        </div>
+      )}
+      {editing && (
+        <HeightGoalSheet baby={baby} onClose={() => setEditing(false)} />
+      )}
+    </main>
+  );
+}
```

- [x] **Step 4: Chạy để thấy xanh**

Run: `bunx vitest run && bun run typecheck`
Expected: `Test Files  178 passed (178)`, `Tests  1520 passed (1520)`; `tsc --noEmit` không báo lỗi.

- [x] **Step 5: Commit**

```bash
git add components/height/HeightScreen.tsx components/height/heightscreen.test.tsx app/tang-truong/chieu-cao
git commit -m "feat(height): the Chiều cao page at /tang-truong/chieu-cao" -m "Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>"
```

### Task 3: Thẻ mục tiêu: nhãn một dòng, chip cạnh số (§6.3 mục 2)

**Files:**

- Modify: `components/height/HeightCards.tsx`
- Test: `components/height/heightcards.test.tsx`

**Interfaces:**

- Consumes: `HeightGoalCard` (M3b).
- Produces: cùng prop; chip nằm cùng hàng với số, hàng đó được xuống dòng.

- [x] **Step 1: Viết test đỏ (Patch 5)**

```diff
diff --git a/components/height/heightcards.test.tsx b/components/height/heightcards.test.tsx
index 9cf420e..cf2e370 100644
--- a/components/height/heightcards.test.tsx
+++ b/components/height/heightcards.test.tsx
@@ -35,6 +35,21 @@ describe("HeightGoalCard", () => {
     );
   });

+  // At 375 px the label and a chip such as "Dưới đường mục tiêu" do not fit
+  // on one line: the label wrapped onto two.
+  // The longest pair, "190,5 cm" and "Dưới đường mục tiêu", is close to the
+  // width of the card: the row wraps, so the chip can never run past its edge.
+  it("the label has a line to itself; the chip sits on the line of the figure", () => {
+    const html = renderToStaticMarkup(<HeightGoalCard goal={goal} isOwner />);
+    expect(html).toContain(
+      '>Mục tiêu lúc trưởng thành</span><div class="flex flex-wrap items-center justify-between gap-x-2 gap-y-1"><span class="flex items-baseline gap-2">',
+    );
+    expect(html.indexOf("Đang đúng hướng")).toBeGreaterThan(
+      html.indexOf(">cm</span>"),
+    );
+    expect(html.indexOf("Đang đúng hướng")).toBeLessThan(html.indexOf("<p"));
+  });
+
   it("below the line is said in a neutral chip, never in warn or danger", () => {
     const html = renderToStaticMarkup(
       <HeightGoalCard
```

- [x] **Step 2: Chạy để thấy đỏ**

Run: `bunx vitest run`
Expected: FAIL, `Test Files  1 failed | 177 passed (178)`, `Tests  1 failed | 1520 passed (1521)`. Lý do đỏ: chip còn nằm cùng hàng với nhãn.

- [x] **Step 3: Viết code (Patch 6)**

```diff
diff --git a/components/height/HeightCards.tsx b/components/height/HeightCards.tsx
index 36b8c9f..5b79a40 100644
--- a/components/height/HeightCards.tsx
+++ b/components/height/HeightCards.tsx
@@ -40,18 +40,21 @@ export function HeightGoalCard({
     );
   return (
     <section className={`${CARD} gap-2`}>
-      <div className="flex items-center justify-between gap-2">
-        <span className={LABEL}>Mục tiêu lúc trưởng thành</span>
+      <span className={LABEL}>Mục tiêu lúc trưởng thành</span>
+      {/* The chip sits on the line of the figure: beside the label, a chip
+          such as "Dưới đường mục tiêu" pushed the label onto two lines at
+          375 px. The row wraps, so the chip never runs past the card. */}
+      <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
+        <span className="flex items-baseline gap-2">
+          <span className="text-[44px] leading-[48px] font-bold tracking-[-0.02em] text-ink tabular-nums">
+            {goal.target}
+          </span>
+          <span className="text-xl leading-[26px] font-bold text-ink">cm</span>
+        </span>
         {goal.chip && (
           <StatusChip tone={goal.chip.tone}>{goal.chip.text}</StatusChip>
         )}
       </div>
-      <div className="flex items-baseline gap-2">
-        <span className="text-[44px] leading-[48px] font-bold tracking-[-0.02em] text-ink tabular-nums">
-          {goal.target}
-        </span>
-        <span className="text-xl leading-[26px] font-bold text-ink">cm</span>
-      </div>
       <p className={BODY}>{goal.sentence}</p>
     </section>
   );
```

- [x] **Step 4: Chạy để thấy xanh**

Run: `bunx vitest run && bun run typecheck`
Expected: `Test Files  178 passed (178)`, `Tests  1521 passed (1521)`; `tsc --noEmit` không báo lỗi.

- [x] **Step 5: Commit**

```bash
git add components/height/HeightCards.tsx components/height/heightcards.test.tsx
git commit -m "fix(height): the goal card keeps its label on one line; the chip sits beside the figure" -m "Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>"
```

### Task 4: Kiểm cuối M3c và hỏi người dùng trước khi lên `main`

**Files:**

- Create rồi xóa trước khi commit: `app/fixture-height/page.tsx` (trang tạm, không commit)
- Modify: file plan này (ghi kết quả kiểm)

**Interfaces:**

- Consumes: mọi thứ của các task trước trong plan này.
- Produces: kết quả kiểm, ghi ngay trong plan.

- [x] **Step 1: Chạy cả bộ kiểm**

Run: `bun run typecheck && bunx vitest run`
Expected: `tsc --noEmit` không báo lỗi; `Test Files  178 passed (178)`, `Tests  1521 passed (1521)`.

- [x] **Step 2: Build**

Run: `bun run build`
Expected: lần đầu có thể dừng với thông báo bảo mật của Next.js 16.4.3 (bình thường). Chạy lại đúng lệnh đó: `✓ Generating static pages` và thoát mã 0; danh sách trang có `/tang-truong/chieu-cao`.

- [x] **Step 3: Tạo trang fixture tạm cho các trạng thái dữ liệu thật chưa có**

Trang này không đọc hay ghi dữ liệu của gia đình. Nó dựng thẻ mục tiêu từ số cho sẵn và mở sheet trên một bé giả. Tạo `app/fixture-height/page.tsx`:

```tsx
"use client";

import { useState } from "react";
import { HeightGoalCard } from "@/components/height/HeightCards";
import { HeightGoalSheet } from "@/components/height/HeightGoalSheet";
import { Button } from "@/components/ui/Button";
import type { HeightView } from "@/lib/rules/heightView";
import type { Baby } from "@/lib/supabase/rows";

// Thẻ mục tiêu sau khi chip chuyển xuống hàng của số: cặp dài nhất trước.
const GOALS: NonNullable<HeightView["goal"]>[] = [
  {
    target: "190,5",
    chip: { text: "Dưới đường mục tiêu", tone: "neutral" },
    sentence:
      "Bun dài 61,5 cm lúc 2 tháng 15 ngày. Dưới đường mục tiêu 2,4 cm.",
  },
  {
    target: "180",
    chip: { text: "Đang đúng hướng", tone: "good" },
    sentence: "Bun dài 61,5 cm lúc 2 tháng 15 ngày. Sát đường mục tiêu.",
  },
  { target: "180", chip: null, sentence: "Chưa có lần đo chiều dài." },
];

// Một bé giả, không có trong DB: sheet mở trên các số đã lưu sẵn. KHÔNG bấm Lưu.
const SAVED = {
  id: "fixture",
  name: "Bun",
  dob: "2026-09-10",
  sex: "male",
  father_height_cm: 172,
  mother_height_cm: 164,
  target_height_cm: 180,
} as unknown as Baby;

export default function Page() {
  const [sheet, setSheet] = useState(false);
  return (
    <main className="mx-auto flex max-w-md flex-col gap-[18px] px-4 pt-2 pb-32">
      <p className="text-ink">Fixture thẻ mục tiêu và sheet</p>
      {GOALS.map((goal) => (
        <HeightGoalCard key={goal.sentence} goal={goal} isOwner />
      ))}
      <HeightGoalCard goal={null} isOwner onSet={() => setSheet(true)} />
      <Button variant="secondary" onClick={() => setSheet(true)}>
        Mở sheet với số đã lưu (không bấm Lưu)
      </Button>
      {sheet && (
        <HeightGoalSheet baby={SAVED} onClose={() => setSheet(false)} />
      )}
    </main>
  );
}
```

- [x] **Step 4: Kiểm trong trình duyệt (chỉ xem, không bấm Lưu)**

Hỏi người dùng dùng trình duyệt nào trước khi mở (xem Diễn giải spec, mục 9). Chạy `bun run dev`. Cỡ 375×812.

Trên trang tạm `http://localhost:3000/fixture-height`:

1. **Thẻ thứ nhất** (cặp dài nhất): nhãn "Mục tiêu lúc trưởng thành" nằm trên **một dòng**; hàng dưới có "190,5" cỡ lớn, "cm", và chip "Dưới đường mục tiêu" (nền xám). Đo bằng `getBoundingClientRect()` (ảnh chụp thu nhỏ có thể che mất một chip lấn 1–2 px) và ghi lại: bề ngang của cụm số, của chip, mép phải của chip so với mép phải của thẻ, và chip nằm cùng hàng với số hay đã xuống dưới số. Cả hai chỗ đặt đều đúng; sai là khi chip tràn ra ngoài thẻ hoặc bị cắt.
2. **Thẻ thứ hai:** "180 cm" và chip "Đang đúng hướng" (nền xanh) cùng một hàng, chip sát mép phải. **Thẻ thứ ba:** không có chip, "180 cm" đứng một mình. **Thẻ thứ tư:** "Chưa có mục tiêu chiều cao" và nút "Đặt mục tiêu".
3. Chạm "Mở sheet với số đã lưu": sheet mở, ba ô đã có "172", "164", "180"; hộp nền xanh ghi "Khoảng dự kiến 166–183 cm" và "Mục tiêu 180 cm nằm trong khoảng, ở nửa trên."; dưới hộp là dòng xám "Nếu mục tiêu nằm ngoài khoảng dự kiến, app vẫn theo dõi nhưng sẽ nói rõ là khó đạt."; nút "Lưu" ở chân sheet. **Không bấm "Lưu".** Đóng sheet: vì chưa sửa gì nên nó đóng luôn, không hỏi.
4. `document.documentElement.scrollWidth <= window.innerWidth` là `true`.
5. Lặp mục 1 đến 3 với `document.documentElement.dataset.theme = "rose"`, `"light"`, `"dark"`, `"night"`: chip, hộp xanh và ô nhập đọc rõ.

Trang thật `http://localhost:3000/tang-truong/chieu-cao` (dữ liệu thật của gia đình: chỉ xem):

6. Tiêu đề "Chiều cao"; nút quay lại ghi "Tăng trưởng" và đưa về `/tang-truong`. Tab "Sức khỏe" ở thanh dưới vẫn sáng.
7. Ghi lại tài khoản đang đăng nhập là chủ gia đình hay thành viên. Chủ gia đình: có nút tròn hình bút chì ở góc phải tiêu đề. Thành viên: không có nút đó.
8. Khi chưa có mục tiêu: thẻ đầu ghi "Chưa có mục tiêu chiều cao"; chủ gia đình thấy nút "Đặt mục tiêu", thành viên thấy dòng "Chủ gia đình chưa đặt mục tiêu chiều cao.". Thẻ "Di truyền dự kiến" ghi "Nhập chiều cao bố mẹ để xem khoảng dự kiến." Không có thẻ "Đường tới".
9. Thẻ "Tốc độ tăng": ghi lại đang thấy gì. Không có hai lần đo chiều dài nào cách nhau từ 14 ngày thì kỳ vọng "Cần hai lần đo chiều dài cách nhau từ 14 ngày."; có thì là một con số "… cm mỗi tháng" kèm chip.
10. Cuối trang có đoạn "Chiều cao lúc lớn phần lớn do di truyền. Kim Bun giúp theo dõi và nhắc việc, không thay lời khuyên của bác sĩ."
11. `document.documentElement.scrollWidth <= window.innerWidth` là `true`.

Sheet trên trang thật (chỉ khi tài khoản là chủ gia đình; **không bấm "Lưu"**):

12. Chạm nút bút chì, hoặc "Đặt mục tiêu": sheet mở, tiêu đề "Mục tiêu và chiều cao bố mẹ", dòng "Nhập một lần. App dùng để tính khoảng chiều cao dự kiến của {Tên bé}.", ba ô "Bố", "Mẹ", "Mục tiêu của con" đều có chữ "cm" bên phải. Ghi lại ba ô đang trống hay đã có số.
13. Gõ 172 vào "Bố", 164 vào "Mẹ": hiện hộp nền xanh "Khoảng dự kiến 166–183 cm" (với bé trai; bé gái là 153–170). Gõ thêm 180 vào "Mục tiêu của con": hộp có thêm "Mục tiêu 180 cm nằm trong khoảng, ở nửa trên.". Đổi mục tiêu thành 190: câu thành "Mục tiêu 190 cm cao hơn khoảng dự kiến. App vẫn theo dõi, nhưng mục tiêu này khó đạt."
14. Xóa ô "Mẹ": hộp xanh biến mất.
15. Đóng sheet (vuốt xuống hoặc chạm vùng tối): app hỏi có bỏ thay đổi không; chọn bỏ. Trang phía sau không đổi, các thẻ vẫn như mục 8.

Dừng `bun run dev` khi xong. Ghi kết quả từng mục ngay dưới bước này. Mục nào không cho thấy được thì ghi "chưa kiểm". Ghi rõ: trạng thái "đã có mục tiêu" của trang thật và chính lần bấm "Lưu" chưa ai kiểm (Diễn giải spec, mục 2 và 8).

**Kết quả (2026-11-25).** Người dùng chọn khung Browser trong app (question card). Cỡ 375×812, DPR 2, còn đăng nhập, theme mở sẵn là `night`. Nhánh `feat/kim-bun-suc-khoe-m3c` ở commit `9fb680a`.

Trước bước này: 6 patch áp sạch bằng `kb_patch`, không sửa tay; đỏ và xanh của ba task đúng `Expected`. Step 1: `tsc --noEmit` sạch, `Test Files  178 passed (178)`, `Tests  1521 passed (1521)`. Step 2: `bun run build` lần đầu mã 1 (`SecurityFatalError` của Next.js 16.4.3, không chạy `next upgrade`), lần hai mã 0, 40/40 trang, có `/tang-truong/chieu-cao`.

Trang tạm `/fixture-height` (số cho sẵn, không phải dữ liệu của gia đình):

1. Đạt. Nhãn "Mục tiêu lúc trưởng thành" một dòng ở cả ba thẻ có nhãn. Thẻ thứ nhất, đo bằng `getBoundingClientRect()`: thẻ rộng 343 px, phần trong 309 px; cụm số "190,5 cm" rộng 158,9 px; chip "Dưới đường mục tiêu" rộng 150,8 px. Hai thứ cùng hàng cần 317,7 px (plan ước 304 px), nhiều hơn 309 px, nên **chip xuống dưới số**, canh trái, mép phải của chip cách mép phải của thẻ 175,2 px. Chip một dòng, không bị cắt, không tràn. Hai chip có trong luật là "Đang đúng hướng" (132,3 px) và "Dưới đường mục tiêu" (150,8 px); số nguyên như "180" rộng 120,8 px. Suy ra ở 375 px chỉ đúng một cặp rớt dòng: mục tiêu có phần lẻ (như 190,5) đi với chip "Dưới đường mục tiêu". Mọi cặp khác nằm cùng hàng.
2. Đạt. Thẻ thứ hai: "180 cm" và chip "Đang đúng hướng" cùng hàng, chip sát mép phải của phần trong thẻ (cách mép thẻ 17 px). Thẻ thứ ba: không chip. Thẻ thứ tư: "Chưa có mục tiêu chiều cao" và nút "Đặt mục tiêu".
3. Đạt. Sheet mở với "172", "164", "180"; hộp "Khoảng dự kiến 166–183 cm" và "Mục tiêu 180 cm nằm trong khoảng, ở nửa trên."; dòng xám nằm dưới hộp; nút "Lưu" ở chân sheet, cao 56 px; ba ô cao 44 px. Không bấm "Lưu". Đóng bằng nút "Đóng" và bằng Esc: đóng luôn, không hỏi.
4. `true`.
5. Đạt ở `night`, `rose`, `light`, `dark`: chip, hộp xanh và ô nhập đọc rõ; số đo của thẻ giống nhau ở cả bốn theme.

Trang thật `/tang-truong/chieu-cao`:

6. Đạt. Tiêu đề "Chiều cao"; nút quay lại ghi "Tăng trưởng", chạm vào thì về `/tang-truong`; tab "Sức khỏe" sáng (`aria-current="page"`) ở cả hai trang.
7. Tài khoản đang đăng nhập là chủ gia đình: có nút bút chì 44×44 px ở góc phải tiêu đề. Phía thành viên: chưa kiểm trong trình duyệt (chỉ có test).
8. Đạt. "Chưa có mục tiêu chiều cao" và nút "Đặt mục tiêu"; thẻ "Di truyền dự kiến" ghi "Nhập chiều cao bố mẹ để xem khoảng dự kiến."; không có thẻ "Đường tới", không có biểu đồ.
9. Thẻ "Tốc độ tăng" ghi "Cần hai lần đo chiều dài cách nhau từ 14 ngày.": dữ liệu thật chưa có hai lần đo chiều dài cách nhau đủ xa.
10. Đạt.
11. `true`. Không phần tử nào bị cắt chữ. Console không có lỗi.

Sheet trên trang thật (chủ gia đình, không bấm "Lưu", không nhấn Enter):

12. Đạt. Mở bằng nút bút chì. Tiêu đề, dòng "Nhập một lần. App dùng để tính khoảng chiều cao dự kiến của Bun.", ba ô "Bố", "Mẹ", "Mục tiêu của con" có "cm" bên phải. Ba ô đang trống, chưa có hộp xanh. Nút "Đặt mục tiêu" của trang thật: chưa chạm (cùng một hàm với nút bút chì; đã chạm nút tương ứng trên trang tạm).
13. Đạt. 172 và 164: "Khoảng dự kiến 166–183 cm" (Bun là bé trai). Thêm 180: "Mục tiêu 180 cm nằm trong khoảng, ở nửa trên.". Đổi thành 190: "Mục tiêu 190 cm cao hơn khoảng dự kiến. App vẫn theo dõi, nhưng mục tiêu này khó đạt."
14. Đạt. Ô "Mẹ" còn "16" (số chưa hợp lệ) thì hộp xanh đã mất; xóa trống hẳn cũng vậy.
15. Đạt. Esc: app hỏi "Bỏ thay đổi?" với "Bỏ thay đổi" và "Tiếp tục nhập". "Tiếp tục nhập" quay lại sheet còn nguyên số; "Bỏ thay đổi" đóng sheet. Ba thẻ phía sau như mục 8. Từ lúc mở trang chỉ có một request tới `babies` (lần đọc lúc tải trang), tức không có lần ghi nào.

Chỗ chưa đẹp, chưa sửa:

- **A.** Tiêu đề sheet "Mục tiêu và chiều cao bố mẹ" xuống hai dòng ở 375 px, chữ "mẹ" đứng một mình ở dòng hai (cỡ chữ 22 px của `Sheet` dùng chung, bên phải có nút "Đóng"). Không chữ nào bị cắt.
- **B.** Cặp ở mục 1: chip xuống dưới số và canh trái, trong khi ở các cặp khác chip nằm bên phải. Plan đã lường trước và coi cả hai chỗ đặt là đúng.

Chưa kiểm: **trạng thái "đã có mục tiêu" của trang thật** (bốn thẻ có số thật, biểu đồ "Đường tới", thẻ "Tốc độ tăng" có số) và **chính lần bấm "Lưu"**: chưa ai bấm, lần ghi đầu tiên từ sheet tới DB thật là khi người dùng tự nhập số của nhà mình. Ngoài ra: trang thật ở `light`, `dark`, `peach`, `lavender`, `sea` (mới xem `night` và `rose`); trang tạm ở `peach`, `lavender`, `sea`; phía thành viên; lỗi từng ô sau khi bấm "Lưu" (không bấm được); trạng thái đang tải, mất mạng, lỗi tải của trang; bé quá 5 tuổi; bề ngang 440 px; trình đọc màn hình; iPhone thật, PWA.

Dọn: `bun run dev` đã dừng; `app/fixture-height/` đã xóa; `.next/dev/types` đã xóa sau khi typecheck đỏ vì nó (chạy lại thì sạch, vitest vẫn 178 file, 1521 test); `.claude/launch.json` tạm đã xóa; khung Browser đã trả về cỡ thường. Ảnh: thư mục ghi chú chung của các phiên, `m3c-screens/` (17 ảnh).

**Cập nhật (2026-11-25): đã sửa chỗ A.** Được hỏi "Sửa tiêu đề sheet trước, hay đưa nhánh M3c lên main luôn?", người dùng chọn "Sửa tiêu đề trước". Tiêu đề sheet đổi từ "Mục tiêu và chiều cao bố mẹ" thành "Mục tiêu chiều cao" (chữ do phiên thực thi đề xuất trong báo cáo, người dùng chọn sửa theo đề xuất đó).

- Test trước: `components/height/heightgoalsheet.test.tsx` đổi khẳng định về tiêu đề; đỏ `Test Files  1 failed | 177 passed (178)`, `Tests  1 failed | 1520 passed (1521)`. Code sau: `title` trong `components/height/HeightGoalSheet.tsx`, và dòng chú thích nhắc tên sheet trong `lib/rules/heightGoal.ts`; xanh `Test Files  178 passed (178)`, `Tests  1521 passed (1521)`, `tsc --noEmit` sạch.
- Spec §6.5 đã sửa tiêu đề mục và câu "Tiêu đề …", có đánh dấu "(sửa 2026-11-25 …)" (file spec vẫn untracked).
- Giữ nguyên: tên đọc của nút bút chì, "Sửa mục tiêu và chiều cao bố mẹ" (§6.3 mục 1), vì nó không hiện trên màn và vẫn nói đúng việc nút làm. Các khối Patch 1 và Patch 2 ở trên là bản đã áp lúc đầu, còn ghi tiêu đề cũ; mục 12 của Step 4 cũng vậy.
- Trình duyệt, trang thật ở 375×812, `night`: tiêu đề "Mục tiêu chiều cao" nằm một dòng, rộng 190,9 px, cách nút "Đóng" 90,1 px; ba ô vẫn trống; Esc đóng sheet luôn; ba thẻ phía sau không đổi. Không bấm "Lưu". Chưa xem lại ở các theme khác (chỉ đổi chữ, không đổi màu hay bố cục). Sau lần đổi chữ: `bun run build` lần đầu mã 1 (cảnh báo bảo mật như trước), lần hai mã 0, 40/40 trang, có `/tang-truong/chieu-cao`; `tsc --noEmit` sạch; 178 file, 1521 test xanh. `.claude/launch.json` tạm đã xóa, dev đã dừng.
- Chỗ B giữ nguyên như plan đã lường.

- [x] **Step 5: Xóa trang fixture, commit phần ghi kết quả rồi dừng lại hỏi người dùng**

```bash
rm -r app/fixture-height
bun run typecheck   # nếu đỏ vì .next/dev/types còn trỏ tới trang tạm: rm -r .next/dev/types rồi chạy lại
git status --short   # chỉ file plan này đổi; file spec có thể hiện là untracked: không commit nó
git add docs/blueprint/plans/2026-11-25-kim-bun-chieu-cao-suc-khoe-m3c.md
git commit -m "docs(plan): record the M3c check results" -m "Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>"
```

Báo cáo cho người dùng: `git log --oneline main..HEAD`; kết quả typecheck, vitest, build; mục nào của bước trình duyệt đã thấy trên trang thật, mục nào chỉ thấy trên trang tạm, mục nào chưa; chỗ nào chưa đẹp thì nêu trước, kèm cách sửa. Nói rõ hai điều: trang mới chỉ mở được bằng đường dẫn `/tang-truong/chieu-cao` cho tới M3d; và nút "Lưu" của sheet chưa ai bấm, lần ghi đầu tiên là khi người dùng nhập số thật, nó báo lỗi thì cần báo lại. Hỏi người dùng có đưa nhánh lên `main` không. Chỉ khi người dùng đồng ý mới chạy:

```bash
git checkout main
git merge --ff-only feat/kim-bun-suc-khoe-m3c
git push origin main
```
