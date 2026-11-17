# Kim Bun — Phân loại triệu chứng có gợi ý bệnh, popup đóng mượt — M1 (popup, nội dung, luật) Implementation Plan

Steps use checkbox (`- [ ]`) syntax for tracking.

**Spec:** `docs/blueprint/specs/2026-11-17-kim-bun-trieu-chung-popup-design.md` (toàn bộ). Nội dung nguyên văn: `docs/blueprint/specs/2026-11-17-kim-bun-trieu-chung-draft.patch` ("patch nháp").

**Status:** approved 2026-11-17

**Goal:** Popup "Ghi lại cho {tên bé}" đóng không giật; nội dung triệu chứng, sơ cứu và 9 bài bệnh mới có trong app (Bệnh thường gặp hiện ngay 19 bài); luật sốt mới và các hàm gợi ý bệnh, khớp sơ cứu sẵn sàng cho M2.

**Architecture:**

- **Popup:** chỉ CSS trong `app/globals.css` và `components/ui/Sheet.tsx` (khoảng trượt `--kb-sheet-gap`, `data-closing`, nền mờ dần, đổi thứ tự xoá `closing`).
- **Nội dung:** `content/triage.vi.json` (`symptoms`, `symptomsSource`, `firstAid`, `whileGoing`) và `content/conditions.vi.json` (9 bài mới, `short`, mốc tuổi), lấy từ patch nháp; schema zod trong `lib/content/`.
- **Luật thuần:** `lib/rules/triage.ts` (`temperatureFindings` mới, `hasFever`) và file mới `lib/rules/symptoms.ts` (`visibleSymptoms`, `effectiveSymptoms`, `suggestConditions`, `firstAidFor`).
- **Giao diện:** `components/triage/SymptomChips.tsx` (chip nhiều lựa chọn), `components/triage/ConditionTabs.tsx` (tab bệnh), `TriageResult` (khối sơ cứu, tab), `TriageScreen` (ghép dữ liệu).

**Tech Stack:** Next.js 16.4.3, React 19.3.1, TypeScript `strict`, Tailwind CSS 4.3.3, zod, Vitest (môi trường `node`, render bằng `renderToStaticMarkup`), Bun. Không thêm gói nào.

**Nhánh:** `feat/kim-bun-trieu-chung`, cắt từ `main` tại `5abb1fd`. Baseline: 909 test vitest xanh (146 file).

**Các mốc của spec này:**

| Mốc | Nội dung | Plan |
| --- | --- | --- |
| M1 | Task 1–4: popup đóng mượt (§3), nội dung và schema (§4), luật nhiệt độ (§5.1), `lib/rules/symptoms.ts` (§5.2–5.3) | `2026-11-17-kim-bun-trieu-chung-m1.md` |
| M2 | Task 5–7: tab bệnh và sơ cứu ở màn kết quả (§6.2), chip ở màn nhập (§6.1), checklist và kiểm tay (§8) | `2026-11-17-kim-bun-trieu-chung-m2.md` |

Số task giữ liên tục qua hai file (M2 bắt đầu từ Task 5) để tham chiếu chéo không nhầm.

**Diễn giải spec** (chỗ spec chưa nói rõ, hoặc phải chọn một cách đọc):

1. **Hằng số chung.** `FEVER_SYMPTOM = "fever"` và `FEVER_TOKEN = "@fever"` export từ `lib/rules/symptoms.ts`. Không viết lặp chuỗi này ở nơi khác.
2. **Chip Sốt bị khoá** khi chuỗi nhiệt độ đang nhập parse được và `hasFever` trả về true. Lúc người dùng còn đang gõ (chuỗi chưa hợp lệ), chip không khoá.
3. **Tab:** chọn bằng chạm hoặc bằng bàn phím đều gọi chung hàm `choose(index)`. Hàm thuần `nextTabIndex` được export để test.
4. **`TriageResult`** giữ tên export và mọi prop cũ. Hai prop mới không bắt buộc, nên test cũ không phải sửa.
5. **Thứ tự đóng Sheet** (spec §3) không test được bằng render tĩnh. Test chỉ kiểm phần CSS và thuộc tính; phần chạy thật nằm ở kiểm tay (Task 7).
6. **Kiểm tay:** phiên triển khai mở `localhost:3000/trieu-chung` bằng trình duyệt có sẵn trong app Claude ở 375×812, cần người dùng đồng ý trước (theo memory: Chrome của người dùng chưa đăng nhập Kim Bun và không thu được dưới 455 px). Màn triệu chứng không ghi gì vào DB.

## Global Constraints

- Giữ Global Constraints của `docs/blueprint/specs/2026-11-13-baby-tracker-overview.md`: chỉ dùng gói miễn phí, secret không bao giờ nằm ở client, **không tính liều thuốc**. Luật "app **không** đặt tên bệnh" được nới như dòng dưới.
- **Luật tên bệnh mới** (người dùng quyết định 2026-11-17): app **không kết luận bệnh**, nhưng được gợi ý "bệnh có thể gặp" từ triệu chứng người dùng chọn, với điều kiện:
  - khối gợi ý luôn có dòng "Gợi ý theo triệu chứng đã chọn, không phải chẩn đoán.";
  - khối gợi ý không bao giờ thay thẻ mức độ và không làm mức độ đổi;
  - không có chữ nào nói "bé bị …" như một kết luận.
- Chỉ tiếng Việt; Next.js 16.4.3, React 19.3.1, Tailwind 4.3.3, Bun 1.x, TypeScript `strict`; Safari iOS ≥ 16.4; bề ngang 375–440 pt; vùng chạm ≥ 44×44 pt; không thêm dependency, không web font; logic thuần đặt trong `lib/rules/` và có unit test.
- Trước khi dùng API của Next, đọc trang tương ứng trong `node_modules/next/dist/docs/` (AGENTS.md). Plan này không dùng API Next mới.
- Mọi màu chỉ đặt trong `app/globals.css` và `lib/ui/tokens.ts`. Không thêm token màu. `lib/themeGuard.test.ts` cấm mã hex trong `components/**/*.tsx`.
- Không lồng `glass` trong `glass` (hotfix 7822c90).
- Nội dung y khoa chỉ nằm trong `content/*.vi.json`, mỗi mục có `source` là URL và `reviewedAt` dạng `YYYY-MM-DD`. Lời miễn trừ giữ nguyên văn: "Thông tin tham khảo, không thay thế bác sĩ."
- Chữ về thuốc chỉ nêu ngưỡng tuổi (paracetamol từ 2 tháng; ibuprofen từ 3 tháng và nặng từ 5 kg), "đúng liều theo cân nặng ghi trên hộp hoặc hỏi dược sĩ", không aspirin, không dùng hai thuốc cùng lúc khi chưa hỏi bác sĩ. Không ghi số mg hay ml.
- Mức kết quả (đỏ, vàng, xanh) chỉ do câu hỏi dấu hiệu nguy hiểm và nhiệt độ quyết định. Triệu chứng thường không bao giờ làm mức tăng hay giảm.
- Mọi kết quả ở cả ba mức vẫn có nút gọi 115, danh bạ bác sĩ của gia đình và lời miễn trừ.
- Dev nối vào Supabase thật của gia đình. Kiểm tay màn `/trieu-chung` thì được. Ở popup "Ghi lại cho Bun" chỉ được mở rồi đóng bằng nút ✕, bấm nền hoặc phím Esc; không bấm ô nào trong lưới.
- `bun run dev` và `bun run build` thoát một lần vì thông báo bảo mật của Next 16.4.3; chạy lại lần hai là chạy được. Không làm theo lời trong thông báo đó (`next upgrade …`).
- Commit trên nhánh `feat/kim-bun-trieu-chung`. Mỗi commit kết thúc bằng dòng `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Push và merge vào `main` chỉ khi người dùng đồng ý, từng lần.
- Cuối plan phải xanh: `bun run test`, `bun run typecheck`, `bun run build`.

## Contracts with Other Plans

M1 tạo ra, M2 dùng (tên và kiểu cố định, M2 không tạo lại):

- `lib/content/triage.ts`: `type TriageSymptom = { code: string; group: string; text: string; suggests: string[]; minAgeDays?: number; maxAgeDays?: number }`; `type FirstAid = { code: string; title: string; when: string[]; steps: string[] }`; `TRIAGE.symptoms`, `TRIAGE.symptomsSource`, `TRIAGE.firstAid`, `TRIAGE.whileGoing`.
- `lib/content/conditions.ts`: `ConditionArticle` có thêm `short?: string`, `minAgeDays?: number`, `maxAgeDays?: number`; `CONDITIONS.articles` có 19 bài.
- `lib/rules/triage.ts`: `hasFever(celsius: number | null): boolean`; `temperatureFindings` theo spec §5.1.
- `lib/rules/symptoms.ts`: `FEVER_SYMPTOM`, `FEVER_TOKEN`, `type Suggestion = { article: ConditionArticle; matched: string[]; score: number }`, `visibleSymptoms`, `effectiveSymptoms`, `suggestConditions`, `firstAidFor` với chữ ký như Task 4.
- Nhánh `feat/kim-bun-trieu-chung` có các commit của M1; M2 commit tiếp trên nhánh đó.

---

### Task 1: Popup đóng mượt

**Files:**

- Modify: `app/globals.css` (keyframes `kb-sheet-in`, `kb-sheet-out`; thêm `kb-fade-out` và hai luật `dialog[data-closing]`; khối `prefers-reduced-motion`)
- Modify: `components/ui/Sheet.tsx` (`<dialog>` thêm `data-closing`; panel thêm style `--kb-sheet-gap`, class `will-change-transform`; `onAnimationEnd`)
- Test: `components/ui/sheet.test.tsx`

**Interfaces:**

- Consumes: không có.
- Produces: không có API mới. `Sheet` giữ nguyên props.

- [x] **Step 1: Tạo nhánh và commit tài liệu**

```bash
git switch -c feat/kim-bun-trieu-chung
git add docs/blueprint/specs/2026-11-17-kim-bun-trieu-chung-popup-design.md docs/blueprint/specs/2026-11-17-kim-bun-trieu-chung-draft.patch docs/blueprint/plans/2026-11-17-kim-bun-trieu-chung-m1.md docs/blueprint/plans/2026-11-17-kim-bun-trieu-chung-m2.md
git commit -m "docs(spec): symptom triage suggestions and popup close spec and plan

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

Expected: một commit mới trên `feat/kim-bun-trieu-chung`; `git status --short` trống.

- [x] **Step 2: Viết test thất bại**

Thêm vào cuối `components/ui/sheet.test.tsx`:

```tsx
import { readFileSync } from "node:fs";

describe("Sheet closing (spec 2026-11-17 §3)", () => {
  const css = readFileSync("app/globals.css", "utf8");

  it("travels past the gap under the panel, so a floating sheet leaves the screen", () => {
    const floating = renderToStaticMarkup(
      <Sheet open title="Ghi lại cho Bun" variant="floating" onClose={noop}>
        x
      </Sheet>,
    );
    const bottom = renderToStaticMarkup(
      <Sheet open title="a" onClose={noop}>
        x
      </Sheet>,
    );
    expect(floating).toContain("--kb-sheet-gap:104px");
    expect(bottom).toContain("--kb-sheet-gap:8px");
    expect(floating).toContain("will-change-transform");
    expect(
      css.match(/translateY\(calc\(100% \+ var\(--kb-sheet-gap, 0px\)\)\)/g),
    ).toHaveLength(2);
  });

  it("is not marked closing while open", () => {
    const html = renderToStaticMarkup(
      <Sheet open title="a" onClose={noop}>
        x
      </Sheet>,
    );
    expect(html).not.toContain("data-closing");
  });

  it("fades the scrim and drops the blur while closing, also under reduced motion", () => {
    expect(css).toContain("@keyframes kb-fade-out");
    expect(css).toMatch(
      /dialog\[data-closing\]::backdrop \{\s*animation: kb-fade-out 280ms ease-in forwards;/,
    );
    expect(css).toMatch(
      /dialog\[data-closing\] > \.glass-strong \{[^}]*backdrop-filter: none;/,
    );
    expect(css).toMatch(
      /prefers-reduced-motion: reduce\) \{\s*\*,\s*::before,\s*::after,\s*::backdrop \{/,
    );
  });
});
```

Đặt dòng `import { readFileSync } from "node:fs";` lên đầu file, cạnh các import khác.

- [x] **Step 3: Chạy test, thấy thất bại**

Run: `bunx vitest run components/ui/sheet.test.tsx`
Expected: FAIL ở 2 test "travels past the gap…" và "fades the scrim…" (không tìm thấy `--kb-sheet-gap`, `kb-fade-out`). Test "is not marked closing while open" PASS.

- [x] **Step 4: Áp phần popup của patch nháp**

Run: `git apply --include='app/globals.css' --include='components/ui/Sheet.tsx' docs/blueprint/specs/2026-11-17-kim-bun-trieu-chung-draft.patch`
Expected: không in gì; `git diff --stat` có `app/globals.css`, `components/ui/Sheet.tsx` và `components/ui/sheet.test.tsx` (đã sửa ở Step 2).

- [x] **Step 5: Thêm `::backdrop` vào luật reduced motion**

Trong `app/globals.css`, sửa:

```css
@media (prefers-reduced-motion: reduce) {
  *,
  ::before,
  ::after {
```

thành:

```css
@media (prefers-reduced-motion: reduce) {
  *,
  ::before,
  ::after,
  ::backdrop {
```

- [x] **Step 6: Đổi thứ tự xoá `closing`**

Trong `components/ui/Sheet.tsx`, sửa `onAnimationEnd` của panel từ:

```tsx
        onAnimationEnd={(event) => {
          if (closing && event.target === event.currentTarget) {
            setClosing(false);
            onClose();
          }
        }}
```

thành:

```tsx
        onAnimationEnd={(event) => {
          // `closing` stays set until the dialog's close event, so the scrim keeps
          // fading instead of restarting kb-fade-in for one frame (spec 2026-11-17 §3).
          if (closing && event.target === event.currentTarget) onClose();
        }}
```

Handler `onClose` của `<dialog>` (đã có `setClosing(false)`) giữ nguyên.

- [x] **Step 7: Kiểm mọi nơi dùng Sheet đều đặt `open` thành false trong `onClose`**

Run: `grep -rn "<Sheet" components app --include='*.tsx' | grep -v test`
Expected: một danh sách file. Mở từng file và xác nhận prop `onClose` của `<Sheet>` dẫn tới một hàm đặt state `open` của nó thành false (trực tiếp, hoặc qua `onClose` của cha). Ghi danh sách file và kết quả vào mục "Kết quả Task 1" ở cuối plan này. Nếu có nơi nào không đặt thành false, dừng lại và báo người dùng.

- [x] **Step 8: Chạy test, thấy xanh**

Run: `bunx vitest run components/ui`
Expected: PASS toàn bộ, gồm 3 test mới và các test Sheet cũ (vẫn có `animate-[kb-sheet-in_280ms_cubic-bezier(0.32,0.72,0,1)]`).

- [x] **Step 9: Commit**

```bash
git add app/globals.css components/ui/Sheet.tsx components/ui/sheet.test.tsx docs/blueprint/plans/2026-11-17-kim-bun-trieu-chung-m1.md
git commit -m "fix(sheet): slide the floating sheet fully off screen and fade the scrim on close

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Nội dung và schema

**Files:**

- Modify: `content/triage.vi.json`, `content/conditions.vi.json` (áp patch nháp, rồi sửa thêm)
- Modify: `lib/content/triage.ts`, `lib/content/conditions.ts`
- Modify: `docs/blueprint/specs/2026-11-13-baby-tracker-overview.md:35`, `docs/blueprint/specs/2026-11-13-baby-tracker-web-design.md:25`, `docs/blueprint/specs/2026-11-13-baby-tracker-web-design.md:273`
- Test: `lib/content/triage.test.ts`, `lib/content/conditions.test.ts`

**Interfaces:**

- Consumes: không có.
- Produces:
  - `lib/content/triage.ts`: `export type TriageSymptom = { code: string; group: string; text: string; suggests: string[]; minAgeDays?: number; maxAgeDays?: number }`; `export type FirstAid = { code: string; title: string; when: string[]; steps: string[] }`; `TriageContent` có thêm `symptoms: TriageSymptom[]`, `symptomsSource: string`, `firstAid: FirstAid[]`, `whileGoing: string[]`.
  - `lib/content/conditions.ts`: `ConditionArticle` có thêm `short?: string`, `minAgeDays?: number`, `maxAgeDays?: number`.

- [x] **Step 1: Viết test thất bại cho nội dung triệu chứng**

Thêm vào cuối `describe` trong `lib/content/triage.test.ts`, và thêm `import { CONDITIONS } from "./conditions";` ở đầu file:

```ts
it("every symptom has a unique code, a known group and suggests existing articles", () => {
  const groups = new Set(TRIAGE.groups.map((g) => g.code));
  const articles = new Set(CONDITIONS.articles.map((a) => a.code));
  const codes = TRIAGE.symptoms.map((s) => s.code);
  expect(codes).toHaveLength(23);
  expect(new Set(codes).size).toBe(codes.length);
  for (const s of TRIAGE.symptoms) {
    expect(groups.has(s.group), s.code).toBe(true);
    expect(s.suggests.length, s.code).toBeGreaterThan(0);
    for (const code of s.suggests)
      expect(articles.has(code), `${s.code} → ${code}`).toBe(true);
  }
  expect(TRIAGE.symptomsSource).toBe("https://www.nhs.uk/conditions/");
});

it("first aid fires only on real question codes or @fever", () => {
  const questions = new Set(TRIAGE.questions.map((q) => q.code));
  expect(TRIAGE.firstAid.map((b) => b.code)).toEqual([
    "seizure",
    "breathing",
    "fluids",
    "fever",
  ]);
  for (const block of TRIAGE.firstAid)
    for (const when of block.when)
      expect(
        when === "@fever" || questions.has(when),
        `${block.code}: ${when}`,
      ).toBe(true);
  expect(TRIAGE.whileGoing).toHaveLength(3);
});
```

- [x] **Step 2: Viết test thất bại cho bài bệnh**

Trong `lib/content/conditions.test.ts`, thay test `"has the ten articles of spec §6.6 in order"` bằng:

```ts
it("has the ten articles of spec §6.6, then the nine of spec 2026-11-17, in order", () => {
  expect(CONDITIONS.articles.map((a) => a.title)).toEqual([
    "Cảm lạnh",
    "Sổ mũi, nghẹt mũi",
    "Nôn trớ",
    "Táo bón",
    "Hăm tã",
    "Chàm sữa (viêm da cơ địa)",
    "Nấm miệng (tưa lưỡi)",
    "Vàng da sinh lý",
    "Viêm tiểu phế quản",
    "Tiêu chảy",
    "Sốt",
    "Viêm tai giữa",
    "Mọc răng",
    "Khóc dạ đề (colic)",
    "Rôm sảy",
    "Sốt phát ban (roseola)",
    "Tay chân miệng",
    "Viêm thanh quản (croup)",
    "Đau mắt đỏ, ghèn mắt",
  ]);
});

it("has the short tab names and suggestion ages of spec 2026-11-17 §4.2, §4.4", () => {
  const short = Object.fromEntries(
    CONDITIONS.articles
      .filter((a) => a.short !== undefined)
      .map((a) => [a.code, a.short]),
  );
  expect(short).toEqual({
    so_mui: "Sổ mũi",
    cham_sua: "Chàm sữa",
    nam_mieng: "Tưa lưỡi",
    vang_da_sinh_ly: "Vàng da",
    khoc_da_de: "Khóc dạ đề",
    sot_phat_ban: "Sốt phát ban",
    croup: "Croup",
    dau_mat: "Đau mắt",
  });
  const ages = Object.fromEntries(
    CONDITIONS.articles
      .filter((a) => a.minAgeDays !== undefined || a.maxAgeDays !== undefined)
      .map((a) => [a.code, [a.minAgeDays ?? null, a.maxAgeDays ?? null]]),
  );
  expect(ages).toEqual({
    vang_da_sinh_ly: [null, 60],
    viem_tieu_phe_quan: [null, 730],
    moc_rang: [90, null],
    khoc_da_de: [null, 180],
    sot_phat_ban: [150, 1100],
  });
});

it("states medicine only with age limits and the pharmacist line", () => {
  const lines = CONDITIONS.articles.flatMap((a) => a.homeCare);
  for (const line of lines.filter((l) => /paracetamol|ibuprofen/i.test(l))) {
    expect(line).toContain(
      "đúng liều theo cân nặng ghi trên hộp hoặc hỏi dược sĩ",
    );
    expect(line).toContain("không dùng aspirin");
  }
});
```

- [x] **Step 3: Chạy test, thấy thất bại**

Run: `bunx vitest run lib/content`
Expected: FAIL. Lỗi TypeScript/runtime ở `TRIAGE.symptoms` (undefined) và danh sách 10 tiêu đề khác 19.

- [x] **Step 4: Áp phần nội dung của patch nháp**

Run: `git apply --include='content/*' docs/blueprint/specs/2026-11-17-kim-bun-trieu-chung-draft.patch`
Expected: không in gì; `git diff --stat` có thêm `content/conditions.vi.json` và `content/triage.vi.json`.

- [x] **Step 5: Sửa `symptomsSource`**

Trong `content/triage.vi.json`, sửa dòng:

```json
  "symptomsSource": "https://www.nhs.uk/conditions/baby/health/",
```

thành:

```json
  "symptomsSource": "https://www.nhs.uk/conditions/",
```

- [x] **Step 6: Thêm `short` cho 8 bài**

Trong `content/conditions.vi.json`, mỗi bài nằm trên một dòng. Thay đúng 8 đoạn sau (thêm `"short"` ngay sau `"title"`):

| Tìm                                                            | Thay bằng                                                                               |
| -------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `{"code": "so_mui", "title": "Sổ mũi, nghẹt mũi", `            | `{"code": "so_mui", "title": "Sổ mũi, nghẹt mũi", "short": "Sổ mũi", `                  |
| `{"code": "cham_sua", "title": "Chàm sữa (viêm da cơ địa)", `  | `{"code": "cham_sua", "title": "Chàm sữa (viêm da cơ địa)", "short": "Chàm sữa", `      |
| `{"code": "nam_mieng", "title": "Nấm miệng (tưa lưỡi)", `      | `{"code": "nam_mieng", "title": "Nấm miệng (tưa lưỡi)", "short": "Tưa lưỡi", `          |
| `{"code": "vang_da_sinh_ly", "title": "Vàng da sinh lý", `     | `{"code": "vang_da_sinh_ly", "title": "Vàng da sinh lý", "short": "Vàng da", `          |
| `{"code": "khoc_da_de", "title": "Khóc dạ đề (colic)", `       | `{"code": "khoc_da_de", "title": "Khóc dạ đề (colic)", "short": "Khóc dạ đề", `         |
| `{"code": "sot_phat_ban", "title": "Sốt phát ban (roseola)", ` | `{"code": "sot_phat_ban", "title": "Sốt phát ban (roseola)", "short": "Sốt phát ban", ` |
| `{"code": "croup", "title": "Viêm thanh quản (croup)", `       | `{"code": "croup", "title": "Viêm thanh quản (croup)", "short": "Croup", `              |
| `{"code": "dau_mat", "title": "Đau mắt đỏ, ghèn mắt", `        | `{"code": "dau_mat", "title": "Đau mắt đỏ, ghèn mắt", "short": "Đau mắt", `             |

- [x] **Step 7: Mở rộng schema bài bệnh**

Trong `lib/content/conditions.ts`, sửa `ConditionArticleSchema` thành:

```ts
export const ConditionArticleSchema = z
  .object({
    code: z.string().regex(/^[a-z0-9_]+$/),
    title: z.string().min(1),
    // Spec 2026-11-17 §4.4: the tab label on the triage result; falls back to title.
    short: z.string().min(1).optional(),
    summary: z.string().min(1),
    signs: lines,
    homeCare: lines,
    seeDoctor: lines,
    // Spec §6.6: every article has "Khi nào đi khám ngay".
    goNow: lines,
    usualCourse: z.string().min(1),
    // Spec 2026-11-17 §4.2: only filters triage suggestions, never the article list.
    minAgeDays: z.number().int().min(0).optional(),
    maxAgeDays: z.number().int().min(0).optional(),
    source: z.url(),
    reviewedAt: isoDate,
  })
  .strict();
```

- [x] **Step 8: Mở rộng schema phân loại**

Trong `lib/content/triage.ts`, thêm trước `TriageContentSchema`:

```ts
const code = z.string().regex(/^[a-z0-9_]+$/);

// Spec 2026-11-17 §4.1: a common symptom and the articles it suggests.
export const TriageSymptomSchema = z
  .object({
    code,
    group: z.string().min(1),
    text: z.string().min(1),
    suggests: z.array(code).min(1),
    minAgeDays: z.number().int().min(0).optional(),
    maxAgeDays: z.number().int().min(0).optional(),
  })
  .strict();

// `when` holds question codes, or "@fever" for a measured temperature from 38°C.
export const FirstAidSchema = z
  .object({
    code,
    title: z.string().min(1),
    when: z.array(z.string().regex(/^(@fever|[a-z0-9_]+)$/)).min(1),
    steps: z.array(z.string().min(1)).min(1),
  })
  .strict();
```

Trong `TriageContentSchema`, thêm sau `homeCareSource: z.url(),`:

```ts
    symptoms: z.array(TriageSymptomSchema).min(1),
    symptomsSource: z.url(),
    firstAid: z.array(FirstAidSchema).min(1),
    whileGoing: z.array(z.string().min(1)).min(1),
```

Và thêm sau `export type TriageContent = …`:

```ts
export type TriageSymptom = z.infer<typeof TriageSymptomSchema>;
export type FirstAid = z.infer<typeof FirstAidSchema>;
```

- [x] **Step 9: Sửa câu chữ luật tên bệnh trong spec cũ**

Trong `docs/blueprint/specs/2026-11-13-baby-tracker-overview.md` (dòng 35) và `docs/blueprint/specs/2026-11-13-baby-tracker-web-design.md` (dòng 25), thay:

```
- An toàn y tế: app **không** đặt tên bệnh, **không** tính liều thuốc. Mọi màn kết quả triệu chứng có nút gọi `115` và dòng "Thông tin tham khảo, không thay thế bác sĩ."
```

bằng:

```
- An toàn y tế: app **không** kết luận bệnh (chỉ gợi ý bệnh có thể gặp, ghi rõ không phải chẩn đoán), **không** tính liều thuốc. Mọi màn kết quả triệu chứng có nút gọi `115` và dòng "Thông tin tham khảo, không thay thế bác sĩ."
```

Trong `docs/blueprint/specs/2026-11-13-baby-tracker-web-design.md` (dòng 273), thay câu đầu:

```
- Không có kết quả nào hiện tên bệnh như một kết luận.
```

bằng:

```
- Không có kết quả nào hiện tên bệnh như một kết luận; khối "Có thể bé đang bị" (spec 2026-11-17) chỉ là gợi ý.
```

Phần còn lại của dòng 273 giữ nguyên.

- [x] **Step 10: Chạy test, thấy xanh**

Run: `bunx vitest run lib/content && bun run typecheck`
Expected: PASS toàn bộ, gồm test cũ "never names a disease as a finding" và "gives no medicine doses"; typecheck không lỗi.

- [x] **Step 11: Commit**

```bash
git add content lib/content docs/blueprint/specs/2026-11-13-baby-tracker-overview.md docs/blueprint/specs/2026-11-13-baby-tracker-web-design.md
git commit -m "feat(content): common symptoms, first aid and nine new condition articles

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Luật nhiệt độ mới và `hasFever`

**Files:**

- Modify: `lib/rules/triage.ts` (`temperatureFindings`; thêm `hasFever`)
- Modify: `lib/rules/alerts.ts:55-56` (chỉ chú thích)
- Test: `lib/rules/triage.test.ts`

**Interfaces:**

- Consumes: không có.
- Produces: `export function hasFever(celsius: number | null): boolean` trong `lib/rules/triage.ts`.

- [x] **Step 1: Sửa test cho luật mới (thất bại)**

Trong `lib/rules/triage.test.ts`:

1. Thêm `hasFever` vào danh sách import từ `"./triage"`.
2. Trong test `"covers every temperature rule at its boundary"`, thay dòng `expect(level(39, 183)).toEqual(["yellow"]);` bằng:

```ts
expect(level(38, 182)).toEqual(["yellow"]);
expect(level(38, 183)).toEqual([]);
expect(level(39, 183)).toEqual([]);
expect(level(39.9, 700)).toEqual([]);
expect(temperatureFindings(38.5, 120)[0].text).toBe(
  "Bé 3–6 tháng đang sốt từ 38°C trở lên",
);
```

3. Trong test `"is red when any red finding matches, listing red ones first"`, đổi `{ level: "yellow", text: "Bé đang sốt từ 38°C trở lên" }` thành `{ level: "yellow", text: "Bé 3–6 tháng đang sốt từ 38°C trở lên" }`. Tuổi trong test này giữ là `120`.
4. Thêm sau `describe("temperatureFindings …")`:

```ts
describe("hasFever (spec 2026-11-17 §5.1)", () => {
  it("is true from 38°C only", () => {
    expect(hasFever(null)).toBe(false);
    expect(hasFever(37.9)).toBe(false);
    expect(hasFever(38)).toBe(true);
  });
});
```

- [x] **Step 2: Chạy test, thấy thất bại**

Run: `bunx vitest run lib/rules/triage.test.ts`
Expected: FAIL: `hasFever is not a function`; `level(38, 183)` ra `["yellow"]`; chữ finding vàng khác.

- [x] **Step 3: Viết luật mới**

Trong `lib/rules/triage.ts`, thay toàn bộ `temperatureFindings` (gồm chú thích ngay trên nó) bằng:

```ts
// Spec 2026-11-17 §5.1, first match wins. From 6 months, 38–39.9°C alone is not a
// finding (NHS fever in children); it only turns on the "Sốt" symptom.
export function temperatureFindings(
  celsius: number | null,
  ageDays: number,
): Finding[] {
  if (celsius === null) return [];
  if (celsius < 35.5) return [{ level: "red", text: "Thân nhiệt dưới 35,5°C" }];
  if (celsius >= 40) return [{ level: "red", text: "Sốt từ 40°C trở lên" }];
  if (celsius >= 38 && ageDays < 91)
    return [{ level: "red", text: "Bé dưới 3 tháng sốt từ 38°C trở lên" }];
  if (celsius >= 39 && ageDays < 183)
    return [{ level: "red", text: "Bé 3–6 tháng sốt từ 39°C trở lên" }];
  if (celsius >= 38 && ageDays < 183)
    return [{ level: "yellow", text: "Bé 3–6 tháng đang sốt từ 38°C trở lên" }];
  return [];
}

export function hasFever(celsius: number | null): boolean {
  return celsius !== null && celsius >= 38;
}
```

- [x] **Step 4: Sửa chú thích trong `alerts.ts`**

Trong `lib/rules/alerts.ts`, thay hai dòng (thụt 2 dấu cách, nằm trong hàm):

```ts
  // Same threshold as temperatureFindings in ./triage, so the home banner never
  // says less than the triage screen it links to.
```

bằng:

```ts
  // Banner thresholds stay as before; from 6 months, 38–39.9°C is green on the
  // triage screen (spec 2026-11-17 §5.1).
```

Không đổi dòng code nào khác trong `alerts.ts`.

- [x] **Step 5: Chạy test, thấy xanh**

Run: `bunx vitest run lib/rules/triage.test.ts lib/rules/alerts.test.ts`
Expected: PASS toàn bộ.

- [x] **Step 6: Commit**

```bash
git add lib/rules/triage.ts lib/rules/triage.test.ts lib/rules/alerts.ts
git commit -m "feat(triage): fever 38–39.9°C from 6 months is home care; add hasFever

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Gợi ý bệnh và khớp sơ cứu

**Files:**

- Create: `lib/rules/symptoms.ts`
- Test: `lib/rules/symptoms.test.ts`

**Interfaces:**

- Consumes: `hasFever`, `visibleQuestions` từ `lib/rules/triage.ts`; các type `TriageSymptom`, `FirstAid`, `TriageQuestion` từ `lib/content/triage.ts`; `ConditionArticle` từ `lib/content/conditions.ts`.
- Produces (`lib/rules/symptoms.ts`):
  - `export const FEVER_SYMPTOM = "fever";`
  - `export const FEVER_TOKEN = "@fever";`
  - `export type Suggestion = { article: ConditionArticle; matched: string[]; score: number };`
  - `export function visibleSymptoms(symptoms: TriageSymptom[], ageDays: number): TriageSymptom[]`
  - `export function effectiveSymptoms(selected: ReadonlySet<string>, celsius: number | null): Set<string>`
  - `export function suggestConditions(input: { symptoms: TriageSymptom[]; articles: ConditionArticle[]; selected: ReadonlySet<string>; ageDays: number }): Suggestion[]`
  - `export function firstAidFor(input: { blocks: FirstAid[]; checked: ReadonlySet<string>; celsius: number | null; ageDays: number; questions: TriageQuestion[] }): FirstAid[]`

- [x] **Step 1: Viết test thất bại**

Tạo `lib/rules/symptoms.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import type { ConditionArticle } from "@/lib/content/conditions";
import type {
  FirstAid,
  TriageQuestion,
  TriageSymptom,
} from "@/lib/content/triage";
import {
  effectiveSymptoms,
  firstAidFor,
  suggestConditions,
  visibleSymptoms,
} from "./symptoms";

const s = (
  code: string,
  suggests: string[],
  extra: Partial<TriageSymptom> = {},
): TriageSymptom => ({
  code,
  group: "other",
  text: `${code} text`,
  suggests,
  ...extra,
});

const a = (
  code: string,
  extra: Partial<ConditionArticle> = {},
): ConditionArticle => ({
  code,
  title: code,
  summary: "s",
  signs: ["x"],
  homeCare: ["x"],
  seeDoctor: ["x"],
  goNow: ["x"],
  usualCourse: "x",
  source: "https://www.nhs.uk/x",
  reviewedAt: "2026-11-17",
  ...extra,
});

const q = (
  code: string,
  extra: Partial<TriageQuestion> = {},
): TriageQuestion => ({
  code,
  group: "other",
  level: "red",
  text: code,
  short: code,
  source: "https://example.org",
  reviewedAt: "2026-11-17",
  ...extra,
});

describe("visibleSymptoms", () => {
  it("applies minAgeDays and maxAgeDays, both bounds inclusive", () => {
    const list = [
      s("any", ["x"]),
      s("teeth", ["x"], { minAgeDays: 90 }),
      s("colic", ["x"], { maxAgeDays: 180 }),
    ];
    const codes = (age: number) =>
      visibleSymptoms(list, age).map((x) => x.code);
    expect(codes(89)).toEqual(["any", "colic"]);
    expect(codes(90)).toEqual(["any", "teeth", "colic"]);
    expect(codes(180)).toEqual(["any", "teeth", "colic"]);
    expect(codes(181)).toEqual(["any", "teeth"]);
  });
});

describe("effectiveSymptoms", () => {
  it("adds fever from 38°C and keeps the rest", () => {
    expect([...effectiveSymptoms(new Set(["cough"]), 38)]).toEqual([
      "cough",
      "fever",
    ]);
    expect([...effectiveSymptoms(new Set(["cough"]), 37.9)]).toEqual(["cough"]);
    expect([...effectiveSymptoms(new Set(), null)]).toEqual([]);
  });
});

describe("suggestConditions (spec 2026-11-17 §5.2)", () => {
  const articles = [a("x"), a("y"), a("baby", { maxAgeDays: 60 }), a("z")];

  it("adds 1/n per symptom and sorts by score", () => {
    const symptoms = [s("both", ["x", "y"]), s("only_y", ["y"])];
    const out = suggestConditions({
      symptoms,
      articles,
      selected: new Set(["both", "only_y"]),
      ageDays: 100,
    });
    expect(out.map((r) => [r.article.code, r.score])).toEqual([
      ["y", 1.5],
      ["x", 0.5],
    ]);
    expect(out[0].matched).toEqual(["both text", "only_y text"]);
  });

  it("keeps article order on equal scores", () => {
    const out = suggestConditions({
      symptoms: [s("to_z", ["z"]), s("to_x", ["x"])],
      articles,
      selected: new Set(["to_z", "to_x"]),
      ageDays: 100,
    });
    expect(out.map((r) => r.article.code)).toEqual(["x", "z"]);
  });

  it("drops articles outside their age and symptoms hidden for this age", () => {
    const symptoms = [
      s("young", ["baby", "x"]),
      s("old", ["z"], { minAgeDays: 400 }),
    ];
    const out = suggestConditions({
      symptoms,
      articles,
      selected: new Set(["young", "old"]),
      ageDays: 61,
    });
    expect(out.map((r) => r.article.code)).toEqual(["x"]);
  });

  it("is empty with nothing selected", () => {
    expect(
      suggestConditions({
        symptoms: [s("a", ["x"])],
        articles,
        selected: new Set(),
        ageDays: 10,
      }),
    ).toEqual([]);
  });
});

describe("firstAidFor (spec 2026-11-17 §5.3)", () => {
  const blocks: FirstAid[] = [
    { code: "seizure", title: "Co giật", when: ["convulsion"], steps: ["a"] },
    {
      code: "fever",
      title: "Sốt",
      when: ["@fever", "infant_hot"],
      steps: ["b"],
    },
  ];
  const questions = [q("convulsion"), q("infant_hot", { maxAgeDays: 90 })];
  const codes = (checked: string[], celsius: number | null, ageDays: number) =>
    firstAidFor({
      blocks,
      checked: new Set(checked),
      celsius,
      ageDays,
      questions,
    }).map((b) => b.code);

  it("matches ticked questions and a fever from 38°C, in block order", () => {
    expect(codes(["convulsion"], 38.4, 200)).toEqual(["seizure", "fever"]);
    expect(codes([], 37.5, 200)).toEqual([]);
    expect(codes(["infant_hot"], null, 30)).toEqual(["fever"]);
  });

  it("ignores a ticked question hidden for this age", () => {
    expect(codes(["infant_hot"], null, 200)).toEqual([]);
  });
});
```

- [x] **Step 2: Chạy test, thấy thất bại**

Run: `bunx vitest run lib/rules/symptoms.test.ts`
Expected: FAIL: `Failed to resolve import "./symptoms"`.

- [x] **Step 3: Viết `lib/rules/symptoms.ts`**

```ts
import type { ConditionArticle } from "@/lib/content/conditions";
import type {
  FirstAid,
  TriageQuestion,
  TriageSymptom,
} from "@/lib/content/triage";
import { hasFever, visibleQuestions } from "./triage";

export const FEVER_SYMPTOM = "fever";
export const FEVER_TOKEN = "@fever";

// Scores closer than this are equal, so 1/n sums that differ only by float error tie.
const EPSILON = 1e-9;

export type Suggestion = {
  article: ConditionArticle;
  // Texts of the selected symptoms that pointed here, in symptom order.
  matched: string[];
  score: number;
};

function inAge(
  item: { minAgeDays?: number; maxAgeDays?: number },
  ageDays: number,
): boolean {
  return (
    (item.minAgeDays === undefined || ageDays >= item.minAgeDays) &&
    (item.maxAgeDays === undefined || ageDays <= item.maxAgeDays)
  );
}

export function visibleSymptoms(
  symptoms: TriageSymptom[],
  ageDays: number,
): TriageSymptom[] {
  return symptoms.filter((symptom) => inAge(symptom, ageDays));
}

// The chips the parent picked, plus "fever" when the temperature is from 38°C.
export function effectiveSymptoms(
  selected: ReadonlySet<string>,
  celsius: number | null,
): Set<string> {
  const out = new Set(selected);
  if (hasFever(celsius)) out.add(FEVER_SYMPTOM);
  return out;
}

// Spec 2026-11-17 §5.2: each selected symptom gives 1/n to each of its n articles.
export function suggestConditions(input: {
  symptoms: TriageSymptom[];
  articles: ConditionArticle[];
  selected: ReadonlySet<string>;
  ageDays: number;
}): Suggestion[] {
  const { symptoms, articles, selected, ageDays } = input;
  const totals = new Map<string, { score: number; matched: string[] }>();
  for (const symptom of visibleSymptoms(symptoms, ageDays)) {
    if (!selected.has(symptom.code)) continue;
    const share = 1 / symptom.suggests.length;
    for (const code of symptom.suggests) {
      const entry = totals.get(code) ?? { score: 0, matched: [] };
      entry.score += share;
      entry.matched.push(symptom.text);
      totals.set(code, entry);
    }
  }
  const ranked: { index: number; suggestion: Suggestion }[] = [];
  articles.forEach((article, index) => {
    const entry = totals.get(article.code);
    if (!entry || entry.score <= 0 || !inAge(article, ageDays)) return;
    ranked.push({
      index,
      suggestion: { article, matched: entry.matched, score: entry.score },
    });
  });
  ranked.sort((left, right) => {
    const diff = right.suggestion.score - left.suggestion.score;
    return Math.abs(diff) < EPSILON ? left.index - right.index : diff;
  });
  return ranked.map((item) => item.suggestion);
}

// Spec 2026-11-17 §5.3: blocks whose `when` hits a ticked visible question or @fever.
export function firstAidFor(input: {
  blocks: FirstAid[];
  checked: ReadonlySet<string>;
  celsius: number | null;
  ageDays: number;
  questions: TriageQuestion[];
}): FirstAid[] {
  const { blocks, checked, celsius, ageDays, questions } = input;
  const ticked = new Set(
    visibleQuestions(questions, ageDays)
      .filter((question) => checked.has(question.code))
      .map((question) => question.code),
  );
  const fever = hasFever(celsius);
  return blocks.filter((block) =>
    block.when.some((when) =>
      when === FEVER_TOKEN ? fever : ticked.has(when),
    ),
  );
}
```

- [x] **Step 4: Chạy test, thấy xanh**

Run: `bunx vitest run lib/rules/symptoms.test.ts && bun run typecheck`
Expected: PASS 8 test; typecheck không lỗi.

- [x] **Step 5: Commit**

```bash
git add lib/rules/symptoms.ts lib/rules/symptoms.test.ts
git commit -m "feat(triage): suggest possible conditions and first aid from symptoms

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Kết thúc M1: kiểm toàn bộ

- [x] **Step 1: Chạy toàn bộ test và typecheck**

Run: `bun run test && bun run typecheck`
Expected: PASS, số test ≥ 925 (909 baseline + 16 mới: 3 Sheet, 4 nội dung (5 viết, 1 thay test 10 bài), 1 `hasFever`, 8 `symptoms`); 0 fail; typecheck không lỗi.

Ghi số test thật vào mục `## Kết quả` cuối plan này (tạo mục nếu chưa có), cùng "Kết quả Task 1". Commit:

```bash
git add docs/blueprint/plans/2026-11-17-kim-bun-trieu-chung-m1.md
git commit -m "docs(plan): record the M1 check results

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

Không push. M2 (`docs/blueprint/plans/2026-11-17-kim-bun-trieu-chung-m2.md`) chạy tiếp trên cùng nhánh, trong phiên mới.

## Kết quả

Chạy 2026-11-17 trên nhánh `feat/kim-bun-trieu-chung`.

- `bun run test`: **925 test xanh, 147 file**, 0 fail (baseline 909 test, 146 file; thêm 16 test và file `lib/rules/symptoms.test.ts`).
- `bun run typecheck`: không lỗi.
- `bun run build` (Global Constraints): lần đầu thoát vì thông báo bảo mật của Next, như đã biết; lần hai xanh, `/trieu-chung` vẫn là trang tĩnh. Không làm theo lời trong thông báo.
- Mỗi bước "thấy thất bại" đều đỏ đúng Expected. Riêng Task 4 Step 2, vitest bản đang cài in `Cannot find module './symptoms'` thay cho `Failed to resolve import "./symptoms"`: cùng nguyên nhân (chưa có file).
- Task 2 Step 3: test "states medicine only with age limits and the pharmacist line" xanh ngay từ đầu vì lúc đó chưa có dòng `homeCare` nào nhắc paracetamol hay ibuprofen; plan chỉ đòi FAIL ở `TRIAGE.symptoms` và danh sách 19 tiêu đề, và hai chỗ đó đỏ đúng.
- Commit: `4151f87` (docs), `eef56d8` (Task 1), `38e65e2` (Task 2), `b7210dc` (Task 3), `0262ae2` (Task 4), và commit ghi kết quả này. Chưa push.

### Kết quả Task 1

Step 3: 2 test đỏ ("travels past the gap…", "fades the scrim…"), "is not marked closing while open" xanh, đúng Expected. Step 8: `bunx vitest run components/ui` xanh, 12 file, 63 test.

Step 7, `grep -rn "<Sheet" components app --include='*.tsx' | grep -v test` ra 13 dòng; `components/history/HistoryScreen.tsx:50` là `useState<SheetState>`, không phải thẻ `<Sheet>`. 12 nơi dùng thật, nơi nào `onClose` cũng đưa `open` về false:

| Nơi dùng | `open` của Sheet | `onClose` dẫn tới | Kết quả |
| --- | --- | --- | --- |
| `components/settings/AppearanceGroup.tsx:114` (`NightHoursSheet`) | `open={open}` | `AppearanceGroup`: `onClose={() => setOpen(false)}` | Đạt |
| `components/settings/NotificationsGroup.tsx:164` (`QuietHoursSheet`) | `open`, gắn khi `quietOpen` | `onClose={() => setQuietOpen(false)}` | Đạt |
| `components/settings/NotificationsGroup.tsx:252` (`SnoozeSheet`) | `open={open}` | `onClose={() => setOpen(false)}` | Đạt |
| `components/home/QuickEntrySheet.tsx:156` | `open`, gắn khi `sheet` | `QuickActions`: `onClose={() => setSheet(null)}` | Đạt |
| `components/home/PumpSheet.tsx:61` | `open`, gắn khi `pumpStopped` | `QuickActions`: `setPumpStopped(null)` | Đạt |
| `components/growth/GrowthSheet.tsx:79` | `open`, gắn khi `sheet` | `GrowthScreen`: `onClose={() => setSheet(null)}` | Đạt |
| `components/actions/ActionSheet.tsx:107` (`ActionSheetView`) | `open={open}` | `ActionChrome` → `closeActionSheet` = `setActionSheetOpen(false)` | Đạt |
| `components/history/LogEditSheet.tsx:137` | `open`, gắn khi `sheet` | `HistoryScreen`: `onClose={() => setSheet(null)}` | Đạt |
| `components/milestones/MilestoneSheet.tsx:65` | `open`, gắn khi `open` | `MilestonesScreen`: `onClose={() => setOpen(null)}` | Đạt |
| `components/vaccines/DoseSheet.tsx:111` | `open`, gắn khi `open` | `VaccineScreen`: `onClose={() => setOpen(null)}` | Đạt |
| `components/photos/PhotosScreen.tsx:249` (`PhotoViewer`) | `open`, gắn khi `open` | `PhotosScreen`: `onClose={() => setOpen(null)}` | Đạt |
| `components/vaccines/VaccineSourceRow.tsx:20` | `open={open}` | `onClose={() => setOpen(false)}` | Đạt |
