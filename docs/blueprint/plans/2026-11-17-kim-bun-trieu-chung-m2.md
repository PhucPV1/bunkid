# Kim Bun — Phân loại triệu chứng có gợi ý bệnh, popup đóng mượt — M2 (giao diện) Implementation Plan

Steps use checkbox (`- [ ]`) syntax for tracking.

**Spec:** `docs/blueprint/specs/2026-11-17-kim-bun-trieu-chung-popup-design.md` (toàn bộ). Nội dung nguyên văn: `docs/blueprint/specs/2026-11-17-kim-bun-trieu-chung-draft.patch` ("patch nháp").

**Status:** approved 2026-11-17

**Goal:** Màn `/trieu-chung` cho chọn triệu chứng bằng chip, kết quả có sơ cứu theo mức độ và tab bệnh có thể gặp; checklist thiết bị bước 35.

**Architecture:**

- **Popup:** chỉ CSS trong `app/globals.css` và `components/ui/Sheet.tsx` (khoảng trượt `--kb-sheet-gap`, `data-closing`, nền mờ dần, đổi thứ tự xoá `closing`).
- **Nội dung:** `content/triage.vi.json` (`symptoms`, `symptomsSource`, `firstAid`, `whileGoing`) và `content/conditions.vi.json` (9 bài mới, `short`, mốc tuổi), lấy từ patch nháp; schema zod trong `lib/content/`.
- **Luật thuần:** `lib/rules/triage.ts` (`temperatureFindings` mới, `hasFever`) và file mới `lib/rules/symptoms.ts` (`visibleSymptoms`, `effectiveSymptoms`, `suggestConditions`, `firstAidFor`).
- **Giao diện:** `components/triage/SymptomChips.tsx` (chip nhiều lựa chọn), `components/triage/ConditionTabs.tsx` (tab bệnh), `TriageResult` (khối sơ cứu, tab), `TriageScreen` (ghép dữ liệu).

**Tech Stack:** Next.js 16.4.3, React 19.3.1, TypeScript `strict`, Tailwind CSS 4.3.3, zod, Vitest (môi trường `node`, render bằng `renderToStaticMarkup`), Bun. Không thêm gói nào.

**Nhánh:** `feat/kim-bun-trieu-chung`, tiếp sau các commit của M1 (M1 phải xong và xanh trước). Baseline: số test ghi trong mục Kết quả của M1.

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
### Task 5: Màn kết quả: sơ cứu và tab bệnh

**Files:**

- Create: `components/triage/ConditionTabs.tsx`
- Modify: `components/triage/TriageResult.tsx`
- Test: `components/triage/conditiontabs.test.tsx` (mới), `components/triage/triage.test.tsx`

**Interfaces:**

- Consumes: `Suggestion` (Task 4); `FirstAid` (Task 2); `TRIAGE.whileGoing`, `TRIAGE.homeCare`.
- Produces:
  - `components/triage/ConditionTabs.tsx`: `export function ConditionTabs({ suggestions }: { suggestions: Suggestion[] })` (trả `null` khi rỗng); `export function nextTabIndex(current: number, key: string, count: number): number | null`.
  - `TriageResult` thêm prop `suggestions?: Suggestion[]` (mặc định `[]`) và `firstAid?: FirstAid[]` (mặc định `[]`).

- [ ] **Step 1: Viết test thất bại cho `ConditionTabs`**

Tạo `components/triage/conditiontabs.test.tsx`:

```tsx
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { CONDITIONS } from "@/lib/content/conditions";
import type { Suggestion } from "@/lib/rules/symptoms";
import { ConditionTabs, nextTabIndex } from "./ConditionTabs";

const article = (code: string) => {
  const found = CONDITIONS.articles.find((a) => a.code === code);
  if (!found) throw new Error(code);
  return found;
};

const suggestions: Suggestion[] = [
  {
    article: article("cam_lanh"),
    matched: ["Sốt hoặc sờ thấy nóng", "Ho"],
    score: 1,
  },
  { article: article("croup"), matched: ["Ho"], score: 0.5 },
];

describe("ConditionTabs (spec 2026-11-17 §6.2)", () => {
  const html = renderToStaticMarkup(
    <ConditionTabs suggestions={suggestions} />,
  );

  it("says it is a suggestion, not a diagnosis", () => {
    expect(html).toContain(">Có thể bé đang bị</h2>");
    expect(html).toContain(
      "Gợi ý theo triệu chứng đã chọn, không phải chẩn đoán.",
    );
  });

  it("is a tab list with one 44 px tab per suggestion, short names, first selected", () => {
    expect(html).toContain('role="tablist"');
    expect(html).toContain('aria-label="Bệnh có thể gặp"');
    expect(html.match(/role="tab"/g)).toHaveLength(2);
    expect(html).toMatch(/aria-selected="true"[^>]*>Cảm lạnh<\/button>/);
    expect(html).toMatch(/aria-selected="false"[^>]*>Croup<\/button>/);
    expect(html).toContain("min-h-11");
    expect(html.match(/tabindex="0"/g)).toHaveLength(1);
  });

  it("shows the selected article in full in the tab panel", () => {
    const first = article("cam_lanh");
    expect(html).toContain('role="tabpanel"');
    expect(html).toContain("Khớp: Sốt hoặc sờ thấy nóng, Ho");
    expect(html).toContain(first.summary);
    for (const heading of [
      "Dấu hiệu",
      "Chăm tại nhà",
      "Nên đi khám",
      "Đi khám ngay",
    ])
      expect(html).toContain(`>${heading}</h3>`);
    expect(html).toContain(`href="${first.source}"`);
    expect(html).toContain("Thường kéo dài: ");
    expect(html).toContain("bg-danger-soft");
    expect(html).toContain("text-danger-ink");
  });

  it("renders nothing without suggestions", () => {
    expect(renderToStaticMarkup(<ConditionTabs suggestions={[]} />)).toBe("");
  });
});

describe("nextTabIndex", () => {
  it("wraps with the arrows and jumps with Home and End", () => {
    expect(nextTabIndex(0, "ArrowRight", 3)).toBe(1);
    expect(nextTabIndex(2, "ArrowRight", 3)).toBe(0);
    expect(nextTabIndex(0, "ArrowLeft", 3)).toBe(2);
    expect(nextTabIndex(1, "Home", 3)).toBe(0);
    expect(nextTabIndex(1, "End", 3)).toBe(2);
    expect(nextTabIndex(1, "Enter", 3)).toBeNull();
  });
});
```

- [ ] **Step 2: Viết test thất bại cho `TriageResult`**

Thêm vào cuối `describe("TriageResult", …)` trong `components/triage/triage.test.tsx`, và thêm import `import { CONDITIONS } from "@/lib/content/conditions";`:

```tsx
it("red: first aid blocks, then the way there, then the possible conditions", () => {
  const result = {
    level: "red",
    findings: [{ level: "red", text: "Bé co giật" }],
  } as unknown as Result;
  const seizure = TRIAGE.firstAid.find((b) => b.code === "seizure");
  const sot = CONDITIONS.articles.find((a) => a.code === "sot");
  if (!seizure || !sot) throw new Error("content");
  const html = renderToStaticMarkup(
    <TriageResult
      result={result}
      ageDays={200}
      contacts={[]}
      onRestart={() => {}}
      firstAid={[seizure]}
      suggestions={[
        { article: sot, matched: ["Sốt hoặc sờ thấy nóng"], score: 1 },
      ]}
    />,
  );
  const aid = html.indexOf(`>${seizure.title}</h2>`);
  const way = html.indexOf(">Trên đường đi</h2>");
  const tabs = html.indexOf('role="tablist"');
  expect(aid).toBeGreaterThan(-1);
  expect(way).toBeGreaterThan(aid);
  expect(tabs).toBeGreaterThan(way);
  expect(html).toContain("border-2");
  expect(html).toContain("border-danger-solid");
  expect(html).toContain(`<li>${seizure.steps[0]}</li>`);
  expect(html).toContain(`<li>${TRIAGE.whileGoing[0]}</li>`);
  expect(html).not.toContain("Chăm bé tại nhà");
});

it("yellow without first aid: Trong lúc chờ đi khám uses the general home care", () => {
  const result = { level: "yellow", findings: [] } as unknown as Result;
  const html = renderToStaticMarkup(
    <TriageResult
      result={result}
      ageDays={200}
      contacts={[]}
      onRestart={() => {}}
    />,
  );
  expect(html).toContain(">Trong lúc chờ đi khám</h2>");
  expect(html).toContain(`<li>${TRIAGE.homeCare[0]}</li>`);
});

it("green: Làm ngay tại nhà with the fever block; Chăm bé tại nhà only without suggestions", () => {
  const result = { level: "green", findings: [] } as unknown as Result;
  const fever = TRIAGE.firstAid.find((b) => b.code === "fever");
  const sot = CONDITIONS.articles.find((a) => a.code === "sot");
  if (!fever || !sot) throw new Error("content");
  const withData = renderToStaticMarkup(
    <TriageResult
      result={result}
      ageDays={200}
      contacts={[]}
      onRestart={() => {}}
      firstAid={[fever]}
      suggestions={[
        { article: sot, matched: ["Sốt hoặc sờ thấy nóng"], score: 1 },
      ]}
    />,
  );
  expect(withData).toContain(">Làm ngay tại nhà</h2>");
  expect(withData).toContain(`>${fever.title}</h3>`);
  expect(withData).not.toContain("Chăm bé tại nhà");
  const bare = renderToStaticMarkup(
    <TriageResult
      result={result}
      ageDays={200}
      contacts={[]}
      onRestart={() => {}}
    />,
  );
  expect(bare).toContain(">Chăm bé tại nhà</h2>");
  expect(bare).not.toContain("Làm ngay tại nhà");
  expect(bare).not.toContain('role="tablist"');
});
```

- [ ] **Step 3: Chạy test, thấy thất bại**

Run: `bunx vitest run components/triage`
Expected: FAIL: không resolve được `./ConditionTabs`; các test `TriageResult` mới không tìm thấy "Trên đường đi", "Trong lúc chờ đi khám", "Làm ngay tại nhà".

- [ ] **Step 4: Viết `components/triage/ConditionTabs.tsx`**

```tsx
"use client";

import { useId, useRef, useState } from "react";
import { Glass } from "@/components/ui/Glass";
import type { ConditionArticle } from "@/lib/content/conditions";
import type { Suggestion } from "@/lib/rules/symptoms";
import { cx } from "@/lib/ui/cx";

const SECTIONS: { key: "signs" | "homeCare" | "seeDoctor"; title: string }[] = [
  { key: "signs", title: "Dấu hiệu" },
  { key: "homeCare", title: "Chăm tại nhà" },
  { key: "seeDoctor", title: "Nên đi khám" },
];

// WAI-ARIA tabs: arrows wrap, Home and End jump; any other key is not ours.
export function nextTabIndex(
  current: number,
  key: string,
  count: number,
): number | null {
  if (key === "ArrowRight") return (current + 1) % count;
  if (key === "ArrowLeft") return (current - 1 + count) % count;
  if (key === "Home") return 0;
  if (key === "End") return count - 1;
  return null;
}

// Spec 2026-11-17 §6.2 block 3 (phương án E).
export function ConditionTabs({ suggestions }: { suggestions: Suggestion[] }) {
  const [selected, setSelected] = useState(0);
  const id = useId();
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  if (suggestions.length === 0) return null;
  const index = Math.min(selected, suggestions.length - 1);
  const current = suggestions[index];

  function choose(next: number) {
    setSelected(next);
    const tab = tabs.current[next];
    tab?.focus();
    tab?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }

  return (
    <section className="flex flex-col gap-3">
      <h2 className="px-1 text-xl leading-[26px] font-bold text-ink">
        Có thể bé đang bị
      </h2>
      <p className="-mt-2 px-1 text-[13px] text-muted">
        Gợi ý theo triệu chứng đã chọn, không phải chẩn đoán.
      </p>
      <div
        role="tablist"
        aria-label="Bệnh có thể gặp"
        className="flex gap-1.5 overflow-x-auto rounded-full bg-ink/8 p-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {suggestions.map((suggestion, position) => {
          const on = position === index;
          return (
            <button
              key={suggestion.article.code}
              ref={(element) => {
                tabs.current[position] = element;
              }}
              type="button"
              role="tab"
              id={`${id}-tab-${position}`}
              aria-selected={on}
              aria-controls={`${id}-panel`}
              tabIndex={on ? 0 : -1}
              onClick={() => choose(position)}
              onKeyDown={(event) => {
                const next = nextTabIndex(
                  position,
                  event.key,
                  suggestions.length,
                );
                if (next === null) return;
                event.preventDefault();
                choose(next);
              }}
              className={cx(
                "min-h-11 shrink-0 rounded-full px-4 text-[15px] text-ink",
                on
                  ? "bg-glass-solid font-semibold shadow-[0_2px_6px_rgb(0_0_0/0.12)]"
                  : "font-medium",
              )}
            >
              {suggestion.article.short ?? suggestion.article.title}
            </button>
          );
        })}
      </div>
      <Glass
        as="article"
        role="tabpanel"
        id={`${id}-panel`}
        aria-labelledby={`${id}-tab-${index}`}
        className="flex flex-col gap-3 p-4 text-base text-ink"
      >
        <ArticleBody article={current.article} matched={current.matched} />
      </Glass>
    </section>
  );
}

function ArticleBody({
  article,
  matched,
}: {
  article: ConditionArticle;
  matched: string[];
}) {
  return (
    <>
      <p className="text-[15px] text-muted">Khớp: {matched.join(", ")}</p>
      <p>{article.summary}</p>
      {SECTIONS.map((section) => (
        <section key={section.key}>
          <h3 className="text-[15px] font-semibold">{section.title}</h3>
          <ul className="list-disc pl-5">
            {article[section.key].map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </section>
      ))}
      <section className="rounded-[16px] bg-danger-soft p-3 text-danger-ink">
        <h3 className="font-semibold">Đi khám ngay</h3>
        <ul className="list-disc pl-5">
          {article.goNow.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </section>
      <p className="text-[13px] text-muted">
        Thường kéo dài: {article.usualCourse} · Nguồn:{" "}
        <a
          href={article.source}
          className="inline-flex min-h-11 items-center underline"
          target="_blank"
          rel="noreferrer"
        >
          NHS
        </a>{" "}
        (xem lại {article.reviewedAt.split("-").reverse().join("/")})
      </p>
    </>
  );
}
```

- [ ] **Step 5: Sửa `components/triage/TriageResult.tsx`**

Thay toàn bộ file bằng:

```tsx
import { CallList } from "@/components/emergency/CallList";
import { Button } from "@/components/ui/Button";
import { Glass } from "@/components/ui/Glass";
import { type FirstAid, TRIAGE } from "@/lib/content/triage";
import type { Suggestion } from "@/lib/rules/symptoms";
import {
  goNowIf,
  RESULT_TITLE,
  type TriageResult as Result,
} from "@/lib/rules/triage";
import type { EmergencyContactRow } from "@/lib/supabase/rows";
import { ConditionTabs } from "./ConditionTabs";

const CARD = {
  red: "bg-danger-solid text-on-danger",
  yellow: "bg-warn-soft text-warn-ink",
  green: "bg-good-soft text-good-ink",
} as const;

// Spec gốc §6.6: every result shows 115, the family's doctor numbers and the disclaimer.
// Spec 2026-11-17 §6.2: first aid and possible conditions, in this order.
export function TriageResult({
  result,
  ageDays,
  contacts,
  onRestart,
  suggestions = [],
  firstAid = [],
}: {
  result: Result;
  ageDays: number;
  contacts: EmergencyContactRow[];
  onRestart: () => void;
  suggestions?: Suggestion[];
  firstAid?: FirstAid[];
}) {
  return (
    <section className="flex flex-col gap-[18px]">
      <div
        role="alert"
        className={`flex flex-col gap-2 rounded-[28px] p-4 ${CARD[result.level]}`}
      >
        <p className="text-xl leading-[26px] font-bold">
          {RESULT_TITLE[result.level]}
        </p>
        {result.findings.length > 0 && (
          <ul className="list-disc pl-5 text-base">
            {result.findings.map((finding) => (
              <li key={finding.text}>{finding.text}</li>
            ))}
          </ul>
        )}
      </div>
      {result.level === "red" && (
        <>
          {firstAid.map((block) => (
            <section
              key={block.code}
              className="flex flex-col gap-2 rounded-[28px] border-2 border-danger-solid bg-glass-solid p-4"
            >
              <h2 className="text-lg font-bold text-danger-ink">
                {block.title}
              </h2>
              <ol className="list-decimal pl-5 text-base text-ink">
                {block.steps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            </section>
          ))}
          <Glass className="flex flex-col gap-2 p-4">
            <h2 className="text-[17px] font-semibold text-ink">
              Trên đường đi
            </h2>
            <ul className="list-disc pl-5 text-base text-ink">
              {TRIAGE.whileGoing.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </Glass>
        </>
      )}
      {result.level === "yellow" && (
        <AidCard title="Trong lúc chờ đi khám" blocks={firstAid} fallback />
      )}
      {result.level === "green" && firstAid.length > 0 && (
        <AidCard title="Làm ngay tại nhà" blocks={firstAid} fallback={false} />
      )}
      <ConditionTabs suggestions={suggestions} />
      {result.level === "green" && suggestions.length === 0 && (
        <Glass className="flex flex-col gap-2 p-4">
          <h2 className="text-[17px] font-semibold text-ink">
            Chăm bé tại nhà
          </h2>
          <ul className="list-disc pl-5 text-base text-ink">
            {TRIAGE.homeCare.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </Glass>
      )}
      {result.level !== "red" && (
        <p className="px-1 text-base font-semibold text-ink">
          {goNowIf(TRIAGE.questions, ageDays)}
        </p>
      )}
      <CallList contacts={contacts} />
      <p className="px-1 text-[13px] text-muted">{TRIAGE.disclaimer}</p>
      <Button variant="secondary" size="lg" block onClick={onRestart}>
        Làm lại
      </Button>
    </section>
  );
}

// Yellow and green: matched first-aid blocks in one card; yellow falls back to home care.
function AidCard({
  title,
  blocks,
  fallback,
}: {
  title: string;
  blocks: FirstAid[];
  fallback: boolean;
}) {
  return (
    <Glass className="flex flex-col gap-3 p-4 text-base text-ink">
      <h2 className="text-[17px] font-semibold">{title}</h2>
      {blocks.length > 0
        ? blocks.map((block) => (
            <section key={block.code} className="flex flex-col gap-1">
              <h3 className="text-[15px] font-semibold">{block.title}</h3>
              <ol className="list-decimal pl-5">
                {block.steps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            </section>
          ))
        : fallback && (
            <ul className="list-disc pl-5">
              {TRIAGE.homeCare.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          )}
    </Glass>
  );
}
```

- [ ] **Step 6: Chạy test, thấy xanh**

Run: `bunx vitest run components/triage lib/themeGuard.test.ts && bun run typecheck`
Expected: PASS toàn bộ, gồm test `TriageResult` cũ ("a solid danger card without emoji…"); themeGuard không thấy hex; typecheck không lỗi.

- [ ] **Step 7: Commit**

```bash
git add components/triage
git commit -m "feat(triage): first aid blocks and possible-condition tabs on the result

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Màn nhập: chip triệu chứng

**Files:**

- Create: `components/triage/SymptomChips.tsx`
- Modify: `components/triage/TriageScreen.tsx`
- Test: `components/triage/triage.test.tsx`

**Interfaces:**

- Consumes: `visibleSymptoms`, `effectiveSymptoms`, `suggestConditions`, `firstAidFor`, `FEVER_SYMPTOM`, `Suggestion` (Task 4); `hasFever` (Task 3); `TRIAGE.symptoms`, `TRIAGE.firstAid`, `TriageSymptom`, `FirstAid` (Task 2); `CONDITIONS.articles`; `TriageResult` với `suggestions` và `firstAid` (Task 5).
- Produces: `components/triage/SymptomChips.tsx`: `export function SymptomChips(props: { groups: { code: string; name: string }[]; symptoms: TriageSymptom[]; selected: ReadonlySet<string>; feverLocked: boolean; onToggle: (code: string) => void })`.

- [ ] **Step 1: Viết test thất bại**

Trong `components/triage/triage.test.tsx`:

1. Thêm import `import { visibleSymptoms } from "@/lib/rules/symptoms";` và `import { SymptomChips } from "./SymptomChips";`.
2. Trong test `"a glass temperature card, one switch per visible question…"` của `TriageScreen`, thêm trước `});` cuối test:

```tsx
const age = ageDays(baby.dob, new Date());
const chips = visibleSymptoms(TRIAGE.symptoms, age);
expect(html.match(/aria-pressed=/g)).toHaveLength(chips.length);
expect(html).toContain(">Bé đang có gì?</h2>");
expect(html).toContain(">Có dấu hiệu nào dưới đây?</h2>");
expect(html.indexOf("Bé đang có gì?")).toBeLessThan(
  html.indexOf("Có dấu hiệu nào dưới đây?"),
);
expect(html).not.toContain("Đánh dấu những gì bé đang có:");
```

3. Thêm `describe` mới ở cuối file:

```tsx
describe("SymptomChips (spec 2026-11-17 §6.1)", () => {
  const symptoms = TRIAGE.symptoms.filter((s) =>
    ["fever", "cough", "diaper_rash"].includes(s.code),
  );

  it("groups wrapped multi-select chips, pressed ones inked with a tick", () => {
    const html = renderToStaticMarkup(
      <SymptomChips
        groups={TRIAGE.groups}
        symptoms={symptoms}
        selected={new Set(["cough"])}
        feverLocked={false}
        onToggle={() => {}}
      />,
    );
    expect(html.match(/role="group"/g)).toHaveLength(3);
    expect(html).toContain('aria-label="Hô hấp"');
    expect(html).toContain("flex flex-wrap gap-2");
    expect(html).toMatch(
      /aria-pressed="true"[^>]*>✓ Ho<\/button>/,
    );
    expect(html).toMatch(/class="[^"]*\bbg-ink\b[^"]*\btext-bg\b[^"]*">✓ Ho</);
    expect(html).toMatch(
      /aria-pressed="false"[^>]*glass[^>]*>Sốt hoặc sờ thấy nóng<\/button>/,
    );
    expect(html).toContain("min-h-11");
    expect(html).not.toContain("Bật theo nhiệt độ đã nhập.");
  });

  it("locks the fever chip on when the temperature is from 38°C", () => {
    const html = renderToStaticMarkup(
      <SymptomChips
        groups={TRIAGE.groups}
        symptoms={symptoms}
        selected={new Set()}
        feverLocked
        onToggle={() => {}}
      />,
    );
    expect(html).toMatch(
      /aria-pressed="true" aria-disabled="true"[^>]*>✓ Sốt hoặc sờ thấy nóng<\/button>/,
    );
    expect(html).toContain(">Bật theo nhiệt độ đã nhập.</p>");
  });
});
```

- [ ] **Step 2: Chạy test, thấy thất bại**

Run: `bunx vitest run components/triage/triage.test.tsx`
Expected: FAIL: không resolve được `./SymptomChips`; `TriageScreen` không có `aria-pressed` và vẫn có "Đánh dấu những gì bé đang có:".

- [ ] **Step 3: Viết `components/triage/SymptomChips.tsx`**

```tsx
import type { TriageSymptom } from "@/lib/content/triage";
import { FEVER_SYMPTOM } from "@/lib/rules/symptoms";
import { cx } from "@/lib/ui/cx";

// Spec 2026-11-17 §6.1 (phương án A): wrapped multi-select chips, one block per group.
export function SymptomChips({
  groups,
  symptoms,
  selected,
  feverLocked,
  onToggle,
}: {
  groups: { code: string; name: string }[];
  symptoms: TriageSymptom[];
  selected: ReadonlySet<string>;
  feverLocked: boolean;
  onToggle: (code: string) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      {groups.map((group) => {
        const list = symptoms.filter((symptom) => symptom.group === group.code);
        if (list.length === 0) return null;
        const hasLockedFever =
          feverLocked && list.some((symptom) => symptom.code === FEVER_SYMPTOM);
        return (
          <section key={group.code} className="flex flex-col gap-2">
            <h3 className="px-1 text-[13px] leading-[18px] font-semibold text-muted">
              {group.name}
            </h3>
            <div
              role="group"
              aria-label={group.name}
              className="flex flex-wrap gap-2"
            >
              {list.map((symptom) => {
                const locked = feverLocked && symptom.code === FEVER_SYMPTOM;
                const on = locked || selected.has(symptom.code);
                return (
                  <button
                    key={symptom.code}
                    type="button"
                    aria-pressed={on}
                    aria-disabled={locked || undefined}
                    onClick={() => {
                      if (!locked) onToggle(symptom.code);
                    }}
                    className={cx(
                      "min-h-11 rounded-full px-4 text-left text-[15px]",
                      on
                        ? "bg-ink text-bg font-semibold"
                        : "glass font-medium text-ink",
                    )}
                  >
                    {on ? `✓ ${symptom.text}` : symptom.text}
                  </button>
                );
              })}
            </div>
            {hasLockedFever && (
              <p className="px-1 text-[13px] text-muted">
                Bật theo nhiệt độ đã nhập.
              </p>
            )}
          </section>
        );
      })}
    </div>
  );
}
```

Ghi chú: React render `aria-pressed` trước `aria-disabled` theo thứ tự prop, khớp regex của test.

- [ ] **Step 4: Sửa `components/triage/TriageScreen.tsx`**

Thay toàn bộ file bằng:

```tsx
"use client";

import { useState } from "react";
import { Call115Button } from "@/components/emergency/CallList";
import { FIELD_INPUT, FIELD_LABEL } from "@/components/quick/styles";
import { Button } from "@/components/ui/Button";
import { Glass } from "@/components/ui/Glass";
import { ListGroup } from "@/components/ui/ListGroup";
import { PageHeader } from "@/components/ui/PageHeader";
import { Switch } from "@/components/ui/Switch";
import { CONDITIONS } from "@/lib/content/conditions";
import { type FirstAid, TRIAGE } from "@/lib/content/triage";
import { useEmergencyContacts } from "@/lib/data/emergency";
import { useRecentLogs } from "@/lib/data/logs";
import { wetDiapersInWindow } from "@/lib/rules/ratings";
import {
  effectiveSymptoms,
  firstAidFor,
  type Suggestion,
  suggestConditions,
  visibleSymptoms,
} from "@/lib/rules/symptoms";
import { ageDays, formatAgeVi } from "@/lib/rules/time";
import {
  evaluateTriage,
  hasFever,
  parseCelsius,
  questionText,
  recentCelsius,
  visibleQuestions,
  type TriageResult as Result,
} from "@/lib/rules/triage";
import type { Baby } from "@/lib/supabase/rows";
import { SymptomChips } from "./SymptomChips";
import { TriageResult } from "./TriageResult";

type Outcome = {
  result: Result;
  suggestions: Suggestion[];
  firstAid: FirstAid[];
};

export function TriageScreen({ baby }: { baby: Baby }) {
  const now = new Date();
  const age = ageDays(baby.dob, now);
  const logs = useRecentLogs(baby.id);
  const contacts = useEmergencyContacts(baby.family_id);
  const logged = recentCelsius(logs.data ?? [], now);
  const [celsius, setCelsius] = useState<string | null>(null);
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [symptoms, setSymptoms] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  // Step 1 (spec gốc §6.6): prefilled from a temperature logged in the last 6 hours, editable.
  const temperature =
    celsius ?? (logged === null ? "" : String(logged).replace(".", ","));
  const parsedNow = parseCelsius(temperature);
  const feverLocked = parsedNow !== "bad" && hasFever(parsedNow);
  const questions = visibleQuestions(TRIAGE.questions, age);
  const chips = visibleSymptoms(TRIAGE.symptoms, age);
  const wet = wetDiapersInWindow(logs.data ?? [], now);
  const diapersLogged = (logs.data ?? []).some(
    (log) =>
      log.type === "diaper" &&
      now.getTime() - Date.parse(log.started_at) <= 24 * 3_600_000,
  );

  function toggle(code: string, on: boolean) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (on) next.add(code);
      else next.delete(code);
      return next;
    });
  }

  function toggleSymptom(code: string) {
    setSymptoms((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  }

  function submit() {
    const parsed = parseCelsius(temperature);
    if (parsed === "bad") {
      setError("Nhiệt độ từ 30 đến 43°C, ví dụ 38,5.");
      return;
    }
    setError(null);
    setOutcome({
      result: evaluateTriage({
        questions: TRIAGE.questions,
        checked,
        celsius: parsed,
        ageDays: age,
      }),
      suggestions: suggestConditions({
        symptoms: TRIAGE.symptoms,
        articles: CONDITIONS.articles,
        selected: effectiveSymptoms(symptoms, parsed),
        ageDays: age,
      }),
      firstAid: firstAidFor({
        blocks: TRIAGE.firstAid,
        checked,
        celsius: parsed,
        ageDays: age,
        questions: TRIAGE.questions,
      }),
    });
    window.scrollTo({ top: 0 });
  }

  return (
    <main className="mx-auto flex max-w-md flex-col gap-[18px] px-4 pt-2 pb-4">
      <PageHeader
        title={TRIAGE.title}
        back={{ href: "/kham-pha", label: "Khám phá" }}
      />
      <p className="px-1 text-[13px] text-muted">{TRIAGE.disclaimer}</p>
      {!outcome && <Call115Button label="Gọi cấp cứu 115" />}
      {outcome ? (
        <TriageResult
          result={outcome.result}
          suggestions={outcome.suggestions}
          firstAid={outcome.firstAid}
          ageDays={age}
          contacts={contacts.data ?? []}
          onRestart={() => {
            setOutcome(null);
            setChecked(new Set());
            setSymptoms(new Set());
            setCelsius(null);
            setError(null);
            window.scrollTo({ top: 0 });
          }}
        />
      ) : (
        <>
          <Glass as="section" className="flex flex-col gap-3 p-4">
            <p className="text-base text-ink">
              Tuổi của bé: <strong>{formatAgeVi(baby.dob, now)}</strong>
            </p>
            <label className="flex flex-col gap-1.5">
              <span className={FIELD_LABEL}>
                Nhiệt độ gần nhất (°C, để trống nếu chưa đo)
              </span>
              <input
                inputMode="decimal"
                className={`${FIELD_INPUT} tabular-nums`}
                value={temperature}
                onChange={(event) => setCelsius(event.target.value)}
              />
            </label>
            {logged !== null && celsius === null && (
              <p className="text-[13px] text-muted">
                Lấy từ nhật ký trong 6 giờ qua.
              </p>
            )}
            {error && (
              <p role="alert" className="text-[15px] text-danger">
                {error}
              </p>
            )}
          </Glass>
          <div className="flex flex-col gap-1 px-1">
            <h2 className="text-xl leading-[26px] font-bold text-ink">
              Bé đang có gì?
            </h2>
            <p className="text-sm text-muted">Chạm để chọn, chọn được nhiều.</p>
          </div>
          <SymptomChips
            groups={TRIAGE.groups}
            symptoms={chips}
            selected={symptoms}
            feverLocked={feverLocked}
            onToggle={toggleSymptom}
          />
          <h2 className="px-1 text-xl leading-[26px] font-bold text-ink">
            Có dấu hiệu nào dưới đây?
          </h2>
          {TRIAGE.groups.map((group) => {
            const list = questions.filter((q) => q.group === group.code);
            if (list.length === 0) return null;
            return (
              <ListGroup key={group.code} title={group.name}>
                {list.map((question) => (
                  <li
                    key={question.code}
                    className="flex min-h-[52px] items-center justify-between gap-3 border-b border-line px-4 py-2 last:border-b-0"
                  >
                    <span className="flex min-w-0 flex-col">
                      <span className="text-base text-ink">
                        {questionText(question, age)}
                      </span>
                      {question.code === "few_wet_diapers" && logs.data && (
                        <span className="text-[13px] text-muted">
                          {diapersLogged
                            ? `Nhật ký ghi ${wet} tã ướt trong 24 giờ qua.`
                            : "Nhật ký chưa ghi tã nào trong 24 giờ qua."}
                        </span>
                      )}
                    </span>
                    <Switch
                      checked={checked.has(question.code)}
                      label={questionText(question, age)}
                      onChange={(on) => toggle(question.code, on)}
                    />
                  </li>
                ))}
              </ListGroup>
            );
          })}
          <Button size="lg" block onClick={submit}>
            Xem kết quả
          </Button>
          <Call115Button label="Gọi cấp cứu 115" />
        </>
      )}
    </main>
  );
}
```

- [ ] **Step 5: Chạy test, thấy xanh**

Run: `bunx vitest run components/triage lib/themeGuard.test.ts && bun run typecheck`
Expected: PASS toàn bộ; số `role="switch"` vẫn bằng số câu hỏi nhìn thấy; typecheck không lỗi.

Nếu `Switch` của dự án có render `aria-pressed` (làm số khớp sai), dừng lại: mở `components/ui/Switch.tsx` và báo trong mục "Kết quả Task 6". Theo code hiện tại, `Switch` dùng `role="switch"` và `aria-checked`, không có `aria-pressed`.

- [ ] **Step 6: Commit**

```bash
git add components/triage
git commit -m "feat(triage): pick common symptoms as chips before the danger signs

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: Checklist thiết bị, kiểm toàn bộ, kiểm tay

**Files:**

- Modify: `docs/device-checklist.md` (thêm bước 35 ở cuối)
- Modify: `docs/blueprint/plans/2026-11-17-kim-bun-trieu-chung-m2.md` (mục kết quả)

**Interfaces:**

- Consumes: mọi task trước.
- Produces: không có.

- [ ] **Step 1: Thêm bước 35 vào checklist**

Thêm vào cuối `docs/device-checklist.md`:

```markdown
## Bước 35 — Popup đóng mượt và phân loại triệu chứng (spec 2026-11-17 trieu-chung §3, §8)

1. Trang chủ, bấm "+" để mở "Ghi lại cho {tên bé}", rồi đóng bằng nút ✕. Mở lại, đóng bằng chạm vào nền tối. Kỳ vọng: bảng trượt hết xuống dưới đáy màn hình, nền tối mờ dần cùng lúc, không có cú nhảy hay chớp ở cuối. Không bấm ô nào trong lưới.
2. Khám phá → Triệu chứng ở bề ngang điện thoại. Kỳ vọng: các chip triệu chứng xuống dòng, không có thanh cuộn ngang ở màn nhập.
3. Nhập 38,2; chọn "Sổ mũi, nghẹt mũi, hắt hơi" và "Dụi, kéo tai, quấy hơn khi nằm"; không bật công tắc nào; bấm "Xem kết quả". Kỳ vọng theo tuổi bé:
   - dưới 90 ngày: thẻ đỏ "Bé dưới 3 tháng sốt từ 38°C trở lên", khối "Nếu bé đang sốt", "Trên đường đi"; tab: Cảm lạnh, Viêm tai giữa, Sổ mũi, Sốt, Tay chân miệng, Croup;
   - đúng 90 ngày: như trên, có thêm Mọc răng ngay sau Sổ mũi;
   - 91–182 ngày: thẻ vàng, thẻ "Trong lúc chờ đi khám" có khối sốt; tab: Cảm lạnh, Viêm tai giữa, Sổ mũi, Mọc răng, Sốt, (từ 150 ngày: Sốt phát ban), Tay chân miệng, Croup;
   - từ 183 ngày: thẻ xanh "Theo dõi tại nhà", thẻ "Làm ngay tại nhà" có khối sốt; tab như dòng trên.
4. Chạm từng tab. Kỳ vọng: nội dung bên dưới đổi theo; thanh tab cuộn ngang được.
5. Bấm "Làm lại". Kỳ vọng: chip, công tắc và nhiệt độ về như lúc mới vào.

Kết quả: Chờ người dùng.

| Máy           | iOS | Kết quả | Ghi chú |
| ------------- | --- | ------- | ------- |
| iPhone 11     |     |         |         |
| iPhone 16     |     |         |         |
| iPhone 17 Pro |     |         |         |
```

- [ ] **Step 2: Chạy toàn bộ test và typecheck**

Run: `bun run test && bun run typecheck`
Expected: PASS. Số test ≥ 935 (909 baseline + 16 của M1 + 10 của M2: 5 `ConditionTabs`, 3 `TriageResult`, 2 `SymptomChips`), 0 fail; typecheck không lỗi.

- [ ] **Step 3: Build**

Run: `bun run build` (nếu lần đầu thoát vì thông báo bảo mật của Next, chạy lại lần hai)
Expected: build xong, `public/content: …conditions.vi.json, …triage.vi.json…` có trong log prebuild, route `/trieu-chung` có trong bảng route.

- [ ] **Step 4: Kiểm tay trên trình duyệt (cần người dùng đồng ý)**

Hỏi người dùng có cho mở trình duyệt có sẵn trong app Claude ở 375×812 không. Nếu đồng ý:

1. `bun run dev` (chạy lại nếu lần đầu thoát).
2. Mở `http://localhost:3000/trieu-chung`. Kỳ vọng: không có thanh cuộn ngang (`document.documentElement.scrollWidth <= 375`); chip xuống dòng.
3. Làm đúng mục 3 và 4 của bước 35 ở trên, với tuổi bé thật. So tab với dòng tương ứng.
4. Mở trang chủ, bấm "+", đóng bằng ✕. Chụp màn hình giữa lúc đóng nếu được. Không bấm ô nào trong lưới.

Nếu người dùng không đồng ý: ghi "Kiểm tay: chưa làm, chờ người dùng" vào mục kết quả.

- [ ] **Step 5: Ghi kết quả và commit**

Thêm vào cuối plan này mục `## Kết quả` gồm: số test cuối, kết quả build, kết quả kiểm tay.

```bash
git add docs/device-checklist.md docs/blueprint/plans/2026-11-17-kim-bun-trieu-chung-m2.md
git commit -m "docs(checklist): step 35 for the symptom triage and popup close

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

Không push. Báo người dùng tên nhánh và hỏi có push hoặc merge vào `main` không.
