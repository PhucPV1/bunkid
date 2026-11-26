# Kim Bun — Đợt ốm M1a: loại bản ghi Triệu chứng trong nội dung, DB và luật Implementation Plan

Steps use checkbox (`- [ ]`) syntax for tracking.

**Spec:** `docs/blueprint/specs/2026-11-26-kim-bun-dot-om-design.md` (§3.1, §3.2; phần luật của §3.3 và §3.4; phần tương ứng của §10.1 và §10.2)

**Status:** approved 2026-11-26

**Goal:** App hiểu loại bản ghi `symptom`: DB nhận nó, 23 triệu chứng có tên ngắn, luật biết kiểm, mô tả, lọc và dựng giá trị phiếu cho nó. Chưa có gì mới trên màn hình; M1b mới đưa phiếu ra.

**Architecture:**

- **Nội dung:** mỗi triệu chứng trong `content/triage.vi.json` thêm `short` và `common`; `TriageSymptomSchema` thêm hai trường.
- **DB:** một migration chỉ nới `logs_type_check`, có test pgTAP riêng.
- **Luật thuần:** file mới `lib/rules/symptomForm.ts` giữ mọi phép tính quanh "các mã đã chọn" (chuỗi của phiếu, tên ngắn, bố cục bộ chọn chip). `logDetails`, `describeLog`, `history`, `quickEntry`, `logForm`, `categories` thêm loại `symptom`.
- Không thêm gói, không thêm token màu, không thêm icon.

**Tech Stack:** Next.js 16.4.3, React 19.3.1, TypeScript 5.9.3 `strict`, Zod, Vitest, Supabase (Postgres, pgTAP), Bun. Không thêm gói nào.

**Nhánh:** `feat/kim-bun-dot-om-m1a`, cắt từ `main` @ `cf52200`. Baseline: 1659 test vitest xanh (184 file), typecheck sạch, pgTAP 001–015 (15 file, 163 test).

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

1. **M1 cắt làm hai plan** vì một plan sẽ dài hơn 2.000 dòng. Chỗ cắt: M1a xong thì mọi thứ vẫn chạy như cũ và không có gì mới hiện ra; M1b thêm giao diện.
2. **`MANUAL_TYPES` chưa đổi ở M1a.** Thêm "Triệu chứng" vào đó là đưa loại mới lên phiếu "Ghi bù" của Nhật ký trong khi bộ chọn chip chưa có. Dòng đó nằm ở M1b.
3. **`QuickEntrySheet` có `symptom: null` tạm thời** (và tiêu đề "Triệu chứng") để `Record<InstantType, …>` còn biên dịch được. Chưa có nút nào mở phiếu này; M1b thay `null` bằng bộ chọn chip.
4. **`describeLog` đọc tên ngắn từ `TRIAGE`.** Luật nhập dữ liệu nội dung đã có tiền lệ (`pushSelection.ts` nhập `VACCINES`). Hệ quả: `content/triage.vi.json` (khoảng 17 KB) nay được nạp ở mọi nơi dùng `describeLog` (Hôm nay, Nhật ký, toast), không chỉ ở trang Phân loại triệu chứng. Mã mà nội dung không còn thì bị bỏ qua; bản ghi chỉ còn mã lạ hiện là "Triệu chứng" (có ghi chú thì "Triệu chứng · {ghi chú}").
5. **Thứ tự mã.** Tên ngắn và chuỗi `codes` luôn theo thứ tự của nội dung, không theo thứ tự bấm. Mã lạ đứng sau các mã còn trong nội dung và được giữ nguyên khi lưu lại (§3.5).
6. **`pickerLayout` trả ba phần:** `common` (hàng đầu), `picked` (chip đã chọn mà không `common`, để hàng thu gọn vẽ thêm), `groups` (mọi chip không `common`, theo nhóm, để vẽ khi mở hết). Khi mở hết, chip đã chọn nằm trong nhóm của nó, không lặp ở hàng đầu.
7. **Câu của `refine`** ("Triệu chứng bị lặp") không bao giờ hiện cho người dùng: phiếu chỉ hiện `MESSAGES.symptom` = "Chọn ít nhất một triệu chứng" cho mọi lỗi của loại này.
8. **`lib/rules/symptoms.test.ts`** phải thêm `short` vào fixture của nó, vì trường này bắt buộc trong kiểu `TriageSymptom`. Thay đổi đó nằm trong patch code của Task 1.
9. **Không có bước trình duyệt.** M1a không đổi gì trên màn hình; kiểm bằng test, typecheck, build và pgTAP.
10. **Áp migration lên Supabase thật do người dùng tự chạy** (Global Constraints). Migration chỉ nới một ràng buộc nên áp trước hay sau code đều an toàn; plan cho áp ở Task 5, trước khi lên `main`, để M1b không còn bước DB nào.

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

- **Patch.** Mọi thay đổi nằm trong các khối `diff`, đánh số **Patch 1** đến **Patch 8** theo thứ tự xuất hiện trong file này. Áp bằng lệnh dưới (dán cả hàm vào cùng một lần gọi shell), hoặc sửa tay: dòng bắt đầu bằng `-` là bỏ, `+` là thêm.

```bash
kb_patch() {
  awk -v n="$1" 'BEGIN { f = sprintf("%c%c%c", 96, 96, 96) }
    $0 == f "diff" { c++; on = (c == n); next }
    $0 == f { on = 0 }
    on' docs/blueprint/plans/2026-11-26-kim-bun-dot-om-m1a.md
}
kb_patch 1 | git apply --verbose   # đổi số 1 thành số patch cần áp
```

- **Đã chạy thử.** 8 patch đã được áp lần lượt lên một bản sao ở ngoài repo, bắt đầu từ `main` @ `cf52200`; bản sao đó dùng `node_modules` của repo qua một symlink, và symlink ấy không nằm trong patch nào. Trong bản chạy thử mỗi task là hai commit (test trước, code sau; còn làm theo plan thì mỗi task một commit ở Step 5). `tsc --noEmit` sạch sau mỗi commit code; số test đỏ và xanh của từng task là số đo thật trên cả bộ test. pgTAP của Task 2 đã chạy đỏ rồi xanh trên Supabase local. Chưa chạy trong lúc viết plan: `bun run build`.
- **pgTAP cần Docker.** Trên máy này Docker là OrbStack và mặc định không chạy: `open -a OrbStack`, chờ `docker info` trả về, rồi mới `bun run db:start`. Volume của Supabase local dùng chung cho mọi bản sao của repo (project id `bun-kid`), nên bước đỏ phải chạy `bun run db:reset` trước. Xong thì `bunx supabase stop` và tắt OrbStack.
- **Người dùng muốn màn hình gọn.** Không thêm chữ nào ngoài plan.
- **Màu.** Không patch nào thêm màu, token hay icon. `lib/themeGuard.test.ts` phải xanh.
- **Chỉ xem trên trang thật.** Dev nối vào Supabase thật của gia đình: không bấm "Lưu", không bắt đầu hay dừng đồng hồ, không thêm bản ghi, không gạt công tắc.
- **`bun run build` và `bun run dev`** có thể dừng một lần với thông báo cảnh báo bảo mật của Next.js 16.4.3 rồi chạy được ở lần thứ hai. Không chạy lệnh `next upgrade` mà nó gợi ý.
- **Không chạy prettier lên `content/triage.vi.json`.** File đó từ trước đã không theo prettier (mỗi triệu chứng một dòng); định dạng lại sẽ làm patch không áp được và làm diff phình ra.
- **File spec và hai file plan chưa được commit.** `git status` sẽ thấy chúng là untracked: không commit chúng, trừ khi người dùng bảo.
- **Lên `main` phải hỏi.** Spec ghi: push lên `main` cần người dùng đồng ý từng lần. Bước cuối của plan dừng lại hỏi.
- **Dòng `Co-Authored-By`.** Các lệnh commit trong plan ghi `Claude Fable 5.2`, là model của phiên viết plan. Phiên thực thi chạy model khác thì thay bằng dòng attribution mà phiên đó quy định.
- **Không chạy lệnh nào nhắc tới file `.env`** (một hook chặn cả khi tên file đó chỉ nằm trong chuỗi của lệnh).

## Contracts with Other Plans

Plan này đứng đầu. M1b dùng mọi thứ dưới mục Produces. M2 và M4 sẽ dùng lại `symptomShorts` (chip triệu chứng theo ngày, bảng "Triệu chứng" của Báo cáo).

**Consumes (đã ở `main`):** `TRIAGE`, `TriageSymptomSchema`, `TriageSymptom` (`lib/content/triage.ts`); `visibleSymptoms` (`lib/rules/symptoms.ts`); `LOG_TYPES`, `detailsSchemas`, `LogDetails` (`lib/rules/logDetails.ts`); `QUICK_FIELDS`, `QuickField`, `QuickValues`, `InstantType`, `buildDetails`, `defaultQuickValues` (`lib/rules/quickEntry.ts`); `LOG_FIELDS`, `hasNoteField`, `valuesFromDetails`, `buildLogDetails`, `buildLogPatch` (`lib/rules/logForm.ts`); `CATEGORIES` (`lib/ui/categories.ts`); `matchesFilter` (`lib/rules/history.ts`); `describeLog` (`lib/rules/describeLog.ts`).

**Produces:**

- `content/triage.vi.json`: mỗi phần tử của `symptoms` có `short: string` (1–16 ký tự) và, với 8 triệu chứng hay gặp, `common: true`. Kiểu `TriageSymptom` có `short: string` và `common?: boolean`.
- Migration `supabase/migrations/20261126000100_symptom_log.sql`: `logs.type` nhận `'symptom'`.
- `lib/rules/logDetails.ts`: `LOG_TYPES[12] === "symptom"`; `detailsSchemas.symptom`; `LogDetails["symptom"]` = `{ codes: string[]; note?: string }`.
- `lib/rules/symptomForm.ts`:
  - `parseCodes(value: string | boolean | undefined): string[]`
  - `joinCodes(codes: readonly string[], symptoms: readonly TriageSymptom[]): string`
  - `toggleCode(value: string, code: string, symptoms: readonly TriageSymptom[]): string`
  - `symptomShorts(codes: readonly string[], symptoms: readonly TriageSymptom[]): string[]`
  - `type PickerLayout = { common: TriageSymptom[]; picked: TriageSymptom[]; groups: { code: string; name: string; chips: TriageSymptom[] }[]; total: number }`
  - `pickerLayout(input: { symptoms: TriageSymptom[]; groups: { code: string; name: string }[]; ageDays: number | null; selected: readonly string[] }): PickerLayout`
- `lib/rules/quickEntry.ts`: `InstantType` có `"symptom"`; `QuickField["kind"]` có `"symptoms"`; `QUICK_FIELDS.symptom` (khóa `codes` kiểu `"symptoms"`, khóa `note` kiểu `"textarea"`, `maxLength` 200); `defaultQuickValues("symptom")` = `{ codes: "", note: "" }`; `buildDetails("symptom", values)`.
- `lib/rules/logForm.ts`: `LOG_FIELDS.symptom === QUICK_FIELDS.symptom`; `hasNoteField("symptom") === false`; `valuesFromDetails` nối mảng bằng `","`. `MANUAL_TYPES` **chưa** có `symptom` (M1b thêm).
- `lib/ui/categories.ts`: `CATEGORIES.symptom` = `{ token: "cat-med", icon: "pulse", label: "Triệu chứng" }`.
- `lib/rules/history.ts`: bộ lọc `temperature` gồm `temperature` và `symptom`.
- `describeLog`: `"Triệu chứng: {tên ngắn nối bằng ", "}"`, thêm `" · {note}"` khi có ghi chú.
- `components/home/QuickEntrySheet.tsx`: `TITLES.symptom` = "Triệu chứng"; phần ô nhập của `symptom` còn là `null`.
- **Vitest sau M1a:** 1681 test, 185 file. **pgTAP sau M1a:** 16 file, 166 test.

---

### Task 1: Tên ngắn và dấu "hay gặp" của 23 triệu chứng (§3.2)

**Files:**

- Modify: `content/triage.vi.json`, `lib/content/triage.ts`, `lib/rules/symptoms.test.ts` (fixture thêm `short`)
- Test: `lib/content/triage.test.ts`

**Interfaces:**

- Consumes: `TRIAGE`, `TriageSymptomSchema`.
- Produces: `TriageSymptom["short"]`, `TriageSymptom["common"]`; 23 giá trị `short` và 8 dấu `common` trong nội dung.

- [x] **Step 0: Tạo nhánh**

```bash
git checkout main && git pull --ff-only && git checkout -b feat/kim-bun-dot-om-m1a
```

- [x] **Step 1: Viết test đỏ (Patch 1)**

```diff
diff --git a/lib/content/triage.test.ts b/lib/content/triage.test.ts
index 016e5c6..b690ff7 100644
--- a/lib/content/triage.test.ts
+++ b/lib/content/triage.test.ts
@@ -59,6 +59,52 @@ describe("content/triage.vi.json (spec §6.6, §10.2)", () => {
     ]);
   });

+  it("spec 2026-11-26 §3.2: every symptom has its own short name; eight are common", () => {
+    expect(
+      Object.fromEntries(TRIAGE.symptoms.map((s) => [s.code, s.short])),
+    ).toEqual({
+      fever: "Sốt",
+      runny_nose: "Sổ mũi",
+      cough: "Ho",
+      barking_cough: "Ho ông ổng",
+      wheeze: "Khò khè",
+      spit_up: "Trớ sữa",
+      vomit: "Nôn",
+      diarrhoea: "Tiêu chảy",
+      hard_stool: "Phân cứng",
+      gassy: "Đầy hơi",
+      diaper_rash: "Đỏ vùng tã",
+      dry_red_skin: "Da khô đỏ",
+      heat_rash: "Nốt đỏ li ti",
+      rash_after_fever: "Ban sau sốt",
+      hand_foot_spots: "Nốt ở tay chân",
+      yellow_skin: "Vàng da",
+      white_mouth: "Mảng trắng miệng",
+      mouth_sores: "Loét miệng",
+      ear_rub: "Dụi tai",
+      sticky_eye: "Mắt đỏ, ghèn",
+      drooling: "Chảy dãi",
+      long_crying: "Khóc nhiều",
+      fussy: "Quấy",
+    });
+    const shorts = TRIAGE.symptoms.map((s) => s.short);
+    expect(new Set(shorts).size).toBe(23);
+    for (const short of shorts)
+      expect(Array.from(short).length, short).toBeLessThanOrEqual(16);
+    expect(
+      TRIAGE.symptoms.filter((s) => s.common === true).map((s) => s.code),
+    ).toEqual([
+      "fever",
+      "runny_nose",
+      "cough",
+      "wheeze",
+      "spit_up",
+      "vomit",
+      "diarrhoea",
+      "fussy",
+    ]);
+  });
+
   it("never names a disease as a finding", () => {
     const text = JSON.stringify(TRIAGE).toLowerCase();
     for (const word of [
```

- [x] **Step 2: Chạy để thấy đỏ**

Run: `bunx vitest run`
Expected: `Test Files  1 failed | 183 passed (184)`, `Tests  1 failed | 1659 passed (1660)`. Test mới đỏ vì `short` là `undefined` ở mọi triệu chứng.

- [x] **Step 3: Thêm hai trường vào nội dung và schema (Patch 2)**

Patch đổi đúng 23 dòng của `content/triage.vi.json` (mỗi triệu chứng một dòng, chỉ chèn `"short"` và, ở 8 dòng, `"common": true` ngay trước `"text"`), thêm hai trường vào `TriageSymptomSchema`, và thêm `short` vào fixture của `lib/rules/symptoms.test.ts`.

```diff
diff --git a/content/triage.vi.json b/content/triage.vi.json
index 8cda3c6..623d7a4 100644
--- a/content/triage.vi.json
+++ b/content/triage.vi.json
@@ -19,29 +19,29 @@
   ],
   "homeCareSource": "https://www.nhs.uk/conditions/fever-in-children/",
   "symptoms": [
-    {"code": "fever", "group": "fever", "text": "Sốt hoặc sờ thấy nóng", "suggests": ["sot", "cam_lanh", "viem_tai_giua", "sot_phat_ban", "tay_chan_mieng", "croup"]},
-    {"code": "runny_nose", "group": "breathing", "text": "Sổ mũi, nghẹt mũi, hắt hơi", "suggests": ["so_mui", "cam_lanh"]},
-    {"code": "cough", "group": "breathing", "text": "Ho", "suggests": ["cam_lanh", "viem_tieu_phe_quan", "croup"]},
-    {"code": "barking_cough", "group": "breathing", "text": "Ho ông ổng như tiếng chó sủa, khàn tiếng", "suggests": ["croup"]},
-    {"code": "wheeze", "group": "breathing", "text": "Thở khò khè", "suggests": ["viem_tieu_phe_quan"]},
-    {"code": "spit_up", "group": "digestion", "text": "Trớ sữa sau khi bú", "suggests": ["non_tro"]},
-    {"code": "vomit", "group": "digestion", "text": "Nôn", "suggests": ["tieu_chay", "non_tro"]},
-    {"code": "diarrhoea", "group": "digestion", "text": "Phân lỏng, đi nhiều lần hơn mọi ngày", "suggests": ["tieu_chay"]},
-    {"code": "hard_stool", "group": "digestion", "text": "Phân cứng, rặn khó, lâu không đi", "suggests": ["tao_bon"]},
-    {"code": "gassy", "group": "digestion", "text": "Đầy hơi, xì hơi nhiều, co chân khi khóc", "suggests": ["khoc_da_de", "tao_bon"]},
-    {"code": "diaper_rash", "group": "skin", "text": "Da vùng mặc tã đỏ, rát", "suggests": ["ham_ta"]},
-    {"code": "dry_red_skin", "group": "skin", "text": "Mảng da khô, đỏ, ngứa ở má hoặc nếp gấp", "suggests": ["cham_sua"]},
-    {"code": "heat_rash", "group": "skin", "text": "Nốt đỏ li ti ở cổ, lưng, nách khi trời nóng", "suggests": ["rom_say"]},
-    {"code": "rash_after_fever", "group": "skin", "text": "Nổi ban hồng ngay sau khi vừa hết sốt", "suggests": ["sot_phat_ban"]},
-    {"code": "hand_foot_spots", "group": "skin", "text": "Nốt phỏng hoặc ban đỏ ở lòng bàn tay, bàn chân, mông", "suggests": ["tay_chan_mieng"]},
-    {"code": "yellow_skin", "group": "skin", "text": "Da hoặc lòng trắng mắt hơi vàng", "suggests": ["vang_da_sinh_ly"]},
-    {"code": "white_mouth", "group": "other", "text": "Mảng trắng trong miệng, trên lưỡi, lau không sạch", "suggests": ["nam_mieng"]},
-    {"code": "mouth_sores", "group": "other", "text": "Loét trong miệng, bỏ bú vì đau miệng", "suggests": ["tay_chan_mieng", "nam_mieng"]},
-    {"code": "ear_rub", "group": "other", "text": "Dụi, kéo tai, quấy hơn khi nằm", "suggests": ["viem_tai_giua", "moc_rang"]},
-    {"code": "sticky_eye", "group": "other", "text": "Mắt đỏ, nhiều ghèn hoặc chảy nước mắt", "suggests": ["dau_mat"]},
-    {"code": "drooling", "group": "behaviour", "text": "Chảy nhiều dãi, gặm cắn đồ, lợi sưng đỏ", "suggests": ["moc_rang"], "minAgeDays": 90},
-    {"code": "long_crying", "group": "behaviour", "text": "Khóc nhiều, khó dỗ vào chiều tối nhưng vẫn bú và lớn tốt", "suggests": ["khoc_da_de"], "maxAgeDays": 180},
-    {"code": "fussy", "group": "behaviour", "text": "Quấy, ngủ không yên", "suggests": ["cam_lanh", "so_mui", "viem_tai_giua", "moc_rang", "khoc_da_de"]}
+    {"code": "fever", "group": "fever", "short": "Sốt", "common": true, "text": "Sốt hoặc sờ thấy nóng", "suggests": ["sot", "cam_lanh", "viem_tai_giua", "sot_phat_ban", "tay_chan_mieng", "croup"]},
+    {"code": "runny_nose", "group": "breathing", "short": "Sổ mũi", "common": true, "text": "Sổ mũi, nghẹt mũi, hắt hơi", "suggests": ["so_mui", "cam_lanh"]},
+    {"code": "cough", "group": "breathing", "short": "Ho", "common": true, "text": "Ho", "suggests": ["cam_lanh", "viem_tieu_phe_quan", "croup"]},
+    {"code": "barking_cough", "group": "breathing", "short": "Ho ông ổng", "text": "Ho ông ổng như tiếng chó sủa, khàn tiếng", "suggests": ["croup"]},
+    {"code": "wheeze", "group": "breathing", "short": "Khò khè", "common": true, "text": "Thở khò khè", "suggests": ["viem_tieu_phe_quan"]},
+    {"code": "spit_up", "group": "digestion", "short": "Trớ sữa", "common": true, "text": "Trớ sữa sau khi bú", "suggests": ["non_tro"]},
+    {"code": "vomit", "group": "digestion", "short": "Nôn", "common": true, "text": "Nôn", "suggests": ["tieu_chay", "non_tro"]},
+    {"code": "diarrhoea", "group": "digestion", "short": "Tiêu chảy", "common": true, "text": "Phân lỏng, đi nhiều lần hơn mọi ngày", "suggests": ["tieu_chay"]},
+    {"code": "hard_stool", "group": "digestion", "short": "Phân cứng", "text": "Phân cứng, rặn khó, lâu không đi", "suggests": ["tao_bon"]},
+    {"code": "gassy", "group": "digestion", "short": "Đầy hơi", "text": "Đầy hơi, xì hơi nhiều, co chân khi khóc", "suggests": ["khoc_da_de", "tao_bon"]},
+    {"code": "diaper_rash", "group": "skin", "short": "Đỏ vùng tã", "text": "Da vùng mặc tã đỏ, rát", "suggests": ["ham_ta"]},
+    {"code": "dry_red_skin", "group": "skin", "short": "Da khô đỏ", "text": "Mảng da khô, đỏ, ngứa ở má hoặc nếp gấp", "suggests": ["cham_sua"]},
+    {"code": "heat_rash", "group": "skin", "short": "Nốt đỏ li ti", "text": "Nốt đỏ li ti ở cổ, lưng, nách khi trời nóng", "suggests": ["rom_say"]},
+    {"code": "rash_after_fever", "group": "skin", "short": "Ban sau sốt", "text": "Nổi ban hồng ngay sau khi vừa hết sốt", "suggests": ["sot_phat_ban"]},
+    {"code": "hand_foot_spots", "group": "skin", "short": "Nốt ở tay chân", "text": "Nốt phỏng hoặc ban đỏ ở lòng bàn tay, bàn chân, mông", "suggests": ["tay_chan_mieng"]},
+    {"code": "yellow_skin", "group": "skin", "short": "Vàng da", "text": "Da hoặc lòng trắng mắt hơi vàng", "suggests": ["vang_da_sinh_ly"]},
+    {"code": "white_mouth", "group": "other", "short": "Mảng trắng miệng", "text": "Mảng trắng trong miệng, trên lưỡi, lau không sạch", "suggests": ["nam_mieng"]},
+    {"code": "mouth_sores", "group": "other", "short": "Loét miệng", "text": "Loét trong miệng, bỏ bú vì đau miệng", "suggests": ["tay_chan_mieng", "nam_mieng"]},
+    {"code": "ear_rub", "group": "other", "short": "Dụi tai", "text": "Dụi, kéo tai, quấy hơn khi nằm", "suggests": ["viem_tai_giua", "moc_rang"]},
+    {"code": "sticky_eye", "group": "other", "short": "Mắt đỏ, ghèn", "text": "Mắt đỏ, nhiều ghèn hoặc chảy nước mắt", "suggests": ["dau_mat"]},
+    {"code": "drooling", "group": "behaviour", "short": "Chảy dãi", "text": "Chảy nhiều dãi, gặm cắn đồ, lợi sưng đỏ", "suggests": ["moc_rang"], "minAgeDays": 90},
+    {"code": "long_crying", "group": "behaviour", "short": "Khóc nhiều", "text": "Khóc nhiều, khó dỗ vào chiều tối nhưng vẫn bú và lớn tốt", "suggests": ["khoc_da_de"], "maxAgeDays": 180},
+    {"code": "fussy", "group": "behaviour", "short": "Quấy", "common": true, "text": "Quấy, ngủ không yên", "suggests": ["cam_lanh", "so_mui", "viem_tai_giua", "moc_rang", "khoc_da_de"]}
   ],
   "symptomsSource": "https://www.nhs.uk/conditions/",
   "firstAid": [
diff --git a/lib/content/triage.ts b/lib/content/triage.ts
index 40ec7f6..778b5bd 100644
--- a/lib/content/triage.ts
+++ b/lib/content/triage.ts
@@ -22,10 +22,14 @@ export const TriageQuestionSchema = z
 const code = z.string().regex(/^[a-z0-9_]+$/);

 // Spec 2026-11-17 §4.1: a common symptom and the articles it suggests.
+// Spec 2026-11-26 §3.2: `short` is the chip of a symptom log; `common` puts the
+// chip in the first row of the symptom sheet.
 export const TriageSymptomSchema = z
   .object({
     code,
     group: z.string().min(1),
+    short: z.string().min(1).max(16),
+    common: z.boolean().optional(),
     text: z.string().min(1),
     suggests: z.array(code).min(1),
     minAgeDays: z.number().int().min(0).optional(),
diff --git a/lib/rules/symptoms.test.ts b/lib/rules/symptoms.test.ts
index 9ba8da6..b0b793f 100644
--- a/lib/rules/symptoms.test.ts
+++ b/lib/rules/symptoms.test.ts
@@ -22,6 +22,7 @@ const s = (
 ): TriageSymptom => ({
   code,
   group: "other",
+  short: code,
   text: `${code} text`,
   suggests,
   ...extra,
```

- [x] **Step 4: Chạy để thấy xanh**

Run: `bunx vitest run && bun run typecheck`
Expected: `Test Files  184 passed (184)`, `Tests  1660 passed (1660)`; `tsc --noEmit` không báo lỗi.

- [x] **Step 5: Commit**

```bash
git add content/triage.vi.json lib/content/triage.ts lib/content/triage.test.ts lib/rules/symptoms.test.ts
git commit -m "feat(triage): short names and the common mark for the symptoms" -m "Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>"
```

### Task 2: DB nhận loại `symptom` (§3.1, §10.2)

**Files:**

- Create: `supabase/migrations/20261126000100_symptom_log.sql`
- Test: `supabase/tests/016_symptom_log.test.sql`

**Interfaces:**

- Consumes: ràng buộc `logs_type_check` (migration `20261117000100_log_types.sql`).
- Produces: `logs.type` nhận `'symptom'`.

- [x] **Step 1: Viết test pgTAP đỏ (Patch 3)**

```diff
diff --git a/supabase/tests/016_symptom_log.test.sql b/supabase/tests/016_symptom_log.test.sql
new file mode 100644
index 0000000..8a0986e
--- /dev/null
+++ b/supabase/tests/016_symptom_log.test.sql
@@ -0,0 +1,30 @@
+begin;
+create extension if not exists pgtap with schema extensions;
+select plan(3);
+
+insert into auth.users (id, email) values ('aaaaaaaa-0000-0000-0000-000000000016', 'so@example.com');
+insert into public.families (id, name) values ('f0000000-0000-0000-0000-000000000026', 'Nhà S');
+insert into public.family_members (family_id, email, user_id, role, display_name)
+  values ('f0000000-0000-0000-0000-000000000026', 'so@example.com', 'aaaaaaaa-0000-0000-0000-000000000016', 'owner', 'Mẹ');
+insert into public.babies (id, family_id, name, dob, sex)
+  values ('ba000000-0000-0000-0000-000000000026', 'f0000000-0000-0000-0000-000000000026', 'Bé', '2026-05-01', 'female');
+
+-- Spec 2026-11-26 §3.1: symptom is an instant type (ended_at = started_at).
+select lives_ok(
+  $$ insert into public.logs (id, baby_id, type, started_at, ended_at, details, created_by)
+     values ('1f000000-0000-0000-0000-000000000001', 'ba000000-0000-0000-0000-000000000026', 'symptom', now(), now(),
+             '{"codes": ["runny_nose", "cough"], "note": "Ho nhiều hơn về đêm"}', 'aaaaaaaa-0000-0000-0000-000000000016') $$,
+  'symptom is accepted');
+select throws_ok(
+  $$ insert into public.logs (id, baby_id, type, started_at, ended_at, created_by)
+     values ('1f000000-0000-0000-0000-000000000002', 'ba000000-0000-0000-0000-000000000026', 'symptoms', now(), now(),
+             'aaaaaaaa-0000-0000-0000-000000000016') $$,
+  '23514', null, 'an unknown type is still refused');
+select lives_ok(
+  $$ insert into public.logs (id, baby_id, type, started_at, ended_at, details, created_by)
+     values ('1f000000-0000-0000-0000-000000000003', 'ba000000-0000-0000-0000-000000000026', 'note', now(), now(),
+             '{"text": "Bé cười nhiều"}', 'aaaaaaaa-0000-0000-0000-000000000016') $$,
+  'an old type still passes');
+
+select * from finish();
+rollback;
```

- [x] **Step 2: Chạy để thấy đỏ**

```bash
open -a OrbStack
until docker info >/dev/null 2>&1; do sleep 2; done
bun run db:start
bun run db:reset
bun run db:test
```

Expected: file `016_symptom_log.test.sql` báo `Failed 1/3 subtests` (test 1, "symptom is accepted"); dòng cuối `Files=16, Tests=166` và `Result: FAIL`. Mười lăm file kia xanh.

- [x] **Step 3: Viết migration (Patch 4)**

```diff
diff --git a/supabase/migrations/20261126000100_symptom_log.sql b/supabase/migrations/20261126000100_symptom_log.sql
new file mode 100644
index 0000000..aef65ba
--- /dev/null
+++ b/supabase/migrations/20261126000100_symptom_log.sql
@@ -0,0 +1,5 @@
+-- Spec 2026-11-26 §3.1: one more instant log type. Only widens the check on logs.type.
+alter table public.logs drop constraint logs_type_check;
+alter table public.logs add constraint logs_type_check
+  check (type in ('breast', 'bottle', 'sleep', 'diaper', 'medicine', 'temperature', 'pump', 'tummy',
+                  'solids', 'water', 'bath', 'note', 'symptom'));
```

- [x] **Step 4: Chạy để thấy xanh**

```bash
bun run db:reset
bun run db:test
```

Expected: `All tests successful.`, `Files=16, Tests=166`, `Result: PASS`.

Kiểu của Supabase không đổi (ràng buộc `check` không vào `lib/supabase/types.ts`), nên không chạy `bun run db:types`. Để Supabase local chạy tiếp cho Task 5, hoặc tắt bằng `bunx supabase stop` và bật lại khi tới đó.

- [x] **Step 5: Commit**

```bash
git add supabase/migrations/20261126000100_symptom_log.sql supabase/tests/016_symptom_log.test.sql
git commit -m "feat(db): logs accept the symptom type" -m "Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>"
```

### Task 3: Luật quanh các mã đã chọn: `lib/rules/symptomForm.ts` (§3.3, §3.4, phần luật của §3.5)

**Files:**

- Create: `lib/rules/symptomForm.ts`
- Test: `lib/rules/symptomForm.test.ts`

**Interfaces:**

- Consumes: `TriageSymptom`, `TRIAGE` (Task 1, có `short` và `common`); `visibleSymptoms(symptoms, ageDays)` (`lib/rules/symptoms.ts`).
- Produces: `parseCodes`, `joinCodes`, `toggleCode`, `symptomShorts`, `PickerLayout`, `pickerLayout` (chữ ký ở mục Contracts).

- [x] **Step 1: Viết test đỏ (Patch 5)**

```diff
diff --git a/lib/rules/symptomForm.test.ts b/lib/rules/symptomForm.test.ts
new file mode 100644
index 0000000..fa24995
--- /dev/null
+++ b/lib/rules/symptomForm.test.ts
@@ -0,0 +1,160 @@
+import { describe, expect, it } from "vitest";
+import { TRIAGE, type TriageSymptom } from "@/lib/content/triage";
+import {
+  joinCodes,
+  parseCodes,
+  pickerLayout,
+  symptomShorts,
+  toggleCode,
+} from "./symptomForm";
+
+const s = (
+  code: string,
+  group: string,
+  extra: Partial<TriageSymptom> = {},
+): TriageSymptom => ({
+  code,
+  group,
+  short: code.toUpperCase(),
+  text: `${code} text`,
+  suggests: ["x"],
+  ...extra,
+});
+
+const symptoms = [
+  s("fever", "fever", { common: true }),
+  s("cough", "breathing", { common: true }),
+  s("wheeze", "breathing"),
+  s("vomit", "digestion"),
+  s("teeth", "other", { minAgeDays: 90 }),
+  s("colic", "other", { maxAgeDays: 180 }),
+];
+const groups = [
+  { code: "fever", name: "Sốt" },
+  { code: "breathing", name: "Hô hấp" },
+  { code: "digestion", name: "Tiêu hóa" },
+  { code: "other", name: "Khác" },
+];
+const codesOf = (chips: TriageSymptom[]) => chips.map((chip) => chip.code);
+
+describe("codes as one form value (spec 2026-11-26 §3.4)", () => {
+  it("parseCodes splits on commas and drops empty parts", () => {
+    expect(parseCodes("cough,vomit")).toEqual(["cough", "vomit"]);
+    expect(parseCodes("cough")).toEqual(["cough"]);
+    expect(parseCodes("")).toEqual([]);
+    expect(parseCodes(",cough,,")).toEqual(["cough"]);
+    expect(parseCodes(undefined)).toEqual([]);
+    expect(parseCodes(true)).toEqual([]);
+  });
+
+  it("joinCodes: known codes in the content's order, unknown ones after, each once", () => {
+    expect(joinCodes(["vomit", "fever"], symptoms)).toBe("fever,vomit");
+    expect(joinCodes(["gone", "cough", "old"], symptoms)).toBe(
+      "cough,gone,old",
+    );
+    expect(joinCodes(["cough", "cough", "gone", "gone"], symptoms)).toBe(
+      "cough,gone",
+    );
+    expect(joinCodes([], symptoms)).toBe("");
+  });
+
+  it("toggleCode adds a code that is off and removes one that is on", () => {
+    expect(toggleCode("", "vomit", symptoms)).toBe("vomit");
+    expect(toggleCode("vomit", "fever", symptoms)).toBe("fever,vomit");
+    expect(toggleCode("fever,vomit", "fever", symptoms)).toBe("vomit");
+    expect(toggleCode("vomit", "vomit", symptoms)).toBe("");
+  });
+
+  it("toggleCode keeps a saved code the content no longer has", () => {
+    expect(toggleCode("gone,vomit", "cough", symptoms)).toBe(
+      "cough,vomit,gone",
+    );
+    expect(toggleCode("cough,gone", "cough", symptoms)).toBe("gone");
+  });
+
+  it("symptomShorts: short names in the content's order, unknown codes skipped", () => {
+    expect(symptomShorts(["vomit", "gone", "fever"], symptoms)).toEqual([
+      "FEVER",
+      "VOMIT",
+    ]);
+    expect(symptomShorts(["gone"], symptoms)).toEqual([]);
+  });
+});
+
+describe("pickerLayout (spec 2026-11-26 §3.5)", () => {
+  const layout = (ageDays: number | null, selected: string[] = []) =>
+    pickerLayout({ symptoms, groups, ageDays, selected });
+
+  it("common chips first, the rest by group in the content's group order", () => {
+    const view = layout(100);
+    expect(codesOf(view.common)).toEqual(["fever", "cough"]);
+    expect(view.picked).toEqual([]);
+    expect(view.groups.map((g) => [g.name, codesOf(g.chips)])).toEqual([
+      ["Hô hấp", ["wheeze"]],
+      ["Tiêu hóa", ["vomit"]],
+      ["Khác", ["teeth", "colic"]],
+    ]);
+    expect(view.total).toBe(6);
+  });
+
+  it("filters by the baby's age; no age given means no filter", () => {
+    expect(codesOf(layout(76).groups[2].chips)).toEqual(["colic"]);
+    expect(layout(76).total).toBe(5);
+    expect(codesOf(layout(200).groups[2].chips)).toEqual(["teeth"]);
+    expect(layout(null).total).toBe(6);
+  });
+
+  it("a picked chip that is not common is listed for the collapsed row", () => {
+    const view = layout(100, ["vomit", "fever"]);
+    expect(codesOf(view.picked)).toEqual(["vomit"]);
+    expect(codesOf(view.common)).toEqual(["fever", "cough"]);
+    expect(codesOf(view.groups[1].chips)).toEqual(["vomit"]);
+  });
+
+  it("a picked chip outside the baby's age still shows; an unknown code never does", () => {
+    const view = layout(76, ["teeth", "gone"]);
+    expect(codesOf(view.picked)).toEqual(["teeth"]);
+    expect(codesOf(view.groups[2].chips)).toEqual(["teeth", "colic"]);
+    expect(view.total).toBe(6);
+  });
+
+  it("a group with no chip left is not drawn", () => {
+    const view = pickerLayout({
+      symptoms: symptoms.slice(0, 3),
+      groups,
+      ageDays: null,
+      selected: [],
+    });
+    expect(view.groups.map((g) => g.name)).toEqual(["Hô hấp"]);
+  });
+
+  it("the real content at 76 days: 8 common chips, 22 in all, every chip in a known group", () => {
+    const view = pickerLayout({
+      symptoms: TRIAGE.symptoms,
+      groups: TRIAGE.groups,
+      ageDays: 76,
+      selected: [],
+    });
+    expect(view.common.map((chip) => chip.short)).toEqual([
+      "Sốt",
+      "Sổ mũi",
+      "Ho",
+      "Khò khè",
+      "Trớ sữa",
+      "Nôn",
+      "Tiêu chảy",
+      "Quấy",
+    ]);
+    expect(view.total).toBe(22);
+    expect(view.groups.map((g) => g.name)).toEqual([
+      "Hô hấp",
+      "Tiêu hóa",
+      "Da",
+      "Hành vi, ăn bú",
+      "Khác",
+    ]);
+    expect(
+      view.common.length + view.groups.flatMap((g) => g.chips).length,
+    ).toBe(22);
+  });
+});
```

- [x] **Step 2: Chạy để thấy đỏ**

Run: `bunx vitest run`
Expected: `Test Files  1 failed | 184 passed (185)`, `Tests  1660 passed (1660)`. File test mới không nạp được vì `./symptomForm` chưa có (nên 11 test của nó chưa được đếm).

- [x] **Step 3: Viết luật (Patch 6)**

```diff
diff --git a/lib/rules/symptomForm.ts b/lib/rules/symptomForm.ts
new file mode 100644
index 0000000..fa358ec
--- /dev/null
+++ b/lib/rules/symptomForm.ts
@@ -0,0 +1,90 @@
+import type { TriageSymptom } from "@/lib/content/triage";
+import { visibleSymptoms } from "./symptoms";
+
+type Group = { code: string; name: string };
+
+// Spec 2026-11-26 §3.4: a form value is a string or a boolean, so the picked
+// codes travel as one comma-joined string. "" means nothing picked.
+export function parseCodes(value: string | boolean | undefined): string[] {
+  return typeof value === "string" ? value.split(",").filter(Boolean) : [];
+}
+
+// Known codes in the content's order, then codes the content no longer has
+// (they stay in the log when it is saved again), each code once.
+export function joinCodes(
+  codes: readonly string[],
+  symptoms: readonly TriageSymptom[],
+): string {
+  const picked = new Set(codes);
+  const known = symptoms
+    .filter((symptom) => picked.has(symptom.code))
+    .map((symptom) => symptom.code);
+  const unknown = [...picked].filter((code) => !known.includes(code));
+  return [...known, ...unknown].join(",");
+}
+
+export function toggleCode(
+  value: string,
+  code: string,
+  symptoms: readonly TriageSymptom[],
+): string {
+  const codes = parseCodes(value);
+  return joinCodes(
+    codes.includes(code)
+      ? codes.filter((other) => other !== code)
+      : [...codes, code],
+    symptoms,
+  );
+}
+
+// Spec 2026-11-26 §3.3: the short names of a log's codes, in the content's order.
+export function symptomShorts(
+  codes: readonly string[],
+  symptoms: readonly TriageSymptom[],
+): string[] {
+  return symptoms
+    .filter((symptom) => codes.includes(symptom.code))
+    .map((symptom) => symptom.short);
+}
+
+export type PickerLayout = {
+  // The first row, always drawn.
+  common: TriageSymptom[];
+  // Picked chips that are not common: drawn after `common` while collapsed.
+  picked: TriageSymptom[];
+  // Every chip that is not common, by group: drawn when expanded.
+  groups: { code: string; name: string; chips: TriageSymptom[] }[];
+  // How many chips there are in all, for "Xem tất cả {n} triệu chứng".
+  total: number;
+};
+
+// Spec 2026-11-26 §3.5. `ageDays` null means no age filter. A picked chip
+// outside the baby's age still shows, so it can be seen and switched off.
+export function pickerLayout(input: {
+  symptoms: TriageSymptom[];
+  groups: Group[];
+  ageDays: number | null;
+  selected: readonly string[];
+}): PickerLayout {
+  const { symptoms, groups, ageDays, selected } = input;
+  const inAge = new Set(
+    (ageDays === null ? symptoms : visibleSymptoms(symptoms, ageDays)).map(
+      (symptom) => symptom.code,
+    ),
+  );
+  const shown = symptoms.filter(
+    (symptom) => inAge.has(symptom.code) || selected.includes(symptom.code),
+  );
+  const rest = shown.filter((symptom) => symptom.common !== true);
+  return {
+    common: shown.filter((symptom) => symptom.common === true),
+    picked: rest.filter((symptom) => selected.includes(symptom.code)),
+    groups: groups
+      .map((group) => ({
+        ...group,
+        chips: rest.filter((symptom) => symptom.group === group.code),
+      }))
+      .filter((group) => group.chips.length > 0),
+    total: shown.length,
+  };
+}
```

- [x] **Step 4: Chạy để thấy xanh**

Run: `bunx vitest run && bun run typecheck`
Expected: `Test Files  185 passed (185)`, `Tests  1671 passed (1671)`; `tsc --noEmit` không báo lỗi.

- [x] **Step 5: Commit**

```bash
git add lib/rules/symptomForm.ts lib/rules/symptomForm.test.ts
git commit -m "feat(symptom): rules for the picked codes and the picker layout" -m "Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>"
```

### Task 4: Loại `symptom` trong các luật của bản ghi (§3.1, §3.3, §3.4)

**Files:**

- Modify: `lib/rules/logDetails.ts`, `lib/rules/describeLog.ts`, `lib/rules/history.ts`, `lib/rules/quickEntry.ts`, `lib/rules/logForm.ts`, `lib/ui/categories.ts`, `components/home/QuickEntrySheet.tsx` (chỉ tiêu đề và `symptom: null`, xem Diễn giải spec mục 3)
- Test: `lib/rules/logDetails.test.ts`, `lib/rules/describeLog.test.ts`, `lib/rules/history.test.ts`, `lib/rules/quickEntry.test.ts`, `lib/rules/logForm.test.ts`, `lib/ui/categories.test.ts`

**Interfaces:**

- Consumes: `parseCodes`, `symptomShorts` (Task 3); `TRIAGE` (Task 1).
- Produces: `LOG_TYPES` có `"symptom"`; `detailsSchemas.symptom`; `CATEGORIES.symptom`; `describeLog` cho `symptom`; bộ lọc `temperature` gồm `symptom`; `InstantType` có `"symptom"`; `QuickField["kind"]` có `"symptoms"`; `QUICK_FIELDS.symptom`; `defaultQuickValues("symptom")`; `buildDetails("symptom", …)`; `hasNoteField("symptom") === false`; `valuesFromDetails` nối mảng bằng `","`.

- [x] **Step 1: Viết test đỏ (Patch 7)**

Trong `logDetails.test.ts`, test cũ "LOG_TYPES ends with the four new types" thôi khẳng định độ dài 12 và so `LOG_TYPES.slice(8, 12)`; độ dài 13 do test mới giữ.

```diff
diff --git a/lib/rules/describeLog.test.ts b/lib/rules/describeLog.test.ts
index 3358c5f..c3bc114 100644
--- a/lib/rules/describeLog.test.ts
+++ b/lib/rules/describeLog.test.ts
@@ -128,6 +128,22 @@ describe("describeLog", () => {
     expect(instant("water", { ml: 0 })).toBe("Bản ghi không hợp lệ");
     expect(instant("vaccine", {})).toBe("Bản ghi không hợp lệ");
   });
+  it("describes a symptom log by its short names, in the content's order", () => {
+    expect(instant("symptom", { codes: ["cough", "runny_nose"] })).toBe(
+      "Triệu chứng: Sổ mũi, Ho",
+    );
+    expect(
+      instant("symptom", { codes: ["fussy"], note: "Quấy từ chiều" }),
+    ).toBe("Triệu chứng: Quấy · Quấy từ chiều");
+    expect(instant("symptom", { codes: ["gone_code", "cough"] })).toBe(
+      "Triệu chứng: Ho",
+    );
+    expect(instant("symptom", { codes: ["gone_code"] })).toBe("Triệu chứng");
+    expect(instant("symptom", { codes: ["gone_code"], note: "ghi" })).toBe(
+      "Triệu chứng · ghi",
+    );
+    expect(instant("symptom", { codes: [] })).toBe("Bản ghi không hợp lệ");
+  });
   it("falls back for invalid details", () => {
     expect(
       describeLog(
diff --git a/lib/rules/history.test.ts b/lib/rules/history.test.ts
index fbf3eea..f0a9c20 100644
--- a/lib/rules/history.test.ts
+++ b/lib/rules/history.test.ts
@@ -39,6 +39,18 @@ describe("history", () => {
     expect(matchesFilter({ type: "note" }, "all")).toBe(true);
   });

+  it("spec 2026-11-26 §3.3: Nhiệt độ also shows symptom logs", () => {
+    expect(
+      LOG_TYPES.filter((type) => matchesFilter({ type }, "temperature")),
+    ).toEqual(["temperature", "symptom"]);
+    expect(matchesFilter({ type: "symptom" }, "other")).toBe(false);
+    expect(matchesFilter({ type: "symptom" }, "all")).toBe(true);
+    expect(HISTORY_FILTERS[5]).toEqual({
+      value: "temperature",
+      label: "Nhiệt độ",
+    });
+  });
+
   it("groupByVnDay splits at VN midnight, newest day and log first", () => {
     const groups = groupByVnDay([
       { id: "a", started_at: "2026-11-13T16:59:00Z" }, // 23:59 on 13/11
diff --git a/lib/rules/logDetails.test.ts b/lib/rules/logDetails.test.ts
index 531425e..189b7dc 100644
--- a/lib/rules/logDetails.test.ts
+++ b/lib/rules/logDetails.test.ts
@@ -84,8 +84,7 @@ describe("solids, water, bath and note (spec 2026-11-17 §3.1)", () => {
     detailsSchemas[type].safeParse(details).success;

   it("LOG_TYPES ends with the four new types, none of them a timer", () => {
-    expect(LOG_TYPES).toHaveLength(12);
-    expect(LOG_TYPES.slice(8)).toEqual(["solids", "water", "bath", "note"]);
+    expect(LOG_TYPES.slice(8, 12)).toEqual(["solids", "water", "bath", "note"]);
     for (const type of ["solids", "water", "bath", "note"] as const)
       expect(isTimerType(type)).toBe(false);
   });
@@ -133,6 +132,47 @@ describe("solids, water, bath and note (spec 2026-11-17 §3.1)", () => {
   });
 });

+describe("symptom (spec 2026-11-26 §3.1)", () => {
+  const ok = (details: unknown) =>
+    detailsSchemas.symptom.safeParse(details).success;
+  const many = (n: number) => Array.from({ length: n }, (_, i) => `code_${i}`);
+
+  it("LOG_TYPES ends with symptom, which is not a timer", () => {
+    expect(LOG_TYPES).toHaveLength(13);
+    expect(LOG_TYPES[12]).toBe("symptom");
+    expect(isTimerType("symptom")).toBe(false);
+  });
+
+  it("1 to 30 different codes of lower-case letters, digits and _", () => {
+    expect(ok({ codes: ["cough"] })).toBe(true);
+    expect(ok({ codes: ["runny_nose", "cough"] })).toBe(true);
+    expect(ok({ codes: many(30) })).toBe(true);
+    expect(ok({ codes: many(31) })).toBe(false);
+    expect(ok({ codes: [] })).toBe(false);
+    expect(ok({})).toBe(false);
+    expect(ok({ codes: ["cough", "cough"] })).toBe(false);
+    expect(ok({ codes: ["Ho"] })).toBe(false);
+    expect(ok({ codes: ["so mui"] })).toBe(false);
+    expect(ok({ codes: [""] })).toBe(false);
+    expect(ok({ codes: ["a".repeat(40)] })).toBe(true);
+    expect(ok({ codes: ["a".repeat(41)] })).toBe(false);
+    expect(ok({ codes: "cough" })).toBe(false);
+    expect(ok({ codes: ["cough"], extra: 1 })).toBe(false);
+  });
+
+  it("an optional note of 1–200 characters after trimming", () => {
+    expect(ok({ codes: ["cough"], note: "Ho nhiều hơn về đêm" })).toBe(true);
+    expect(ok({ codes: ["cough"], note: "a".repeat(200) })).toBe(true);
+    expect(ok({ codes: ["cough"], note: "a".repeat(201) })).toBe(false);
+    expect(ok({ codes: ["cough"], note: "" })).toBe(false);
+    expect(ok({ codes: ["cough"], note: "  " })).toBe(false);
+    expect(
+      detailsSchemas.symptom.parse({ codes: ["cough"], note: "  về đêm " })
+        .note,
+    ).toBe("về đêm");
+  });
+});
+
 describe("isTimerType", () => {
   it("marks breast, sleep, pump and tummy as timers", () => {
     expect(
diff --git a/lib/rules/logForm.test.ts b/lib/rules/logForm.test.ts
index 5f2c604..a6318d4 100644
--- a/lib/rules/logForm.test.ts
+++ b/lib/rules/logForm.test.ts
@@ -164,6 +164,45 @@ describe("logForm", () => {
     expect(buildLogDetails("bath", {})).toEqual({ ok: true, details: {} });
   });

+  it("spec 2026-11-26 §3.4: a symptom log round-trips with its codes as one string", () => {
+    expect(LOG_FIELDS.symptom).toBe(QUICK_FIELDS.symptom);
+    expect(defaultLogValues("symptom")).toEqual({ codes: "", note: "" });
+    const details = { codes: ["runny_nose", "cough"], note: "Ho về đêm" };
+    const values = valuesFromDetails("symptom", details);
+    expect(values).toEqual({ codes: "runny_nose,cough", note: "Ho về đêm" });
+    expect(buildLogDetails("symptom", values)).toEqual({ ok: true, details });
+    expect(valuesFromDetails("symptom", { codes: ["cough"] })).toEqual({
+      codes: "cough",
+      note: "",
+    });
+    expect(buildLogDetails("symptom", { codes: "", note: "" })).toEqual({
+      ok: false,
+      message: "Chọn ít nhất một triệu chứng",
+    });
+  });
+
+  it("spec 2026-11-26 §3.4: a symptom log keeps its note in details, never in logs.note", () => {
+    expect(hasNoteField("symptom")).toBe(false);
+    expect(
+      buildLogPatch({
+        ...base,
+        type: "symptom",
+        values: { codes: "cough", note: " Ho về đêm " },
+        start: "2026-11-14T08:30",
+        end: "",
+        note: "gõ lúc còn chọn loại khác",
+      }),
+    ).toEqual({
+      ok: true,
+      patch: {
+        started_at: "2026-11-14T01:30:00.000Z",
+        ended_at: "2026-11-14T01:30:00.000Z",
+        details: { codes: ["cough"], note: "Ho về đêm" },
+        note: null,
+      },
+    });
+  });
+
   it("a note log has no separate Ghi chú: buildLogPatch never fills logs.note for it", () => {
     expect(hasNoteField("note")).toBe(false);
     expect(hasNoteField("solids")).toBe(true);
diff --git a/lib/rules/quickEntry.test.ts b/lib/rules/quickEntry.test.ts
index 4384c5f..47a0d6e 100644
--- a/lib/rules/quickEntry.test.ts
+++ b/lib/rules/quickEntry.test.ts
@@ -91,6 +91,7 @@ describe("buildDetails", () => {
       "water",
       "bath",
       "note",
+      "symptom",
     ] as const) {
       const defaults = defaultQuickValues(type);
       for (const field of QUICK_FIELDS[type])
@@ -99,6 +100,40 @@ describe("buildDetails", () => {
   });
 });

+describe("symptom (spec 2026-11-26 §3.4)", () => {
+  it("fields and defaults: the codes as one string, a note of at most 200", () => {
+    expect(QUICK_FIELDS.symptom).toEqual([
+      { key: "codes", label: "Triệu chứng", kind: "symptoms" },
+      {
+        key: "note",
+        label: "Ghi chú (không bắt buộc)",
+        kind: "textarea",
+        maxLength: 200,
+      },
+    ]);
+    expect(defaultQuickValues("symptom")).toEqual({ codes: "", note: "" });
+  });
+
+  it("details: the codes as an array; an empty note is left out", () => {
+    expect(
+      buildDetails("symptom", { codes: "runny_nose,cough", note: "" }),
+    ).toEqual({ ok: true, details: { codes: ["runny_nose", "cough"] } });
+    expect(
+      buildDetails("symptom", { codes: "cough", note: "  Ho về đêm " }),
+    ).toEqual({
+      ok: true,
+      details: { codes: ["cough"], note: "Ho về đêm" },
+    });
+  });
+
+  it("no code, or the same code twice, is refused with one message", () => {
+    const refused = { ok: false, message: "Chọn ít nhất một triệu chứng" };
+    expect(buildDetails("symptom", { codes: "", note: "" })).toEqual(refused);
+    expect(buildDetails("symptom", { codes: "cough,cough" })).toEqual(refused);
+    expect(buildDetails("symptom", {})).toEqual(refused);
+  });
+});
+
 describe("solids, water, bath and note (spec 2026-11-17 §3.3)", () => {
   it("fields: labels, kinds and the schema's length limits", () => {
     expect(
diff --git a/lib/ui/categories.test.ts b/lib/ui/categories.test.ts
index 6f67547..d0139f8 100644
--- a/lib/ui/categories.test.ts
+++ b/lib/ui/categories.test.ts
@@ -30,6 +30,7 @@ describe("log categories", () => {
       water: { token: "cat-pump", icon: "glass", label: "Uống nước" },
       bath: { token: "cat-diaper", icon: "bath", label: "Tắm" },
       note: { token: "cat-tummy", icon: "doc", label: "Ghi chú" },
+      symptom: { token: "cat-med", icon: "pulse", label: "Triệu chứng" },
     });
   });

```

- [x] **Step 2: Chạy để thấy đỏ**

Run: `bunx vitest run`
Expected: `Test Files  6 failed | 179 passed (185)`, `Tests  12 failed | 1669 passed (1681)`.

- [x] **Step 3: Thêm loại `symptom` (Patch 8)**

```diff
diff --git a/components/home/QuickEntrySheet.tsx b/components/home/QuickEntrySheet.tsx
index a142a12..d21514c 100644
--- a/components/home/QuickEntrySheet.tsx
+++ b/components/home/QuickEntrySheet.tsx
@@ -43,6 +43,7 @@ const TITLES: Record<InstantType, string> = {
   water: "Uống nước",
   bath: "Tắm",
   note: "Ghi chú",
+  symptom: "Triệu chứng",
 };

 export function QuickEntrySheet({
@@ -149,6 +150,8 @@ export function QuickEntrySheet({
     // Tắm has no fields: the sheet is just the time chips and Lưu.
     bath: null,
     note: <NoteFields values={values} onChange={setValues} />,
+    // Spec 2026-11-26 §3.5: the chip picker is added with the sheet's own task.
+    symptom: null,
   }[type];

   return (
diff --git a/lib/rules/describeLog.ts b/lib/rules/describeLog.ts
index 15c6068..a36f144 100644
--- a/lib/rules/describeLog.ts
+++ b/lib/rules/describeLog.ts
@@ -1,9 +1,11 @@
+import { TRIAGE } from "@/lib/content/triage";
 import {
   detailsSchemas,
   LOG_TYPES,
   type LogDetails,
   type LogType,
 } from "./logDetails";
+import { symptomShorts } from "./symptomForm";
 import { formatDuration } from "./time";

 export type LogLike = {
@@ -96,5 +98,11 @@ export function describeLog(log: LogLike, now: Date): string {
       const d = parsed.data as LogDetails["note"];
       return `Ghi chú · ${d.text}`;
     }
+    // Spec 2026-11-26 §3.3.
+    case "symptom": {
+      const d = parsed.data as LogDetails["symptom"];
+      const names = symptomShorts(d.codes, TRIAGE.symptoms).join(", ");
+      return `Triệu chứng${names ? `: ${names}` : ""}${d.note ? ` · ${d.note}` : ""}`;
+    }
   }
 }
diff --git a/lib/rules/history.ts b/lib/rules/history.ts
index 5e10241..00cb32a 100644
--- a/lib/rules/history.ts
+++ b/lib/rules/history.ts
@@ -30,7 +30,8 @@ const FILTER_TYPES: Record<Exclude<HistoryFilter, "all">, readonly string[]> = {
   sleep: ["sleep"],
   diaper: ["diaper"],
   medicine: ["medicine"],
-  temperature: ["temperature"],
+  // Spec 2026-11-26 §3.3: a symptom log sits with the temperature readings.
+  temperature: ["temperature", "symptom"],
   // Spec 2026-11-17 §3.4: water sits with solids; "Khác" is every type without its own chip.
   solids: ["solids", "water"],
   other: ["bath", "note", "pump", "tummy"],
diff --git a/lib/rules/logDetails.ts b/lib/rules/logDetails.ts
index 4a412ff..365bf5a 100644
--- a/lib/rules/logDetails.ts
+++ b/lib/rules/logDetails.ts
@@ -13,6 +13,7 @@ export const LOG_TYPES = [
   "water",
   "bath",
   "note",
+  "symptom",
 ] as const;
 export type LogType = (typeof LOG_TYPES)[number];

@@ -91,6 +92,20 @@ const solids = z
   .strict();
 const water = z.object({ ml: z.number().int().min(1).max(500) }).strict();
 const note = z.object({ text: z.string().trim().min(1).max(500) }).strict();
+// Spec 2026-11-26 §3.1: codes of content/triage.vi.json. A code the content no
+// longer has is still valid here; it is only skipped when the log is shown.
+const symptom = z
+  .object({
+    codes: z
+      .array(z.string().regex(/^[a-z0-9_]{1,40}$/))
+      .min(1)
+      .max(30),
+    note: z.string().trim().min(1).max(200).optional(),
+  })
+  .strict()
+  .refine((d) => new Set(d.codes).size === d.codes.length, {
+    message: "Triệu chứng bị lặp",
+  });

 export const detailsSchemas = {
   breast,
@@ -105,6 +120,7 @@ export const detailsSchemas = {
   water,
   bath: empty,
   note,
+  symptom,
 } satisfies Record<LogType, z.ZodType>;

 export type LogDetails = {
diff --git a/lib/rules/logForm.ts b/lib/rules/logForm.ts
index 6b122a9..ca14ad7 100644
--- a/lib/rules/logForm.ts
+++ b/lib/rules/logForm.ts
@@ -23,8 +23,9 @@ export const MANUAL_TYPES: { value: LogType; label: string }[] = [

 // Spec 2026-11-17 §3.3: a note log's text is its "Nội dung" (details.text), so the
 // sheet's own "Ghi chú" field (the logs.note column) is not offered for it.
+// Spec 2026-11-26 §3.4: the same holds for a symptom log, whose note is details.note.
 export function hasNoteField(type: LogType): boolean {
-  return type !== "note";
+  return type !== "note" && type !== "symptom";
 }

 export const LOG_FIELDS: Record<LogType, QuickField[]> = {
@@ -63,7 +64,12 @@ export function valuesFromDetails(
   const parsed = detailsSchemas[type].safeParse(details);
   if (!parsed.success) return values;
   for (const [key, value] of Object.entries(parsed.data))
-    values[key] = typeof value === "number" ? String(value) : value;
+    values[key] =
+      typeof value === "number"
+        ? String(value)
+        : Array.isArray(value)
+          ? value.join(",")
+          : value;
   return values;
 }

diff --git a/lib/rules/quickEntry.ts b/lib/rules/quickEntry.ts
index f12040c..20aaa55 100644
--- a/lib/rules/quickEntry.ts
+++ b/lib/rules/quickEntry.ts
@@ -1,5 +1,6 @@
 import type { LogLike } from "./describeLog";
 import { detailsSchemas, MEDICINE_UNITS, type StoolColor } from "./logDetails";
+import { parseCodes } from "./symptomForm";

 export type InstantType =
   | "bottle"
@@ -9,12 +10,15 @@ export type InstantType =
   | "solids"
   | "water"
   | "bath"
-  | "note";
+  | "note"
+  | "symptom";
 export type QuickValues = Record<string, string | boolean>;
 export type QuickField = {
   key: string;
   label: string;
-  kind: "number" | "text" | "textarea" | "select" | "checkbox";
+  // "symptoms" (spec 2026-11-26 §3.4): the chip picker; its value is the picked
+  // codes joined with ",".
+  kind: "number" | "text" | "textarea" | "select" | "checkbox" | "symptoms";
   options?: { value: string; label: string }[];
   showIf?: (values: QuickValues) => boolean;
   // Same limit as the schema, so a text field cannot be typed past it.
@@ -107,6 +111,15 @@ export const QUICK_FIELDS: Record<InstantType, QuickField[]> = {
   water: [{ key: "ml", label: "Số ml", kind: "number" }],
   bath: [],
   note: [{ key: "text", label: "Nội dung", kind: "textarea", maxLength: 500 }],
+  symptom: [
+    { key: "codes", label: "Triệu chứng", kind: "symptoms" },
+    {
+      key: "note",
+      label: "Ghi chú (không bắt buộc)",
+      kind: "textarea",
+      maxLength: 200,
+    },
+  ],
 };

 const DEFAULTS: Record<InstantType, QuickValues> = {
@@ -118,6 +131,7 @@ const DEFAULTS: Record<InstantType, QuickValues> = {
   water: { ml: "" },
   bath: {},
   note: { text: "" },
+  symptom: { codes: "", note: "" },
 };

 // Tắm has no fields, so it has nothing to get wrong and no message.
@@ -131,6 +145,7 @@ const MESSAGES: Record<CheckedType, string> = {
   solids: "Nhập tên món",
   water: "Nhập số ml từ 1 đến 500",
   note: "Nhập ghi chú",
+  symptom: "Chọn ít nhất một triệu chứng",
 };

 export function defaultQuickValues(type: InstantType): QuickValues {
@@ -194,6 +209,10 @@ function rawDetails(
       return { ml: toNumber(v.ml) };
     case "note":
       return { text: typeof v.text === "string" ? v.text.trim() : "" };
+    case "symptom": {
+      const note = typeof v.note === "string" ? v.note.trim() : "";
+      return { codes: parseCodes(v.codes), ...(note === "" ? {} : { note }) };
+    }
   }
 }

diff --git a/lib/ui/categories.ts b/lib/ui/categories.ts
index 2134e22..abb9a21 100644
--- a/lib/ui/categories.ts
+++ b/lib/ui/categories.ts
@@ -20,6 +20,7 @@ export const CATEGORIES: Record<
   water: { token: "cat-pump", icon: "glass", label: "Uống nước" },
   bath: { token: "cat-diaper", icon: "bath", label: "Tắm" },
   note: { token: "cat-tummy", icon: "doc", label: "Ghi chú" },
+  symptom: { token: "cat-med", icon: "pulse", label: "Triệu chứng" },
 };

 // A log type this build does not know (written by a newer release while this
```

- [x] **Step 4: Chạy để thấy xanh**

Run: `bunx vitest run && bun run typecheck`
Expected: `Test Files  185 passed (185)`, `Tests  1681 passed (1681)`; `tsc --noEmit` không báo lỗi.

- [x] **Step 5: Commit**

```bash
git add lib/rules lib/ui/categories.ts lib/ui/categories.test.ts components/home/QuickEntrySheet.tsx
git commit -m "feat(symptom): the symptom log type in the rules" -m "Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>"
```

### Task 5: Kiểm cuối M1a, áp migration, rồi đưa lên `main`

**Files:**

- Modify: file plan này (ghi kết quả kiểm)

**Interfaces:**

- Consumes: mọi thứ của các task trước trong plan này.
- Produces: kết quả kiểm, ghi ngay trong plan; migration đã áp lên Supabase thật; `main` có M1a.

- [x] **Step 1: Chạy cả bộ kiểm**

Run: `bun run typecheck && bunx vitest run`
Expected: `tsc --noEmit` không báo lỗi; `Test Files  185 passed (185)`, `Tests  1681 passed (1681)`.

- [x] **Step 2: pgTAP trên DB dựng lại từ đầu**

```bash
docker info >/dev/null 2>&1 || { open -a OrbStack; until docker info >/dev/null 2>&1; do sleep 2; done; }
bun run db:start
bun run db:reset
bun run db:test
bunx supabase stop
```

Expected: `All tests successful.`, `Files=16, Tests=166`, `Result: PASS`. Sau đó tắt OrbStack nếu chính phiên này đã bật nó.

- [x] **Step 3: Build**

Run: `bun run build`
Expected: lần đầu có thể dừng với thông báo bảo mật của Next.js 16.4.3 (bình thường). Chạy lại đúng lệnh đó: `✓ Generating static pages` và thoát mã 0.

- [x] **Step 4: Người dùng áp migration lên Supabase thật**

Dừng lại ở đây. Phiên thực thi **không** tự chạy lệnh ghi vào DB thật. Đưa người dùng hai lệnh, mỗi lệnh một khối:

```bash
bunx supabase db push --linked --dry-run
```

```bash
bunx supabase db push --linked
```

Nói rõ với người dùng: lệnh đầu chỉ liệt kê, phải thấy đúng một migration `20261126000100_symptom_log.sql`; thấy migration nào khác thì dừng và báo lại. Lệnh thứ hai áp nó; migration chỉ nới ràng buộc `logs_type_check`, không đụng dữ liệu. CLI hỏi mật khẩu thì người dùng tự nhập. Chờ người dùng báo đã chạy xong rồi mới sang bước sau. Ghi vào plan giờ người dùng báo.

- [x] **Step 5: Ghi kết quả, rồi hỏi về việc commit tài liệu**

Ghi ngay dưới bước này: số đo đỏ và xanh của từng task có khớp plan không, kết quả Step 1 đến Step 4, và mục nào chưa kiểm.

**Kết quả kiểm (2026-11-26, nhánh `feat/kim-bun-dot-om-m1a`):**

- 8 patch áp sạch bằng `kb_patch`, không sửa tay dòng nào.
- Số đo đỏ và xanh của từng task khớp plan:
  - Task 1 (`2060c0e`): đỏ `1 failed | 183 passed (184)`, `1 failed | 1659 passed (1660)`; xanh `184 passed (184)`, `1660 passed (1660)`.
  - Task 2 (`3906bb2`): đỏ `Failed 1/3 subtests` ở file 016 (test 1), `Files=16, Tests=166`, `Result: FAIL`; xanh `All tests successful.`, `Files=16, Tests=166`, `Result: PASS`.
  - Task 3 (`3dff75c`): đỏ `1 failed | 184 passed (185)`, `1660 passed (1660)`; xanh `185 passed (185)`, `1671 passed (1671)`.
  - Task 4 (`1afbc83`): đỏ `6 failed | 179 passed (185)`, `12 failed | 1669 passed (1681)`; xanh `185 passed (185)`, `1681 passed (1681)`.
- Step 1: `tsc --noEmit` không báo lỗi; `Test Files  185 passed (185)`, `Tests  1681 passed (1681)`.
- Step 2: pgTAP trên DB local dựng lại từ đầu: `All tests successful.`, `Files=16, Tests=166`, `Result: PASS`. Đã `bunx supabase stop` và tắt OrbStack (phiên này bật nó).
- Step 3: `bun run build` lần đầu dừng với `SecurityFatalError` (cảnh báo bảo mật của Next.js 16.4.3, mã 1); lần hai `✓ Generating static pages using 9 workers (40/40)`, thoát mã 0. Không chạy `next upgrade`.
- Step 4: người dùng tự chạy. `--dry-run` liệt kê đúng một migration `20261126000100_symptom_log.sql`; `bunx supabase db push --linked` in `Applying migration 20261126000100_symptom_log.sql...` rồi `Finished supabase db push.` Người dùng báo lúc 2026-11-26 22:46 (giờ Việt Nam).
- Chưa kiểm: ghi thử một bản ghi `symptom` lên Supabase thật (không làm, vì không được ghi dữ liệu thật); trình duyệt (M1a không đổi gì trên màn hình, mục 9 của Diễn giải spec).
- Step 5: người dùng đồng ý commit file spec và hai file plan (2026-11-26).
- Step 6: người dùng đồng ý đẩy M1a lên `main` (2026-11-26). Code của M1a kết thúc ở `1afbc83`; ngay trên nó là commit tài liệu chứa các dòng này, và đó là đầu `main` sau M1a.
- Ghi chú: dòng `git rev-parse --short main origin/main` ở Step 6 báo `fatal: Needed a single revision` trên git của máy này; chạy hai lệnh `git rev-parse --short main` và `git rev-parse --short origin/main` riêng.

File spec và hai file plan đang là untracked. Hỏi người dùng một câu: "Commit file spec và hai file plan của Đợt ốm vào nhánh này không?" và chờ câu trả lời. Không đồng ý thì bỏ phần còn lại của bước này; kết quả vẫn nằm trong file plan.

Đồng ý thì:

```bash
git status --short   # chỉ ba file tài liệu dưới đây là untracked hoặc đã đổi
git add docs/blueprint/specs/2026-11-26-kim-bun-dot-om-design.md docs/blueprint/plans/2026-11-26-kim-bun-dot-om-m1a.md docs/blueprint/plans/2026-11-26-kim-bun-dot-om-m1b.md
git commit -m "docs: the Đợt ốm spec, the M1 plans and the M1a check results" -m "Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>"
```

- [x] **Step 6: Hỏi rồi đưa lên `main`**

Chỉ khi Step 1 đến Step 4 đều đạt và không còn lỗi đã biết. Hỏi người dùng "Đẩy M1a lên `main`?" và chờ câu trả lời. Được đồng ý thì:

```bash
git checkout main
git merge --ff-only feat/kim-bun-dot-om-m1a
git push origin main
git rev-parse --short main origin/main   # hai dòng phải giống nhau
```

Báo cáo: `git log --oneline` của các commit vừa lên `main`; kết quả typecheck, vitest, pgTAP, build; migration đã áp lúc nào; mục nào chưa kiểm. Sau M1a, mở plan M1b: cập nhật dòng "Nhánh" của nó theo commit mới của `main`.
