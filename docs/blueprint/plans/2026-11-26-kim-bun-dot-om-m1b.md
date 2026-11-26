# Kim Bun — Đợt ốm M1b: phiếu Triệu chứng Implementation Plan

Steps use checkbox (`- [ ]`) syntax for tracking.

**Spec:** `docs/blueprint/specs/2026-11-26-kim-bun-dot-om-design.md` (§3.3 phần `QUICK_ACTIONS`; §3.4 phần `MANUAL_TYPES`; §3.5; phần tương ứng của §10.1, §10.3, §10.4)

**Status:** approved 2026-11-26

**Goal:** Bố mẹ ghi được một bản ghi Triệu chứng bằng chip, từ phiếu "+" hoặc nút "Khác" của Hôm nay, và sửa được nó trong Nhật ký.

**Architecture:**

- **Bộ chọn chip:** `components/quick/SymptomPicker.tsx` có `SymptomPickerView` (không hook, test gọi thẳng được) và `SymptomPicker` (giữ trạng thái mở/thu gọn). Mọi phép tính lấy từ `lib/rules/symptomForm.ts` của M1a.
- **Hai nơi dùng:** `FieldList` vẽ bộ chọn khi gặp ô `kind: "symptoms"`, nên `LogEditSheet` sửa được bản ghi mà không cần mã riêng. `SymptomFields` (cho `QuickEntrySheet`) là một dòng gợi ý cộng chính `FieldList` đó.
- **Đường vào:** một ô "Triệu chứng" đứng đầu nhóm "Khác" của `QUICK_ACTIONS`; `MANUAL_TYPES` thêm "Triệu chứng". Lưới "Ghi nhanh" của Hôm nay không đổi.
- Không có migration, không thêm gói, không thêm token màu, không thêm icon.

**Tech Stack:** Next.js 16.4.3, React 19.3.1, TypeScript 5.9.3 `strict`, Tailwind CSS 4.3.3, TanStack Query, Vitest, Bun. Không thêm gói nào.

**Nhánh:** `feat/kim-bun-dot-om-m1b`, cắt từ `main` sau khi M1a đã lên (code M1a tới `1afbc83`, trên nó là commit tài liệu "docs: the Đợt ốm spec, the M1 plans and the M1a check results"). Baseline: 1681 test vitest xanh (185 file), typecheck sạch. Migration `20261126000100_symptom_log.sql` phải đã áp lên Supabase thật (M1a Task 5 Step 4): thiếu nó thì lần "Lưu" đầu tiên của người dùng bị DB từ chối.

**Các mốc của spec này:**

| Mốc | Nội dung                                                                                                                     | Plan                                                    |
| --- | ---------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| M1a | §3.1, §3.2, phần luật của §3.3 và §3.4: nội dung, migration, loại bản ghi `symptom` trong luật. Chưa có gì hiện ra màn hình. | `docs/blueprint/plans/2026-11-26-kim-bun-dot-om-m1a.md` |
| M1b | phần còn lại của §3.3, §3.4 và §3.5: bộ chọn chip, phiếu ghi, phiếu sửa, ô trong phiếu "+", Bước 38 của checklist            | `docs/blueprint/plans/2026-11-26-kim-bun-dot-om-m1b.md` |
| M2  | §4, §5.1–5.3, §5.7, §6: đợt ốm                                                                                               | chưa viết                                               |
| M3  | §5.5, §5.6, §7: tab Hôm nay                                                                                                  | chưa viết                                               |
| M4  | §5.4, §9: so sánh và Báo cáo                                                                                                 | chưa viết                                               |
| M5  | §8: lần khám                                                                                                                 | chưa viết                                               |

**Diễn giải spec** (chỗ spec chưa nói rõ, hoặc phải chọn một cách đọc):

1. **Chip đang chọn có dấu "✓ " trước tên** và nền đậm (`bg-ink`), giống chip của trang Phân loại triệu chứng. Spec chỉ nói `aria-pressed`; dấu ✓ là để theme `night` (một tông màu) vẫn phân biệt được mà không dựa vào màu (Global Constraints).
2. **Nút "Xem tất cả {n} triệu chứng" đứng ngay dưới hàng "Hay gặp"**; các nhóm mở ra bên dưới nút, và nút đổi thành "Thu gọn" tại chỗ, không nhảy.
3. **{n}** là tổng số chip bé xem được: sau lọc tuổi, cộng chip đã chọn mà nay ngoài tuổi. Bé 76 ngày tuổi: 22 (thiếu "Chảy dãi", từ 90 ngày).
4. **Khi mở hết,** chip đã chọn mà không `common` nằm trong nhóm của nó; khi thu gọn nó đứng sau các chip `common`.
5. **Không còn chip nào ngoài `common`** thì không vẽ nút.
6. **Ô ghi chú là `textarea` 3 dòng** (ô `kind: "textarea"` như spec §3.4 ghi), không phải một dòng như bản vẽ.
7. **`ageDays` là prop tùy chọn** của `FieldList`, `QuickEntrySheet`, `LogEditSheet`; `null` (mặc định) nghĩa là không lọc tuổi. `QuickActionsProvider` và `HistoryScreen` luôn chuyền ngày tuổi thật.
8. **Nút "Lưu" chỉ tắt trong `QuickEntrySheet`** (spec §3.5). `LogEditSheet` không tắt nút cho loại nào; bấm "Lưu" khi chưa chọn chip thì nó hiện "Chọn ít nhất một triệu chứng".
9. **Nhóm "Khác" của phiếu "+" có năm ô** trên lưới bốn cột, nên ô thứ năm ("Ghi chú") xuống hàng hai.
10. **Bước 38 của checklist được tạo ở plan này** (spec §10.4 nói M1 tạo), với phần của M1.
11. **Hai bản app giữa hai lần phát hành.** Điện thoại còn chạy bản M1a mà mở một bản ghi triệu chứng do máy khác (đã có M1b) ghi thì sẽ thấy các mã trong một ô chữ thường, vì `FieldList` của M1a chưa có nhánh `"symptoms"`. Chỉ xảy ra khi M1b lên sau M1a lâu; nên đưa hai plan lên gần nhau.
12. **Kiểm trình duyệt ở 375×812.** `CLAUDE.md` của người dùng mặc định dùng Claude in Chrome, nhưng Chrome không thu được dưới 455 px; khung Browser trong app làm được 375 px và cần người dùng đồng ý. Trước Task 3 Step 4, hỏi người dùng một lần dùng trình duyệt nào.

## Global Constraints

- Giữ toàn bộ mục 2 của spec UI: chỉ tiếng Việt; Next.js 16.4.3, React 19.3.1, Tailwind 4.3.3, Bun 1.x, TypeScript 5.9.3 `strict`; Safari iOS ≥ 16.4; bề ngang 375–440 pt; vùng chạm ≥ 44×44 pt; không thêm dependency, không web font; logic thuần đặt trong `lib/rules/` và có unit test.
- Trước khi dùng API của Next, đọc trang tương ứng trong `node_modules/next/dist/docs/` (AGENTS.md).
- Mọi màu chỉ đặt trong `app/globals.css` và `lib/ui/tokens.ts`. Spec này không thêm token màu, không thêm icon. `lib/themeGuard.test.ts` cấm mã hex trong `components/**/*.tsx`; mã hex trong bản vẽ không được chép vào component.
- Mọi thay đổi phải đúng ở cả 7 theme: `light`, `rose`, `peach`, `lavender`, `sea`, `dark`, `night`. Theme `night` chỉ có một tông màu: không trạng thái nào được phân biệt chỉ bằng màu, phải khác cả chữ, icon hoặc hình dạng.
- `glass` nằm trong `glass` hay `glass-strong` không có blur riêng (hotfix 7822c90).
- Mọi ngày giờ tính theo giờ Việt Nam (UTC+7), dùng `formatVnTime`, `vnDateString`, `vnDayStartMs`, `formatDayShort` có sẵn.
- Ngưỡng sốt là 38,0°C, dùng `hasFever` (`lib/rules/triage.ts`). Số thập phân viết dấu phẩy, tối đa 1 chữ số lẻ.
- Chữ về sức khỏe: chỉ dùng đúng các câu ghi trong spec này. App không chẩn đoán, không nêu liều thuốc. "Kết luận" của lần khám là chữ bố mẹ gõ lại lời bác sĩ, luôn hiện kèm nhãn nói rõ điều đó.
- Đợt ốm không được che, đổi chữ hay hạ mức bất kỳ banner nào của `homeAlerts`.
- Bản ghi (`logs`) vẫn ghi qua outbox như hiện tại. Bảng `logs` chỉ đổi ràng buộc `logs_type_check`; không thêm cột.
- Ở bề ngang 375 px không chữ nào trong các khối mới bị cắt "…". Được xuống dòng: tiêu đề thẻ kết luận, dòng mô tả của thẻ và hàng danh sách (tối đa 2 dòng), lời dặn của lần khám, hàng chip.
- Dev đang nối vào Supabase thật của gia đình. Kiểm tay không được bấm Lưu, không bắt đầu hay đóng đợt ốm, không tải ảnh. Trạng thái nào dữ liệu thật không có thì xem trên trang fixture tạm, xóa trước khi commit.
- Áp migration lên Supabase thật: plan dừng lại, đưa lệnh `bunx supabase db push --linked` cho người dùng tự chạy. Code cần một migration không được đẩy lên `main` trước khi migration đó đã áp.
- Push lên `main` cần người dùng đồng ý từng lần.
- Test hiện có phải xanh: 1659 test vitest (184 file), pgTAP 001–015, `bun run typecheck`, `bun run build`.

### Ghi chú khi thực thi (của plan này, không thuộc spec)

- **Patch.** Mọi thay đổi nằm trong các khối `diff`, đánh số **Patch 1** đến **Patch 5** theo thứ tự xuất hiện trong file này. Áp bằng lệnh dưới (dán cả hàm vào cùng một lần gọi shell), hoặc sửa tay: dòng bắt đầu bằng `-` là bỏ, `+` là thêm.

```bash
kb_patch() {
  awk -v n="$1" 'BEGIN { f = sprintf("%c%c%c", 96, 96, 96) }
    $0 == f "diff" { c++; on = (c == n); next }
    $0 == f { on = 0 }
    on' docs/blueprint/plans/2026-11-26-kim-bun-dot-om-m1b.md
}
kb_patch 1 | git apply --verbose   # đổi số 1 thành số patch cần áp
```

- **Đã chạy thử.** 5 patch đã được áp lần lượt lên một bản sao ở ngoài repo, bắt đầu từ commit cuối của M1a trong bản chạy thử. Trong bản chạy thử mỗi task là hai commit (test trước, code sau; còn làm theo plan thì mỗi task một commit ở Step 5). `tsc --noEmit` sạch sau mỗi commit code; số test đỏ và xanh của từng task là số đo thật trên cả bộ test. Trang tạm của Task 3 đã qua `tsc --noEmit`. Chưa chạy trong lúc viết plan: `bun run build` và bước kiểm trình duyệt. Các bề ngang chữ ở 375 px chưa đo: bước trình duyệt là lần đầu thấy chúng.
- **pgTAP.** Plan này không đụng DB nên không chạy pgTAP.
- **Người dùng muốn màn hình gọn.** Không thêm chữ nào ngoài plan.
- **Bước trình duyệt lộ ra lỗi** thì sửa ngay trong phiên: test trước, code sau, sửa spec cho khớp, ghi vào plan. Không đẩy một thay đổi còn lỗi đã biết. Chỗ nào cần người dùng quyết (đổi chữ ngoài spec, đụng dữ liệu thật) thì dừng lại và báo.
- **Màu.** Không patch nào thêm màu, token hay icon. `lib/themeGuard.test.ts` phải xanh.
- **Chỉ xem trên trang thật.** Dev nối vào Supabase thật của gia đình: không bấm "Lưu", không bắt đầu hay dừng đồng hồ, không thêm bản ghi, không gạt công tắc.
- **`bun run build` và `bun run dev`** có thể dừng một lần với thông báo cảnh báo bảo mật của Next.js 16.4.3 rồi chạy được ở lần thứ hai. Không chạy lệnh `next upgrade` mà nó gợi ý.
- **Không chạy prettier lên `content/triage.vi.json`.** File đó từ trước đã không theo prettier (mỗi triệu chứng một dòng); định dạng lại sẽ làm patch không áp được và làm diff phình ra.
- **File spec và hai file plan chưa được commit.** `git status` sẽ thấy chúng là untracked: không commit chúng, trừ khi người dùng bảo.
- **Lên `main` phải hỏi.** Spec ghi: push lên `main` cần người dùng đồng ý từng lần. Bước cuối của plan dừng lại hỏi.
- **Dòng `Co-Authored-By`.** Các lệnh commit trong plan ghi `Claude Fable 5.2`, là model của phiên viết plan. Phiên thực thi chạy model khác thì thay bằng dòng attribution mà phiên đó quy định.
- **Không chạy lệnh nào nhắc tới file `.env`** (một hook chặn cả khi tên file đó chỉ nằm trong chuỗi của lệnh).

## Contracts with Other Plans

Plan này đứng sau M1a. M2 sẽ dùng `QuickEntrySheet` với `type="symptom"` cho nút "Triệu chứng" của thẻ kết luận và thẻ đợt ốm ở Hôm nay (gọi `openInstant("symptom")` của `useQuickActions`).

**Consumes (M1a):** `parseCodes`, `toggleCode`, `pickerLayout` (`lib/rules/symptomForm.ts`); `QUICK_FIELDS.symptom`, `QuickField["kind"] = "symptoms"`, `InstantType` có `"symptom"` (`lib/rules/quickEntry.ts`); `LOG_FIELDS.symptom`, `MANUAL_TYPES`, `hasNoteField` (`lib/rules/logForm.ts`); `CATEGORIES.symptom`; `describeLog` cho `symptom`; `TRIAGE.symptoms[].short`, `.common`; `TITLES.symptom` và `symptom: null` trong `QuickEntrySheet`.

**Consumes (đã ở `main` từ trước):** `FieldList`, `FIELD_LABEL` (`components/quick/`); `QuickEntrySheet`; `LogEditSheet`; `HistoryScreen`; `QuickActionsProvider`; `QUICK_ACTIONS`; `ageDays(dob, now)` (`lib/rules/time.ts`); `Button` (`disabled`); `cx`.

**Produces:**

- `components/quick/SymptomPicker.tsx`:
  - `SymptomPickerView(props: { value: string; onChange: (next: string) => void; ageDays: number | null; expanded: boolean; onExpanded: (next: boolean) => void })`
  - `SymptomPicker(props: { value: string; onChange: (next: string) => void; ageDays: number | null })`
- `components/quick/SymptomFields.tsx`: `SymptomFields(props: { values: QuickValues; onChange: (next: QuickValues) => void; ageDays: number | null })`
- `FieldList` nhận thêm `ageDays?: number | null` và vẽ `SymptomPicker` cho ô `kind: "symptoms"`.
- `QuickEntrySheet` và `LogEditSheet` nhận thêm `ageDays?: number | null`.
- `QUICK_ACTIONS[9]` = `{ key: "symptom", label: "Triệu chứng", kind: "instant", group: "other", category: "symptom", instant: "symptom" }` (14 hành động); `useQuickActions().openInstant("symptom")` mở phiếu.
- `MANUAL_TYPES[6]` = `{ value: "symptom", label: "Triệu chứng" }` (11 loại).
- `docs/device-checklist.md`: "Bước 38 — Đợt ốm (spec 2026-11-26)" với 5 mục của M1.
- **Vitest sau M1b:** 1695 test, 186 file.

---

### Task 1: Bộ chọn chip (§3.5)

**Files:**

- Create: `components/quick/SymptomPicker.tsx`, `components/quick/SymptomFields.tsx`
- Modify: `components/quick/FieldList.tsx`
- Test: `components/quick/symptoms.test.tsx` (mới), `components/quick/fieldlist.test.tsx`

**Interfaces:**

- Consumes: `parseCodes`, `pickerLayout`, `toggleCode` (M1a); `TRIAGE`; `QUICK_FIELDS.symptom`; `LOG_FIELDS.symptom`; `FIELD_LABEL`; `cx`.
- Produces: `SymptomPickerView`, `SymptomPicker`, `SymptomFields`; `FieldList` có `ageDays` và nhánh `"symptoms"` (chữ ký ở mục Contracts).

- [x] **Step 0: Kiểm M1a đã xong, rồi tạo nhánh**

```bash
git checkout main && git pull --ff-only
test -f lib/rules/symptomForm.ts && test -f supabase/migrations/20261126000100_symptom_log.sql && echo "M1a có trên main"
```

Expected: dòng `M1a có trên main`. Không thấy dòng đó thì dừng: M1a chưa lên `main`. Mở plan M1a, Task 5 Step 4: phải có ghi giờ người dùng báo đã áp migration lên Supabase thật. Chưa có thì dừng và hỏi người dùng, vì thiếu migration thì lần "Lưu" đầu tiên bị DB từ chối.

```bash
git checkout -b feat/kim-bun-dot-om-m1b
```

- [x] **Step 1: Viết test đỏ (Patch 1)**

```diff
diff --git a/components/quick/fieldlist.test.tsx b/components/quick/fieldlist.test.tsx
index ed51b1c..0dddf78 100644
--- a/components/quick/fieldlist.test.tsx
+++ b/components/quick/fieldlist.test.tsx
@@ -76,6 +76,29 @@ describe("FieldList", () => {
     expect(med).not.toContain("<select");
   });

+  it("spec 2026-11-26 §3.5: a symptoms field is the chip picker, filtered by the baby's age", () => {
+    const symptom = html({
+      fields: LOG_FIELDS.symptom,
+      values: { codes: "runny_nose,cough", note: "Ho về đêm" },
+      onChange: () => {},
+      ageDays: 76,
+    });
+    expect(symptom).toContain(">Hay gặp</span>");
+    expect(symptom).toMatch(/aria-pressed="true"[^>]*>✓ Sổ mũi<\/button>/);
+    expect(symptom).toMatch(/aria-pressed="false"[^>]*>Sốt<\/button>/);
+    expect(symptom).toContain(">Xem tất cả 22 triệu chứng</button>");
+    expect(symptom).toContain(">Ghi chú (không bắt buộc)</span>");
+    expect(symptom).toMatch(/<textarea[^>]*maxLength="200"/);
+    expect(symptom).not.toContain("<input");
+    expect(symptom).not.toContain("Bấm những gì bé đang có.");
+    const anyAge = html({
+      fields: LOG_FIELDS.symptom,
+      values: { codes: "", note: "" },
+      onChange: () => {},
+    });
+    expect(anyAge).toContain(">Xem tất cả 23 triệu chứng</button>");
+  });
+
   it("a textarea field is three lines tall and capped; text fields carry maxLength", () => {
     const note = html({
       fields: LOG_FIELDS.note,
diff --git a/components/quick/symptoms.test.tsx b/components/quick/symptoms.test.tsx
new file mode 100644
index 0000000..1740316
--- /dev/null
+++ b/components/quick/symptoms.test.tsx
@@ -0,0 +1,152 @@
+import { renderToStaticMarkup } from "react-dom/server";
+import { describe, expect, it, vi } from "vitest";
+import { hostElements } from "@/components/ui/testTree";
+import { SymptomFields } from "./SymptomFields";
+import { SymptomPickerView } from "./SymptomPicker";
+
+type ViewProps = Parameters<typeof SymptomPickerView>[0];
+const props = (extra: Partial<ViewProps> = {}): ViewProps => ({
+  value: "",
+  onChange: () => {},
+  ageDays: 76,
+  expanded: false,
+  onExpanded: () => {},
+  ...extra,
+});
+const view = (extra: Partial<ViewProps> = {}) =>
+  renderToStaticMarkup(<SymptomPickerView {...props(extra)} />);
+const chipsOf = (html: string) =>
+  [...html.matchAll(/aria-pressed="(true|false)"[^>]*>([^<]+)<\/button>/g)].map(
+    (m) => [m[2], m[1] === "true"],
+  );
+
+// Spec 2026-11-26 §3.5.
+describe("SymptomPickerView", () => {
+  it("collapsed: the eight common chips by short name and one button to see the rest", () => {
+    const html = view();
+    expect(html).toContain(">Hay gặp</span>");
+    expect(html).toContain('role="group" aria-label="Hay gặp"');
+    expect(chipsOf(html)).toEqual([
+      ["Sốt", false],
+      ["Sổ mũi", false],
+      ["Ho", false],
+      ["Khò khè", false],
+      ["Trớ sữa", false],
+      ["Nôn", false],
+      ["Tiêu chảy", false],
+      ["Quấy", false],
+    ]);
+    expect(html).toMatch(
+      /aria-expanded="false"[^>]*>Xem tất cả 22 triệu chứng<\/button>/,
+    );
+    expect(html).not.toContain(">Hô hấp</span>");
+    expect(html.match(/min-h-11/g)).toHaveLength(9);
+    expect(html).not.toContain("…");
+  });
+
+  it("a picked chip is filled and ticked, so it does not rely on colour", () => {
+    const html = view({ value: "runny_nose,cough" });
+    expect(chipsOf(html).slice(0, 3)).toEqual([
+      ["Sốt", false],
+      ["✓ Sổ mũi", true],
+      ["✓ Ho", true],
+    ]);
+    expect(html).toMatch(/bg-ink[^"]*"[^>]*>✓ Ho<\/button>|bg-ink[^>]*>✓ Ho</);
+    expect(html).toMatch(/glass[^>]*>Sốt</);
+  });
+
+  it("expanded: the other chips under their group names, and the button reads Thu gọn", () => {
+    const html = view({ expanded: true });
+    expect(html).toMatch(/aria-expanded="true"[^>]*>Thu gọn<\/button>/);
+    expect(
+      [...html.matchAll(/role="group" aria-label="([^"]+)"/g)].map((m) => m[1]),
+    ).toEqual([
+      "Hay gặp",
+      "Hô hấp",
+      "Tiêu hóa",
+      "Da",
+      "Hành vi, ăn bú",
+      "Khác",
+    ]);
+    expect(chipsOf(html)).toHaveLength(22);
+    expect(html).toContain(">Ho ông ổng</button>");
+    expect(html).toContain(">Mảng trắng miệng</button>");
+    // 76 days old: Chảy dãi starts at 90 days.
+    expect(html).not.toContain("Chảy dãi");
+    expect(html.indexOf("Thu gọn")).toBeLessThan(
+      html.indexOf(">Hô hấp</span>"),
+    );
+  });
+
+  it("collapsed: a picked chip that is not common stays in sight after the common ones", () => {
+    const html = view({ value: "cough,gassy" });
+    expect(chipsOf(html)).toHaveLength(9);
+    expect(chipsOf(html)[8]).toEqual(["✓ Đầy hơi", true]);
+    const open = view({ value: "cough,gassy", expanded: true });
+    expect(open.match(/Đầy hơi/g)).toHaveLength(1);
+  });
+
+  it("a picked chip outside the baby's age still shows; a code the content lost does not", () => {
+    const html = view({ value: "drooling,gone_code" });
+    expect(chipsOf(html)[8]).toEqual(["✓ Chảy dãi", true]);
+    expect(html).not.toContain("gone_code");
+    expect(html).toContain(">Xem tất cả 23 triệu chứng</button>");
+  });
+
+  it("no age given: every symptom is offered", () => {
+    expect(view({ ageDays: null })).toContain(
+      ">Xem tất cả 23 triệu chứng</button>",
+    );
+  });
+
+  it("a chip toggles its code; the button toggles the list", () => {
+    const onChange = vi.fn();
+    const onExpanded = vi.fn();
+    const buttons = hostElements(
+      SymptomPickerView(props({ value: "cough", onChange, onExpanded })),
+      "button",
+    );
+    expect(buttons).toHaveLength(9);
+    (buttons[1].props.onClick as () => void)();
+    expect(onChange).toHaveBeenLastCalledWith("runny_nose,cough");
+    (buttons[2].props.onClick as () => void)();
+    expect(onChange).toHaveBeenLastCalledWith("");
+    (buttons[8].props.onClick as () => void)();
+    expect(onExpanded).toHaveBeenCalledWith(true);
+    for (const button of buttons) expect(button.props.type).toBe("button");
+  });
+
+  it("a code the content lost survives a toggle", () => {
+    const onChange = vi.fn();
+    const buttons = hostElements(
+      SymptomPickerView(props({ value: "gone_code", onChange })),
+      "button",
+    );
+    (buttons[0].props.onClick as () => void)();
+    expect(onChange).toHaveBeenCalledWith("fever,gone_code");
+  });
+});
+
+describe("SymptomFields", () => {
+  const html = (values: Record<string, string>) =>
+    renderToStaticMarkup(
+      <SymptomFields values={values} onChange={() => {}} ageDays={76} />,
+    );
+
+  it("a hint line, the chips, then a note of at most 200 characters", () => {
+    const empty = html({ codes: "", note: "" });
+    expect(empty).toContain(">Bấm những gì bé đang có.</p>");
+    expect(empty).toContain(">Hay gặp</span>");
+    expect(empty).toContain(">Ghi chú (không bắt buộc)</span>");
+    expect(empty).toMatch(/<textarea[^>]*rows="3"[^>]*maxLength="200"/);
+    expect(empty.indexOf(">Hay gặp</span>")).toBeLessThan(
+      empty.indexOf(">Ghi chú (không bắt buộc)</span>"),
+    );
+  });
+
+  it("says how many are picked and shows the note", () => {
+    const picked = html({ codes: "runny_nose,cough", note: "Ho về đêm" });
+    expect(picked).toContain(">Bấm những gì bé đang có. Đã chọn 2.</p>");
+    expect(picked).toContain(">Ho về đêm</textarea>");
+  });
+});
```

- [x] **Step 2: Chạy để thấy đỏ**

Run: `bunx vitest run`
Expected: `Test Files  2 failed | 184 passed (186)`, `Tests  1 failed | 1681 passed (1682)`. `symptoms.test.tsx` không nạp được vì hai component chưa có (10 test của nó chưa được đếm); test mới của `fieldlist.test.tsx` đỏ.

- [x] **Step 3: Viết bộ chọn chip (Patch 2)**

```diff
diff --git a/components/quick/FieldList.tsx b/components/quick/FieldList.tsx
index 9515fdd..f140172 100644
--- a/components/quick/FieldList.tsx
+++ b/components/quick/FieldList.tsx
@@ -2,18 +2,23 @@ import { Segmented } from "@/components/ui/Segmented";
 import { Switch } from "@/components/ui/Switch";
 import type { QuickField, QuickValues } from "@/lib/rules/quickEntry";
 import { FIELD_INPUT, FIELD_LABEL } from "./styles";
+import { SymptomPicker } from "./SymptomPicker";

 // Spec §8.3: same fields as before, drawn with ui components. A checkbox becomes a
 // Switch, a select with 2–6 options a Segmented, a longer select stays native.
 // A textarea is three lines tall; text fields carry the field's maxLength.
+// Spec 2026-11-26 §3.5: a "symptoms" field is the chip picker; `ageDays` filters
+// its chips (null, the default, shows every symptom).
 export function FieldList({
   fields,
   values,
   onChange,
+  ageDays = null,
 }: {
   fields: QuickField[];
   values: QuickValues;
   onChange: (next: QuickValues) => void;
+  ageDays?: number | null;
 }) {
   return (
     <>
@@ -24,6 +29,16 @@ export function FieldList({
           const set = (next: string | boolean) =>
             onChange({ ...values, [field.key]: next });

+          if (field.kind === "symptoms")
+            return (
+              <SymptomPicker
+                key={field.key}
+                value={typeof value === "string" ? value : ""}
+                onChange={set}
+                ageDays={ageDays}
+              />
+            );
+
           if (field.kind === "checkbox")
             return (
               <div
diff --git a/components/quick/SymptomFields.tsx b/components/quick/SymptomFields.tsx
new file mode 100644
index 0000000..3d7f159
--- /dev/null
+++ b/components/quick/SymptomFields.tsx
@@ -0,0 +1,30 @@
+import { QUICK_FIELDS, type QuickValues } from "@/lib/rules/quickEntry";
+import { parseCodes } from "@/lib/rules/symptomForm";
+import { FieldList } from "./FieldList";
+
+// Spec 2026-11-26 §3.5: a hint that counts the picked chips, then the same two
+// fields the edit sheet draws (the chips and the note).
+export function SymptomFields({
+  values,
+  onChange,
+  ageDays,
+}: {
+  values: QuickValues;
+  onChange: (next: QuickValues) => void;
+  ageDays: number | null;
+}) {
+  const count = parseCodes(values.codes).length;
+  return (
+    <>
+      <p className="text-[15px] text-muted">
+        {`Bấm những gì bé đang có.${count > 0 ? ` Đã chọn ${count}.` : ""}`}
+      </p>
+      <FieldList
+        fields={QUICK_FIELDS.symptom}
+        values={values}
+        onChange={onChange}
+        ageDays={ageDays}
+      />
+    </>
+  );
+}
diff --git a/components/quick/SymptomPicker.tsx b/components/quick/SymptomPicker.tsx
new file mode 100644
index 0000000..9d61fa4
--- /dev/null
+++ b/components/quick/SymptomPicker.tsx
@@ -0,0 +1,97 @@
+"use client";
+
+import { useState } from "react";
+import { TRIAGE, type TriageSymptom } from "@/lib/content/triage";
+import { parseCodes, pickerLayout, toggleCode } from "@/lib/rules/symptomForm";
+import { cx } from "@/lib/ui/cx";
+import { FIELD_LABEL } from "./styles";
+
+const ROW = "flex flex-wrap gap-2";
+
+// Spec 2026-11-26 §3.5: the common chips first; one button opens the rest by
+// group. `value` is the picked codes joined with ",". A picked chip is filled
+// and ticked, so it reads without colour (theme night).
+export function SymptomPickerView({
+  value,
+  onChange,
+  ageDays,
+  expanded,
+  onExpanded,
+}: {
+  value: string;
+  onChange: (next: string) => void;
+  // null: no age filter.
+  ageDays: number | null;
+  expanded: boolean;
+  onExpanded: (next: boolean) => void;
+}) {
+  const selected = parseCodes(value);
+  const layout = pickerLayout({
+    symptoms: TRIAGE.symptoms,
+    groups: TRIAGE.groups,
+    ageDays,
+    selected,
+  });
+  const chip = (symptom: TriageSymptom) => {
+    const on = selected.includes(symptom.code);
+    return (
+      <button
+        key={symptom.code}
+        type="button"
+        aria-pressed={on}
+        onClick={() =>
+          onChange(toggleCode(value, symptom.code, TRIAGE.symptoms))
+        }
+        className={cx(
+          "min-h-11 rounded-full px-4 text-[15px]",
+          on ? "bg-ink font-semibold text-bg" : "glass font-medium text-ink",
+        )}
+      >
+        {on ? `✓ ${symptom.short}` : symptom.short}
+      </button>
+    );
+  };
+  return (
+    <div className="flex flex-col gap-2">
+      <span className={FIELD_LABEL}>Hay gặp</span>
+      <div role="group" aria-label="Hay gặp" className={ROW}>
+        {layout.common.map(chip)}
+        {!expanded && layout.picked.map(chip)}
+      </div>
+      {layout.groups.length > 0 && (
+        <button
+          type="button"
+          aria-expanded={expanded}
+          onClick={() => onExpanded(!expanded)}
+          className="min-h-11 self-start rounded-full bg-accent-tint px-4 text-[15px] font-semibold text-accent-text"
+        >
+          {expanded ? "Thu gọn" : `Xem tất cả ${layout.total} triệu chứng`}
+        </button>
+      )}
+      {expanded &&
+        layout.groups.map((group) => (
+          <div key={group.code} className="flex flex-col gap-2">
+            <span className={FIELD_LABEL}>{group.name}</span>
+            <div role="group" aria-label={group.name} className={ROW}>
+              {group.chips.map(chip)}
+            </div>
+          </div>
+        ))}
+    </div>
+  );
+}
+
+export function SymptomPicker(props: {
+  value: string;
+  onChange: (next: string) => void;
+  ageDays: number | null;
+}) {
+  const [expanded, setExpanded] = useState(false);
+  return (
+    <SymptomPickerView
+      {...props}
+      expanded={expanded}
+      onExpanded={setExpanded}
+    />
+  );
+}
```

- [x] **Step 4: Chạy để thấy xanh**

Run: `bunx vitest run && bun run typecheck`
Expected: `Test Files  186 passed (186)`, `Tests  1692 passed (1692)`; `tsc --noEmit` không báo lỗi.

- [x] **Step 5: Commit**

```bash
git add components/quick/SymptomPicker.tsx components/quick/SymptomFields.tsx components/quick/FieldList.tsx components/quick/symptoms.test.tsx components/quick/fieldlist.test.tsx
git commit -m "feat(symptom): the chip picker" -m "Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>"
```

### Task 2: Phiếu ghi, phiếu sửa, ô trong phiếu "+" (§3.3, §3.4, §3.5)

**Files:**

- Modify: `components/home/QuickEntrySheet.tsx`, `components/actions/QuickActions.tsx`, `components/history/LogEditSheet.tsx`, `components/history/HistoryScreen.tsx`, `lib/rules/quickActions.ts`, `lib/rules/logForm.ts`
- Test: `components/home/quickentry.test.tsx`, `components/history/logedit.test.tsx`, `components/actions/actionsheet.test.tsx`, `lib/rules/quickActions.test.ts`, `lib/rules/logForm.test.ts`

**Interfaces:**

- Consumes: `SymptomFields`, `FieldList` có `ageDays` (Task 1); `parseCodes` (M1a); `ageDays(dob, now)`.
- Produces: `QuickEntrySheet` và `LogEditSheet` có `ageDays`; `QUICK_ACTIONS` có `symptom` ở vị trí 9; `MANUAL_TYPES` có `symptom` ở vị trí 6.

- [x] **Step 1: Viết test đỏ (Patch 3)**

Các con số đếm ô trong `actionsheet.test.tsx` đổi theo ô mới: 13 thành 14 nút, nhóm "Khác" 4 thành 5, và các chỉ số nút dịch đi một.

```diff
diff --git a/components/actions/actionsheet.test.tsx b/components/actions/actionsheet.test.tsx
index 014fd42..23f80c1 100644
--- a/components/actions/actionsheet.test.tsx
+++ b/components/actions/actionsheet.test.tsx
@@ -20,7 +20,7 @@ describe("QuickActionGrid", () => {
     <QuickActionGrid running={[]} onPick={() => {}} />,
   );

-  it("draws three titled groups: Khác and Ghi nhanh as 4-column grids of 84 px tiles", () => {
+  it("draws three titled groups: Khác (5 tiles) and Ghi nhanh (4) as 4-column grids of 84 px tiles", () => {
     const titles = [...html.matchAll(/<h3 class="([^"]*)">([^<]+)<\/h3>/g)];
     // Spec 2026-11-19 §5.4: the most used group sits lowest, near the thumb.
     expect(titles.map((m) => m[2])).toEqual(["Khác", "Ghi nhanh", "Bấm giờ"]);
@@ -28,14 +28,25 @@ describe("QuickActionGrid", () => {
       "text-[13px] leading-[18px] font-semibold text-muted",
     );
     const [other, quick, timers] = sectionsOf(html);
-    for (const part of [other, quick]) {
+    // Spec 2026-11-26 §3.3: Triệu chứng is the fifth tile of Khác, on a second row.
+    for (const [part, count] of [
+      [other, 5],
+      [quick, 4],
+    ] as const) {
       expect(part).toContain('<div class="grid grid-cols-4 gap-2">');
-      expect(part.match(/<button/g)).toHaveLength(4);
-      expect(part.match(/h-\[84px\][^"]*rounded-\[20px\]/g)).toHaveLength(4);
-      expect(part.match(/size-\[38px\]/g)).toHaveLength(4);
-      expect(part.match(/width="20" height="20"/g)).toHaveLength(4);
+      expect(part.match(/<button/g)).toHaveLength(count);
+      expect(part.match(/h-\[84px\][^"]*rounded-\[20px\]/g)).toHaveLength(
+        count,
+      );
+      expect(part.match(/size-\[38px\]/g)).toHaveLength(count);
+      expect(part.match(/width="20" height="20"/g)).toHaveLength(count);
       expect(part).not.toContain("size-[58px]");
     }
+    expect(other).toContain("bg-cat-med/15 text-cat-med");
+    expect(other).toContain(`d="${ICON_PATHS.pulse}"`);
+    expect(other.indexOf(">Triệu chứng</span>")).toBeLessThan(
+      other.indexOf(">Ăn dặm</span>"),
+    );
     expect(timers).not.toContain("h-[84px]");
     expect(html).toContain("bg-cat-diaper/15 text-cat-diaper");
     for (const icon of ["drop", "bowl", "glass", "bath", "doc"] as const)
@@ -69,10 +80,13 @@ describe("QuickActionGrid", () => {
       html.match(
         /<span class="[^"]*\bwhitespace-nowrap\b[^"]*">[^<]+<\/span><\/button>/g,
       ),
-    ).toHaveLength(13);
+    ).toHaveLength(14);
     expect(html).toContain(
       '<span class="text-center text-xs leading-4 font-semibold whitespace-nowrap">Uống nước</span>',
     );
+    expect(html).toContain(
+      '<span class="text-center text-xs leading-4 font-semibold whitespace-nowrap">Triệu chứng</span>',
+    );
     for (const action of QUICK_ACTIONS)
       expect(html).toContain(`>${action.label}</span>`);
   });
@@ -110,17 +124,20 @@ describe("QuickActionGrid", () => {
       QuickActionGrid({ running: [], onPick }),
       "button",
     );
-    expect(buttons).toHaveLength(13);
+    expect(buttons).toHaveLength(14);
     // Buttons follow the sheet's group order; QUICK_ACTIONS keeps its own.
-    (buttons[5].props.onClick as () => void)();
+    (buttons[6].props.onClick as () => void)();
     expect(onPick).toHaveBeenCalledWith(QUICK_ACTIONS[6]);
     expect(QUICK_ACTIONS[6].label).toBe("Thay tã");
-    (buttons[3].props.onClick as () => void)();
-    expect(onPick).toHaveBeenLastCalledWith(QUICK_ACTIONS[12]);
-    expect(QUICK_ACTIONS[12]).toMatchObject({ instant: "note" });
-    (buttons[8].props.onClick as () => void)();
+    (buttons[4].props.onClick as () => void)();
+    expect(onPick).toHaveBeenLastCalledWith(QUICK_ACTIONS[13]);
+    expect(QUICK_ACTIONS[13]).toMatchObject({ instant: "note" });
+    (buttons[9].props.onClick as () => void)();
     expect(onPick).toHaveBeenLastCalledWith(QUICK_ACTIONS[0]);
     expect(QUICK_ACTIONS[0].label).toBe("Bú trái");
+    (buttons[0].props.onClick as () => void)();
+    expect(onPick).toHaveBeenLastCalledWith(QUICK_ACTIONS[9]);
+    expect(QUICK_ACTIONS[9]).toMatchObject({ instant: "symptom" });
   });
 });

@@ -131,8 +148,8 @@ describe("QuickActionGrid groups", () => {
       <QuickActionGrid running={[]} onPick={() => {}} groups={["other"]} />,
     );
     expect(titlesOf(html)).toEqual(["Khác"]);
-    expect(html.match(/<button/g)).toHaveLength(4);
-    for (const label of ["Ăn dặm", "Uống nước", "Tắm", "Ghi chú"])
+    expect(html.match(/<button/g)).toHaveLength(5);
+    for (const label of ["Triệu chứng", "Ăn dặm", "Uống nước", "Tắm", "Ghi chú"])
       expect(html).toContain(`>${label}</span>`);
     expect(html).not.toContain("Thay tã");
     expect(html).not.toContain("Bú trái");
@@ -147,7 +164,7 @@ describe("QuickActionGrid groups", () => {
       />,
     );
     expect(titlesOf(html)).toEqual(["Khác", "Bấm giờ"]);
-    expect(html.match(/<button/g)).toHaveLength(9);
+    expect(html.match(/<button/g)).toHaveLength(10);
   });

   it("reports a pick from a filtered sheet", () => {
@@ -156,10 +173,10 @@ describe("QuickActionGrid groups", () => {
       QuickActionGrid({ running: [], onPick, groups: ["other"] }),
       "button",
     );
-    expect(buttons).toHaveLength(4);
-    (buttons[1].props.onClick as () => void)();
-    expect(onPick).toHaveBeenCalledWith(QUICK_ACTIONS[10]);
-    expect(QUICK_ACTIONS[10].label).toBe("Uống nước");
+    expect(buttons).toHaveLength(5);
+    (buttons[2].props.onClick as () => void)();
+    expect(onPick).toHaveBeenCalledWith(QUICK_ACTIONS[11]);
+    expect(QUICK_ACTIONS[11].label).toBe("Uống nước");
   });
 });

@@ -209,7 +226,7 @@ describe("QuickActionGrid next-side hint (spec 2026-11-17 §5.3)", () => {
     expect(other + quick).not.toContain("Nên bú");
     expect(html).toContain('aria-label="Bú trái, nên bú"');
     expect(html).toContain('aria-label="Bú phải"');
-    expect(html.match(/<button/g)).toHaveLength(13);
+    expect(html.match(/<button/g)).toHaveLength(14);
   });

   it("shows no label without a hint", () => {
diff --git a/components/history/logedit.test.tsx b/components/history/logedit.test.tsx
index 7685047..c4c117f 100644
--- a/components/history/logedit.test.tsx
+++ b/components/history/logedit.test.tsx
@@ -80,13 +80,40 @@ describe("LogEditSheet", () => {
     expect(html).not.toContain("Xóa bản ghi");
   });

+  it("spec 2026-11-26 §3.5: a symptom log edits its chips and its own note, no second Ghi chú", () => {
+    const symptom = {
+      ...diaper,
+      id: "s1",
+      type: "symptom",
+      details: { codes: ["runny_nose", "cough"], note: "Ho về đêm" },
+      note: null,
+    } as LogRow;
+    const html = render({ log: symptom, ageDays: 76 });
+    expect(html).toContain("bg-cat-med/15 text-cat-med");
+    expect(html).toContain(`d="${ICON_PATHS.pulse}"`);
+    expect(html).toContain("11:00 · Triệu chứng: Sổ mũi, Ho · Ho về đêm · Mẹ");
+    expect(html).toMatch(/aria-pressed="true"[^>]*>✓ Sổ mũi<\/button>/);
+    expect(html).toMatch(/aria-pressed="true"[^>]*>✓ Ho<\/button>/);
+    expect(html).toContain(">Xem tất cả 22 triệu chứng</button>");
+    expect(html).toContain(">Ghi chú (không bắt buộc)</span>");
+    expect(html).toContain(">Ho về đêm</textarea>");
+    expect(html).not.toContain(">Ghi chú</span>");
+    expect(html.match(/<textarea/g)).toHaveLength(1);
+    expect(html).not.toContain("Bấm những gì bé đang có.");
+    expect(html).toContain(">Thời điểm</span>");
+  });
+
   it("new log: the type picker also offers the four new types", () => {
     const html = render({});
     expect(html).toContain('<option value="solids">Ăn dặm</option>');
     expect(html).toContain('<option value="water">Uống nước</option>');
     expect(html).toContain('<option value="bath">Tắm</option>');
     expect(html).toContain('<option value="note">Ghi chú</option>');
-    expect(html.match(/<option /g)).toHaveLength(10);
+    expect(html.match(/<option /g)).toHaveLength(11);
+    // Spec 2026-11-26 §3.4: Triệu chứng sits right after Nhiệt độ.
+    expect(html).toContain(
+      '<option value="temperature">Nhiệt độ</option><option value="symptom">Triệu chứng</option>',
+    );
   });

   it("a note log: Nội dung only, the sheet's own Ghi chú field is hidden", () => {
diff --git a/components/home/quickentry.test.tsx b/components/home/quickentry.test.tsx
index e9393f4..e25c8e0 100644
--- a/components/home/quickentry.test.tsx
+++ b/components/home/quickentry.test.tsx
@@ -88,6 +88,35 @@ describe("QuickEntrySheet", () => {
     );
   });

+  it("spec 2026-11-26 §3.5: symptom opens on its chips; Lưu waits for the first one", () => {
+    const html = render({ type: "symptom", ageDays: 76 });
+    expect(html).toContain(">Triệu chứng</h2>");
+    expect(html).toContain("bg-cat-med/15 text-cat-med");
+    expect(html).toContain(`d="${ICON_PATHS.pulse}"`);
+    expect(html).toContain(">Bấm những gì bé đang có.</p>");
+    expect(html).toContain(">Xem tất cả 22 triệu chứng</button>");
+    expect(html).not.toContain('aria-pressed="true">✓');
+    expect(html.indexOf(">Hay gặp</span>")).toBeLessThan(
+      html.indexOf(">Ghi chú (không bắt buộc)</span>"),
+    );
+    expect(html.indexOf(">Ghi chú (không bắt buộc)</span>")).toBeLessThan(
+      html.indexOf(">Lúc nào?</span>"),
+    );
+    expect(html).toMatch(/<button[^>]*type="submit"[^>]*disabled=""[^>]*>Lưu</);
+    const picked = render({
+      type: "symptom",
+      ageDays: 76,
+      initial: { codes: "cough" },
+    });
+    expect(picked).toContain(">Bấm những gì bé đang có. Đã chọn 1.</p>");
+    expect(picked).toMatch(/aria-pressed="true"[^>]*>✓ Ho<\/button>/);
+    expect(picked).not.toMatch(/<button[^>]*type="submit"[^>]*disabled=""/);
+    // The other types never disable Lưu up front.
+    expect(render({ type: "note" })).not.toMatch(
+      /<button[^>]*type="submit"[^>]*disabled=""/,
+    );
+  });
+
   it("water, bath and note: own title and icon; bath has no field at all", () => {
     const water = render({ type: "water" });
     expect(water).toContain(">Uống nước</h2>");
diff --git a/lib/rules/logForm.test.ts b/lib/rules/logForm.test.ts
index a6318d4..a7def08 100644
--- a/lib/rules/logForm.test.ts
+++ b/lib/rules/logForm.test.ts
@@ -141,10 +141,11 @@ describe("logForm", () => {
     ).toEqual({ ok: false, message: "Nhập số ml từ 1 đến 400" });
   });

-  it("MANUAL_TYPES: the six old types, then Ăn dặm, Uống nước, Tắm and Ghi chú", () => {
-    expect(MANUAL_TYPES).toHaveLength(10);
+  it("MANUAL_TYPES: the six old types, Triệu chứng, then Ăn dặm, Uống nước, Tắm and Ghi chú", () => {
+    expect(MANUAL_TYPES).toHaveLength(11);
     expect(MANUAL_TYPES[5].label).toBe("Nhiệt độ");
-    expect(MANUAL_TYPES.slice(6)).toEqual([
+    expect(MANUAL_TYPES[6]).toEqual({ value: "symptom", label: "Triệu chứng" });
+    expect(MANUAL_TYPES.slice(7)).toEqual([
       { value: "solids", label: "Ăn dặm" },
       { value: "water", label: "Uống nước" },
       { value: "bath", label: "Tắm" },
diff --git a/lib/rules/quickActions.test.ts b/lib/rules/quickActions.test.ts
index c2d5602..10765d9 100644
--- a/lib/rules/quickActions.test.ts
+++ b/lib/rules/quickActions.test.ts
@@ -25,11 +25,11 @@ describe("QUICK_ACTIONS", () => {
   const labelsOf = (group: string) =>
     QUICK_ACTIONS.filter((a) => a.group === group).map((a) => a.label);

-  it("lists thirteen actions group by group: timers, quick entries, the rest", () => {
+  it("lists fourteen actions group by group: timers, quick entries, the rest", () => {
     expect(QUICK_ACTIONS.map((a) => a.group)).toEqual([
       ...Array(5).fill("timer"),
       ...Array(4).fill("quick"),
-      ...Array(4).fill("other"),
+      ...Array(5).fill("other"),
     ]);
     expect(labelsOf("timer")).toEqual([
       "Bú trái",
@@ -45,12 +45,27 @@ describe("QUICK_ACTIONS", () => {
       "Nhiệt độ",
     ]);
     expect(labelsOf("other")).toEqual([
+      "Triệu chứng",
       "Ăn dặm",
       "Uống nước",
       "Tắm",
       "Ghi chú",
     ]);
-    expect(new Set(QUICK_ACTIONS.map((a) => a.key)).size).toBe(13);
+    expect(new Set(QUICK_ACTIONS.map((a) => a.key)).size).toBe(14);
+  });
+
+  // Spec 2026-11-26 §3.3: in Khác, so the home page's quick row stays as it is.
+  it("Triệu chứng is an instant entry that opens the Khác group", () => {
+    expect(byKey("symptom")).toEqual({
+      key: "symptom",
+      label: "Triệu chứng",
+      kind: "instant",
+      group: "other",
+      category: "symptom",
+      instant: "symptom",
+    });
+    expect(QUICK_ACTIONS.indexOf(byKey("symptom"))).toBe(9);
+    expect(QUICK_ACTIONS[10].key).toBe("solids");
   });

   // Spec 2026-11-19 §5.4: the "+" sheet lists Khác, Ghi nhanh, then Bấm giờ.
```

- [x] **Step 2: Chạy để thấy đỏ**

Run: `bunx vitest run`
Expected: `Test Files  5 failed | 181 passed (186)`, `Tests  13 failed | 1682 passed (1695)`.

- [x] **Step 3: Nối bộ chọn vào hai phiếu và thêm đường vào (Patch 4)**

```diff
diff --git a/components/actions/QuickActions.tsx b/components/actions/QuickActions.tsx
index 1a583f5..23ce4a3 100644
--- a/components/actions/QuickActions.tsx
+++ b/components/actions/QuickActions.tsx
@@ -29,6 +29,7 @@ import {
   type QuickActionGroup,
 } from "@/lib/rules/quickActions";
 import type { InstantType, QuickValues } from "@/lib/rules/quickEntry";
+import { ageDays } from "@/lib/rules/time";
 import {
   nextBreastSide,
   type BreastSide,
@@ -182,6 +183,7 @@ export function QuickActionsProvider({
           type={sheet.type}
           initial={sheet.initial}
           recentLogs={rows}
+          ageDays={ageDays(baby.dob, new Date())}
           babyId={baby.id}
           userId={userId}
           onSaved={(saved) => showUndo(instantToast(saved))}
diff --git a/components/history/HistoryScreen.tsx b/components/history/HistoryScreen.tsx
index fbcfe45..603e15f 100644
--- a/components/history/HistoryScreen.tsx
+++ b/components/history/HistoryScreen.tsx
@@ -31,6 +31,7 @@ import {
   matchesFilter,
   type HistoryFilter,
 } from "@/lib/rules/history";
+import { ageDays } from "@/lib/rules/time";
 import type { Baby, FamilyMember, LogRow } from "@/lib/supabase/rows";
 import { HistoryList } from "./HistoryList";
 import { LogEditSheet } from "./LogEditSheet";
@@ -191,6 +192,7 @@ export function HistoryScreen({
           }
           who={sheet.log ? nameOf(sheet.log.created_by) : ""}
           recentLogs={rows}
+          ageDays={ageDays(baby.dob, now)}
           onClose={() => setSheet(null)}
         />
       )}
diff --git a/components/history/LogEditSheet.tsx b/components/history/LogEditSheet.tsx
index 927c517..c861754 100644
--- a/components/history/LogEditSheet.tsx
+++ b/components/history/LogEditSheet.tsx
@@ -34,6 +34,7 @@ export function LogEditSheet({
   canModify,
   who,
   recentLogs,
+  ageDays = null,
   onClose,
 }: {
   babyId: string;
@@ -42,6 +43,8 @@ export function LogEditSheet({
   canModify: boolean;
   who: string;
   recentLogs: LogRow[];
+  // Spec 2026-11-26 §3.5: filters the symptom chips; null shows them all.
+  ageDays?: number | null;
   onClose: () => void;
 }) {
   const save = useSaveLog(babyId, userId);
@@ -216,6 +219,7 @@ export function LogEditSheet({
               fields={LOG_FIELDS[type]}
               values={values}
               onChange={setValues}
+              ageDays={ageDays}
             />
             {dateField(timer ? "Bắt đầu" : "Thời điểm", start, setStart)}
             {timer &&
diff --git a/components/home/QuickEntrySheet.tsx b/components/home/QuickEntrySheet.tsx
index d21514c..ab2f0e2 100644
--- a/components/home/QuickEntrySheet.tsx
+++ b/components/home/QuickEntrySheet.tsx
@@ -6,6 +6,7 @@ import { DiaperFields } from "@/components/quick/DiaperFields";
 import { MedicineFields } from "@/components/quick/MedicineFields";
 import { NoteFields } from "@/components/quick/NoteFields";
 import { SolidsFields } from "@/components/quick/SolidsFields";
+import { SymptomFields } from "@/components/quick/SymptomFields";
 import { TemperatureFields } from "@/components/quick/TemperatureFields";
 import { TimeChips } from "@/components/quick/TimeChips";
 import { WaterFields } from "@/components/quick/WaterFields";
@@ -25,6 +26,7 @@ import {
   type InstantType,
   type QuickValues,
 } from "@/lib/rules/quickEntry";
+import { parseCodes } from "@/lib/rules/symptomForm";
 import {
   timeChipError,
   timeChipToDate,
@@ -54,6 +56,7 @@ export function QuickEntrySheet({
   onSaved,
   initial,
   recentLogs = [],
+  ageDays = null,
 }: {
   type: InstantType;
   babyId: string;
@@ -67,6 +70,8 @@ export function QuickEntrySheet({
   }) => void;
   initial?: QuickValues;
   recentLogs?: LogRow[];
+  // Spec 2026-11-26 §3.5: filters the symptom chips; null shows them all.
+  ageDays?: number | null;
 }) {
   const add = useAddInstant(babyId, userId);
   const formId = useId();
@@ -150,9 +155,13 @@ export function QuickEntrySheet({
     // Tắm has no fields: the sheet is just the time chips and Lưu.
     bath: null,
     note: <NoteFields values={values} onChange={setValues} />,
-    // Spec 2026-11-26 §3.5: the chip picker is added with the sheet's own task.
-    symptom: null,
+    symptom: (
+      <SymptomFields values={values} onChange={setValues} ageDays={ageDays} />
+    ),
   }[type];
+  // Spec 2026-11-26 §3.5: a symptom log needs at least one chip.
+  const nothingPicked =
+    type === "symptom" && parseCodes(values.codes).length === 0;

   return (
     <Sheet
@@ -174,6 +183,7 @@ export function QuickEntrySheet({
             form={formId}
             block
             busy={add.isPending}
+            disabled={nothingPicked}
             className="min-h-14!"
           >
             Lưu
diff --git a/lib/rules/logForm.ts b/lib/rules/logForm.ts
index ca14ad7..09f6598 100644
--- a/lib/rules/logForm.ts
+++ b/lib/rules/logForm.ts
@@ -15,6 +15,7 @@ export const MANUAL_TYPES: { value: LogType; label: string }[] = [
   { value: "diaper", label: "Tã" },
   { value: "medicine", label: "Thuốc" },
   { value: "temperature", label: "Nhiệt độ" },
+  { value: "symptom", label: "Triệu chứng" },
   { value: "solids", label: "Ăn dặm" },
   { value: "water", label: "Uống nước" },
   { value: "bath", label: "Tắm" },
diff --git a/lib/rules/quickActions.ts b/lib/rules/quickActions.ts
index efdc607..c4c6ea0 100644
--- a/lib/rules/quickActions.ts
+++ b/lib/rules/quickActions.ts
@@ -135,6 +135,15 @@ export const QUICK_ACTIONS: QuickAction[] = [
     category: "temperature",
     instant: "temperature",
   },
+  // Spec 2026-11-26 §3.3: first of Khác, so the home page's quick row is untouched.
+  {
+    key: "symptom",
+    label: "Triệu chứng",
+    kind: "instant",
+    group: "other",
+    category: "symptom",
+    instant: "symptom",
+  },
   {
     key: "solids",
     label: "Ăn dặm",
```

- [x] **Step 4: Chạy để thấy xanh**

Run: `bunx vitest run && bun run typecheck`
Expected: `Test Files  186 passed (186)`, `Tests  1695 passed (1695)`; `tsc --noEmit` không báo lỗi.

- [x] **Step 5: Commit**

```bash
git add components/home/QuickEntrySheet.tsx components/home/quickentry.test.tsx components/actions/QuickActions.tsx components/actions/actionsheet.test.tsx components/history/LogEditSheet.tsx components/history/HistoryScreen.tsx components/history/logedit.test.tsx lib/rules/quickActions.ts lib/rules/quickActions.test.ts lib/rules/logForm.ts lib/rules/logForm.test.ts
git commit -m "feat(symptom): the entry sheet, the edit sheet and the + tile" -m "Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>"
```

### Task 3: Kiểm cuối M1b, checklist thiết bị, rồi đưa lên `main`

**Files:**

- Create rồi xóa trước khi commit: `app/fixture-symptom/page.tsx` (trang tạm, không commit)
- Modify: `docs/device-checklist.md`, file plan này (ghi kết quả kiểm)

**Interfaces:**

- Consumes: mọi thứ của các task trước trong plan này.
- Produces: kết quả kiểm, ghi ngay trong plan; Bước 38 của checklist; `main` có M1b.

- [x] **Step 1: Chạy cả bộ kiểm**

Run: `bun run typecheck && bunx vitest run`
Expected: `tsc --noEmit` không báo lỗi; `Test Files  186 passed (186)`, `Tests  1695 passed (1695)`.

- [x] **Step 2: Build**

Run: `bun run build`
Expected: lần đầu có thể dừng với thông báo bảo mật của Next.js 16.4.3 (bình thường). Chạy lại đúng lệnh đó: `✓ Generating static pages` và thoát mã 0.

- [x] **Step 3: Tạo trang fixture tạm cho các trạng thái dữ liệu thật không có**

Trang này không đọc hay ghi dữ liệu của gia đình. Dữ liệu thật chưa có bản ghi triệu chứng nào, nên phiếu sửa, dòng mô tả và chip ngoài tuổi chỉ thấy được ở đây. Tạo `app/fixture-symptom/page.tsx`:

```tsx
"use client";

import { useState } from "react";
import { QuickActionGrid } from "@/components/actions/ActionSheet";
import { LogEditSheet } from "@/components/history/LogEditSheet";
import { QuickEntrySheet } from "@/components/home/QuickEntrySheet";
import { SymptomPickerView } from "@/components/quick/SymptomPicker";
import { describeLog } from "@/lib/rules/describeLog";
import type { LogRow } from "@/lib/supabase/rows";

const AT = "2026-11-26T02:00:00.000Z";
const SAMPLE = {
  id: "fixture-symptom",
  baby_id: "fixture-baby",
  type: "symptom",
  started_at: AT,
  ended_at: AT,
  // gone_code: a code the content no longer has; drooling: outside the age of 76 days.
  details: {
    codes: ["runny_nose", "cough", "drooling", "gone_code"],
    note: "Ho nhiều hơn về đêm, khò khè nhẹ khi nằm",
  },
  note: null,
  created_by: "fixture-user",
  created_at: AT,
  updated_at: AT,
} as LogRow;

const noop = () => {};

// Bốn khối tĩnh, rồi hai nút mở hai phiếu thật. Không bấm "Lưu" ở phiếu nào.
export default function Page() {
  const [sheet, setSheet] = useState<"new" | "edit" | null>(null);
  return (
    <main className="mx-auto flex max-w-md flex-col gap-[22px] px-4 pt-2 pb-32">
      <p className="text-ink">Fixture bản ghi Triệu chứng</p>
      <section className="glass-strong flex flex-col gap-4 rounded-[28px] p-4">
        <p className="text-muted">1 · Thu gọn, chưa chọn</p>
        <SymptomPickerView
          value=""
          onChange={noop}
          ageDays={76}
          expanded={false}
          onExpanded={noop}
        />
      </section>
      <section className="glass-strong flex flex-col gap-4 rounded-[28px] p-4">
        <p className="text-muted">2 · Thu gọn, đã chọn Sổ mũi, Ho, Đầy hơi</p>
        <SymptomPickerView
          value="runny_nose,cough,gassy"
          onChange={noop}
          ageDays={76}
          expanded={false}
          onExpanded={noop}
        />
      </section>
      <section className="glass-strong flex flex-col gap-4 rounded-[28px] p-4">
        <p className="text-muted">3 · Mở hết, bé 200 ngày tuổi</p>
        <SymptomPickerView
          value="runny_nose,cough,gassy"
          onChange={noop}
          ageDays={200}
          expanded
          onExpanded={noop}
        />
      </section>
      <section className="glass-strong flex flex-col gap-4 rounded-[28px] p-4">
        <p className="text-muted">4 · Nhóm Khác của phiếu +</p>
        <QuickActionGrid running={[]} onPick={noop} groups={["other"]} />
        <p className="text-ink">{describeLog(SAMPLE, new Date(AT))}</p>
      </section>
      <button
        type="button"
        className="glass min-h-11 rounded-full px-4 text-ink"
        onClick={() => setSheet("new")}
      >
        5 · Mở phiếu ghi mới
      </button>
      <button
        type="button"
        className="glass min-h-11 rounded-full px-4 text-ink"
        onClick={() => setSheet("edit")}
      >
        6 · Mở phiếu sửa
      </button>
      {sheet === "new" && (
        <QuickEntrySheet
          type="symptom"
          babyId="fixture-baby"
          userId="fixture-user"
          ageDays={76}
          onClose={() => setSheet(null)}
        />
      )}
      {sheet === "edit" && (
        <LogEditSheet
          babyId="fixture-baby"
          userId="fixture-user"
          log={SAMPLE}
          canModify
          who="Mẹ"
          recentLogs={[]}
          ageDays={76}
          onClose={() => setSheet(null)}
        />
      )}
    </main>
  );
}
```

- [x] **Step 4: Kiểm trong trình duyệt (chỉ xem)**

Hỏi người dùng dùng trình duyệt nào (Diễn giải spec mục 12), cỡ 375×812. Chạy `bun run dev`.

Trên trang tạm `http://localhost:3000/fixture-symptom`:

1. **Khối 1:** nhãn "Hay gặp", tám chip theo thứ tự Sốt, Sổ mũi, Ho, Khò khè, Trớ sữa, Nôn, Tiêu chảy, Quấy; nút "Xem tất cả 22 triệu chứng". Mỗi chip cao ít nhất 44 px (`getBoundingClientRect()`); không chip nào có "…" hay tràn khỏi thẻ. Ghi lại số hàng chip.
2. **Khối 2:** "✓ Sổ mũi" và "✓ Ho" nền đậm; chip thứ chín là "✓ Đầy hơi".
3. **Khối 3:** nút đọc "Thu gọn" và đứng trên nhóm đầu; năm nhóm theo thứ tự Hô hấp, Tiêu hóa, Da, Hành vi, ăn bú, Khác; có "Chảy dãi" (bé 200 ngày), không có "Khóc nhiều" (tới 180 ngày); "Đầy hơi" chỉ xuất hiện một lần, trong nhóm Tiêu hóa, đang chọn. Chip dài nhất "Mảng trắng miệng" nằm trên một dòng: ghi bề ngang của nó và của thẻ.
4. **Khối 4:** năm ô, hàng đầu Triệu chứng, Ăn dặm, Uống nước, Tắm; "Ghi chú" ở hàng hai. Chữ "Triệu chứng" là nhãn dài nhất của lưới và không xuống dòng (`whitespace-nowrap`): so `getBoundingClientRect()` của nhãn với của ô chứa nó, ghi cả hai bề ngang. Nhãn phải nằm trọn trong ô; tràn ra ngoài ô hoặc chạm ô bên cạnh là lỗi. Dòng mô tả bên dưới đọc "Triệu chứng: Sổ mũi, Ho, Chảy dãi · Ho nhiều hơn về đêm, khò khè nhẹ khi nằm" (mã lạ `gone_code` không hiện).
5. **Nút 5 (phiếu ghi mới):** tiêu đề "Triệu chứng" với icon nhịp tim trong ô màu của thuốc; dòng "Bấm những gì bé đang có."; chip; nút "Xem tất cả 22 triệu chứng"; ô "Ghi chú (không bắt buộc)"; rồi "Lúc nào?". Nút "Lưu" mờ. Bấm "Ho": chip thành "✓ Ho", dòng trên thành "Bấm những gì bé đang có. Đã chọn 1.", nút "Lưu" hết mờ. Bấm "Xem tất cả 22 triệu chứng" rồi "Thu gọn": danh sách mở và đóng, phiếu cuộn được tới "Lúc nào?". **Không bấm "Lưu".** Đóng phiếu (phiếu có thể hỏi lại trước khi bỏ thay đổi, vì đã bấm chip).
6. **Nút 6 (phiếu sửa):** dòng đầu "09:00 · Triệu chứng: Sổ mũi, Ho, Chảy dãi · … · Mẹ"; "✓ Sổ mũi", "✓ Ho" và, sau các chip hay gặp, "✓ Chảy dãi" (ngoài tuổi nhưng đã chọn); nút "Xem tất cả 23 triệu chứng"; ô "Ghi chú (không bắt buộc)" chứa ghi chú mẫu; có "Thời điểm"; **không** có ô "Ghi chú" thứ hai; không có dòng "Bấm những gì bé đang có.". **Không bấm "Lưu" hay "Xóa bản ghi".**
7. `document.documentElement.scrollWidth <= window.innerWidth` là `true`.
8. Lặp mục 1 đến 4 với `document.documentElement.dataset.theme = "rose"`, `"light"`, `"dark"`, `"night"`. Ở `night`: chip đang chọn và chưa chọn vẫn khác nhau rõ (nền và dấu ✓).

Trang thật (dữ liệu thật của gia đình: chỉ xem):

9. `http://localhost:3000/`: hàng "Ghi nhanh" vẫn năm nút như trước (Thay tã, Bú bình, Thuốc, Nhiệt độ, Khác). Bấm "Khác": phiếu chỉ có nhóm "Khác" với năm ô, ô đầu "Triệu chứng". Bấm "Triệu chứng": phiếu như mục 5, số trong nút khớp với tuổi thật của bé. **Không bấm "Lưu".**
10. Bấm "+": ba nhóm Khác, Ghi nhanh, Bấm giờ; nhóm Khác năm ô.
11. `http://localhost:3000/nhat-ky`: bấm "Ghi bù", mở danh sách "Loại": có "Triệu chứng" ngay sau "Nhiệt độ". Chọn nó: bộ chọn chip hiện ra, không có ô "Ghi chú" thứ hai. **Không bấm "Lưu".** Bộ lọc "Nhiệt độ" vẫn chạy.
12. `document.documentElement.scrollWidth <= window.innerWidth` là `true` ở cả hai trang. Console không có lỗi.

Dừng `bun run dev` khi xong. Ghi kết quả từng mục ngay dưới bước này, kèm số đo. Mục nào không cho thấy được thì ghi "chưa kiểm". Nếu bước này lộ ra lỗi và code phải đổi: sửa (test trước, code sau), rồi chạy lại Step 1 và Step 2 trước khi đi tiếp.

**Kết quả kiểm (2026-11-26, khoảng 23:00, khung Browser trong app do người dùng chọn, 375×812, DPR 2).** Số đo lấy bằng `getBoundingClientRect()` và `Range.getClientRects()` trong trang. Mục 1–8 xem trên trang tạm; hai phiếu của mục 5 và 6 là component thật, dữ liệu giả.

1. **Đạt.** "Hay gặp", tám chip đúng thứ tự, nút "Xem tất cả 22 triệu chứng" (216,1 × 44 px). Mọi chip cao 44 px, một dòng, nằm trong thẻ (thẻ 343 px, lòng thẻ 311 px), không có "…". Chip xếp 3 hàng: 4 + 3 + 1.
2. **Đạt.** "✓ Sổ mũi", "✓ Ho" nền `bg-ink`, chữ đậm 600; chip thứ chín là "✓ Đầy hơi". 3 hàng.
3. **Đạt.** Nút "Thu gọn" đứng trên nhóm "Hô hấp"; nhóm theo thứ tự Hay gặp (8), Hô hấp (1), Tiêu hóa (2), Da (6), Hành vi, ăn bú (1), Khác (4), tổng 22 chip; có "Chảy dãi", không có "Khóc nhiều"; "Đầy hơi" một lần, trong Tiêu hóa, đang chọn. "Mảng trắng miệng" một dòng, rộng 161,2 px trong lòng thẻ 311 px.
4. **Đạt theo tiêu chí của plan, nhưng sát mép.** Năm ô, hàng đầu Triệu chứng, Ăn dặm, Uống nước, Tắm; "Ghi chú" ở hàng hai. Trong khối 4 của trang tạm (lưới nằm trong thẻ, hẹp hơn phiếu thật): ô 71,3 px, nhãn "Triệu chứng" 70,1 px, một dòng, nằm trong ô, hở 0,6 px mỗi bên. Vì khối 4 hẹp hơn phiếu thật, trang tạm được thêm hai nút mở chính `ActionSheetView` (phiếu "+" đủ ba nhóm, và phiếu chỉ nhóm "Khác"): ở đó lưới rộng 317 px, ô 73,3 px (lòng ô 63,3 px sau `px-1` và viền), nhãn "Triệu chứng" 70,1 px, một dòng, hở 1,6 px mỗi bên; không chạm ô bên cạnh (khe 8 px). Nhãn lấn vào phần đệm của ô: nhìn sát mép. Để so: "Uống nước" 63,3 px, hở 5 px mỗi bên. Ở 390 px ô rộng 77 px, hở khoảng 3,5 px mỗi bên (tính, không đo). Không sửa trong phiên: đúng tiêu chí "nằm trọn trong ô" của plan; muốn thoáng hơn thì phải đổi chữ hoặc kiểu chữ của nhãn, là việc người dùng quyết. Dòng mô tả đúng chữ, 2 dòng, không có `gone_code`.
5. **Đạt.** Tiêu đề "Triệu chứng", icon nhịp tim trong ô `bg-cat-med/15 text-cat-med`; "Bấm những gì bé đang có."; tám chip; "Xem tất cả 22 triệu chứng"; "Ghi chú (không bắt buộc)" (`textarea` 3 dòng, tối đa 200); "Lúc nào?". "Lưu" `disabled`, độ mờ 0,5. Bấm "Ho": chip thành "✓ Ho", dòng trên thành "Bấm những gì bé đang có. Đã chọn 1.", "Lưu" hết mờ (độ mờ 1). "Xem tất cả 22 triệu chứng": 22 chip theo năm nhóm, nút thành "Thu gọn", phần thân cuộn được (cao 1069 px trong khung 554 px) tới "Lúc nào?", nút "Lưu" vẫn trong màn hình; "Thu gọn": về tám chip, "✓ Ho" còn chọn. Không bấm "Lưu". Esc mở "Bỏ thay đổi?", bấm "Bỏ thay đổi".
6. **Đạt.** Dòng đầu "09:00 · Triệu chứng: Sổ mũi, Ho, Chảy dãi · Ho nhiều hơn về đêm, khò khè nhẹ khi nằm · Mẹ" (2 dòng, không cắt); "✓ Sổ mũi", "✓ Ho", và chip thứ chín "✓ Chảy dãi"; "Xem tất cả 23 triệu chứng"; một `textarea` chứa ghi chú mẫu; có "Thời điểm"; không có ô "Ghi chú" thứ hai; không có dòng "Bấm những gì bé đang có.". Không bấm "Lưu" hay "Xóa bản ghi"; đóng bằng Esc.
7. **Đạt.** `scrollWidth` 375 ≤ `innerWidth` 375, kể cả khi hai phiếu đang mở.
8. **Đạt.** Mục 1–4 cho cùng số đo ở `rose`, `light`, `dark`, `night` (giữ theme bằng `MutationObserver` vì sau 21:00 app tự đặt lại `night`). Chip đang chọn / chưa chọn: `rose` nền `rgb(43, 27, 34)` chữ sáng / nền kính chữ `rgb(43, 27, 34)`; `night` nền đặc `rgb(217, 137, 92)` chữ `rgb(10, 7, 5)` đậm 600 và dấu ✓ / nền `rgba(217, 137, 92, 0.06)` chữ `rgb(217, 137, 92)` đậm 500. Ở `night` hai trạng thái khác nhau rõ: nền đặc và dấu ✓. Hai phiếu (mục 5, 6) và phiếu "+" chỉ xem ở `night`.

Console của trang tạm: không có lỗi.

Trang thật (người dùng tự đăng nhập trong khung Browser; chỉ xem, theme `night`, bé 2 tháng 16 ngày, lúc đó đang có một đồng hồ ngủ thật chạy, không đụng tới):

9. **Đạt.** Hàng "Ghi nhanh" của Hôm nay vẫn năm nút: Thay tã, Bú bình, Thuốc, Nhiệt độ, Khác. Bấm "Khác": phiếu "Ghi lại cho Bun" chỉ có nhóm "Khác", năm ô, ô đầu "Triệu chứng" (ô 73,3 px, nhãn 70,1 px, hở 1,6 px mỗi bên: đúng số đo của trang tạm ở mục 4). Bấm "Triệu chứng": phiếu như mục 5, nút "Xem tất cả 22 triệu chứng" (bé dưới 90 ngày, khớp), "Lưu" `disabled`, độ mờ 0,5. Không bấm chip, không bấm "Lưu"; đóng bằng Esc.
10. **Đạt.** Bấm "+": ba nhóm Khác (Triệu chứng, Ăn dặm, Uống nước, Tắm, Ghi chú), Ghi nhanh (4 ô), Bấm giờ (5 nút). Không bấm ô nào của Bấm giờ; đóng bằng Esc.
11. **Đạt.** Nhật ký, "Ghi bù": danh sách "Loại" có 11 loại, "Triệu chứng" ngay sau "Nhiệt độ". Chọn nó: "Hay gặp" với tám chip, "Xem tất cả 22 triệu chứng", một ô "Ghi chú (không bắt buộc)", "Thời điểm"; không có ô "Ghi chú" thứ hai. Không bấm "Lưu"; Esc rồi "Bỏ thay đổi". Bộ lọc "Nhiệt độ" vẫn chạy: còn một dòng "Nhiệt độ 37.5°C (nách)" và nút "Xem thêm 7 ngày trước"; đã trả về "Tất cả". Dữ liệu thật chưa có bản ghi triệu chứng nào, nên dòng triệu chứng trong Nhật ký và phiếu sửa chỉ thấy trên trang tạm (mục 4 và 6).
12. **Đạt.** `scrollWidth` 375 ≤ `innerWidth` 375 ở `/` và `/nhat-ky`, cả khi phiếu đang mở. Console của hai trang không có lỗi.

Chưa kiểm: bấm "Lưu" thật (toast "Đã ghi Triệu chứng: …", dòng mới trong Nhật ký, sửa rồi xóa) vì dev nối vào dữ liệu thật: nằm ở Bước 38 của checklist thiết bị. Trên trang thật chỉ xem theme `night`. iPhone thật chưa xem.

**Sửa trong phiên sau bước kiểm (2026-11-26): nhãn ô 84 px của phiếu "+" từ 12 px xuống 11 px.** Người dùng xem số đo của mục 4 và 9 và chọn sửa trước khi đẩy. Bốn phương án được vẽ bằng component thật trên một trang tạm ở 375 px, theme `rose` và `night` (lưới 317 px, ô 73,3 px), hở mỗi bên của nhãn "Triệu chứng": A giữ nguyên 12 px, 1,6 px; B chữ 11 px cho mọi ô vuông, 4,1 px; C 12 px với `tracking-[-0.02em]`, 2,9 px; D riêng ô này xuống hai dòng, 18,1 px. Người dùng chọn B.

- Test trước: `components/actions/actionsheet.test.tsx`, test "keeps every label on one line" đòi `text-[11px]` ở nhãn "Uống nước" và "Triệu chứng", đúng 9 nhãn ô vuông cỡ 11 px và 5 nhãn hàng "Bấm giờ" vẫn `text-xs`. Đỏ: `Test Files  1 failed | 185 passed (186)`, `Tests  1 failed | 1694 passed (1695)`.
- Code: `components/actions/ActionSheet.tsx`, nhãn của `tile` đổi `text-xs` thành `text-[11px]`. Xanh: `Test Files  186 passed (186)`, `Tests  1695 passed (1695)`; `tsc --noEmit` sạch. Commit `72d6a81`.
- Spec §3.3 thêm một gạch đầu dòng về cỡ chữ này.
- Chạy lại Step 1 và Step 2 sau khi sửa: typecheck sạch, 186 file / 1695 test, `bun run build` mã 0 ở lần hai (40 trang tĩnh, không còn trang tạm).
- Đo lại trên trang thật (`/`, bấm "+", chỉ xem, 375×812, `night`): chín nhãn ô vuông cỡ 11 px, một dòng; "Triệu chứng" 65 px trong ô 73,3 px, hở 4,1 px mỗi bên; "Uống nước" 58,6 px, hở 7,3 px; nhãn hàng "Bấm giờ" vẫn 12 px; không tràn ngang; console không có lỗi. Chưa xem lại ở ba theme sáng trên trang thật (trang tạm phương án B đã xem ở `rose`).

- [x] **Step 5: Xóa trang fixture, thêm Bước 38 vào checklist (Patch 5), commit**

```bash
rm -r app/fixture-symptom
bun run typecheck   # nếu đỏ vì .next/dev/types còn trỏ tới trang tạm: rm -r .next/dev/types rồi chạy lại
```

```diff
diff --git a/docs/device-checklist.md b/docs/device-checklist.md
index ed4f2d3..8164598 100644
--- a/docs/device-checklist.md
+++ b/docs/device-checklist.md
@@ -643,3 +643,21 @@ Kết quả: Chờ người dùng.
 | iPhone 11     |     |         |         |
 | iPhone 16     |     |         |         |
 | iPhone 17 Pro |     |         |         |
+
+## Bước 38 — Đợt ốm (spec 2026-11-26)
+
+Phần của mốc M1 (bản ghi Triệu chứng, spec §3). Các mốc sau của spec thêm mục của mình vào cuối danh sách này. Mục 2 tạo một bản ghi Triệu chứng thử và mục 4 xóa nó.
+
+1. Mở app từ màn hình chính, bấm "+". Kỳ vọng: nhóm "Khác" có năm ô, ô đầu là "Triệu chứng", không chữ nào bị cắt. Bấm "Triệu chứng". Kỳ vọng: phiếu "Triệu chứng" có dòng "Bấm những gì bé đang có.", các chip dưới nhãn "Hay gặp", nút "Xem tất cả … triệu chứng", ô "Ghi chú (không bắt buộc)", rồi "Lúc nào?"; nút "Lưu" mờ và chưa bấm được.
+2. Bấm "Sổ mũi" và "Ho". Kỳ vọng: hai chip đổi sang nền đậm và có dấu ✓; dòng trên ghi "Đã chọn 2."; nút "Lưu" bấm được. Bấm "Xem tất cả … triệu chứng". Kỳ vọng: các chip còn lại hiện theo nhóm "Hô hấp", "Tiêu hóa", "Da", "Hành vi, ăn bú", "Khác"; nút thành "Thu gọn". Gõ ghi chú "thử", bấm "Lưu". Kỳ vọng: toast "Đã ghi Triệu chứng: Sổ mũi, Ho · thử lúc …" có nút "Hoàn tác".
+3. Tab Nhật ký. Kỳ vọng: có dòng "Triệu chứng: Sổ mũi, Ho · thử"; bộ lọc "Nhiệt độ" vẫn hiện dòng này, bộ lọc "Khác" thì không. Về tab Hôm nay, bấm nút "Khác" của hàng "Ghi nhanh". Kỳ vọng: phiếu chỉ có nhóm "Khác", trong đó có ô "Triệu chứng"; hàng "Ghi nhanh" của Hôm nay vẫn năm nút như trước.
+4. Ở Nhật ký bấm vào dòng đó. Kỳ vọng: phiếu "Bản ghi" có hai chip đang chọn và ô "Ghi chú (không bắt buộc)" chứa "thử"; không có ô "Ghi chú" thứ hai. Bỏ chọn "Ho", bấm "Lưu". Kỳ vọng: dòng thành "Triệu chứng: Sổ mũi · thử". Mở lại dòng đó, bấm "Xóa bản ghi".
+5. Bật Ban đêm, mở lại phiếu "Triệu chứng", chọn một chip. Kỳ vọng: chip đang chọn vẫn phân biệt được với chip chưa chọn nhờ nền đậm và dấu ✓.
+
+Kết quả: Chờ người dùng.
+
+| Máy           | iOS | Kết quả | Ghi chú |
+| ------------- | --- | ------- | ------- |
+| iPhone 11     |     |         |         |
+| iPhone 16     |     |         |         |
+| iPhone 17 Pro |     |         |         |
```

`docs/device-checklist.md` từ trước đã không theo prettier: không chạy `prettier --write` lên nó.

```bash
git add docs/device-checklist.md
git commit -m "docs(checklist): step 38 for the symptom log" -m "Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>"
```

Kết quả kiểm đã ghi trong file plan này. Nếu file plan đã được commit ở M1a (xem `git ls-files docs/blueprint/plans/2026-11-26-kim-bun-dot-om-m1b.md`) thì commit luôn phần ghi kết quả:

```bash
git add docs/blueprint/plans/2026-11-26-kim-bun-dot-om-m1b.md
git commit -m "docs(plan): record the M1b check results" -m "Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>"
```

File plan chưa có trong git thì không commit nó: hỏi người dùng một câu "Commit file spec và hai file plan của Đợt ốm không?" và làm theo câu trả lời.

- [x] **Step 6: Hỏi rồi đưa lên `main`**

Người dùng trả lời "Đẩy lên main" (đêm 2026-11-26), sau khi bản sửa nhãn 11 px đã có test, đã ghi vào plan và Step 1, Step 2 đã chạy lại.

Chỉ khi Step 1, 2 và 4 đều đạt và không còn lỗi đã biết (lỗi tìm thấy ở Step 4 phải được sửa, có test, và ghi vào plan trước). Hỏi người dùng "Đẩy M1b lên `main`?" và chờ câu trả lời. Được đồng ý thì:

```bash
git checkout main
git merge --ff-only feat/kim-bun-dot-om-m1b
git push origin main
git rev-parse --short main origin/main   # hai dòng phải giống nhau
```

Báo cáo: `git log --oneline` của các commit vừa lên `main`; kết quả typecheck, vitest, build; mục nào của bước trình duyệt đã thấy trên trang thật, mục nào chỉ thấy trên trang tạm, mục nào chưa; lỗi nào đã sửa trong phiên; nhắc người dùng Bước 38 của checklist đang chờ họ trên iPhone thật.
