# Kim Bun — M1 Popup "Bỏ thay đổi?" giữa màn hình Implementation Plan

Steps use checkbox (`- [ ]`) syntax for tracking.

**Spec:** `docs/blueprint/specs/2026-11-15-kim-bun-hong-diu-thuoc-popup-design.md` (§5, §6)

**Status:** approved 2026-11-15

**Goal:** Khi sheet có thay đổi chưa lưu mà người dùng đóng nó, bàn phím tắt trước, rồi hộp thoại "Bỏ thay đổi?" hiện giữa màn hình trên nền tối. Không để popup nằm ở đáy sheet, chỗ bàn phím iPhone che mất.

**Architecture:**

- `lib/ui/sheet.ts` có thêm hàm thuần `closeStep(dirty, confirming)`. Hàm này quyết định một lần đóng sẽ đóng sheet, hỏi lại, hay huỷ việc hỏi.
- `components/ui/Sheet.tsx` có thêm component `DiscardConfirm`, export ra ngoài:
  - Gồm lớp tối phủ toàn màn hình và hộp `alertdialog` ở giữa.
  - `Sheet` vẽ nó bên trong `<dialog>`, ngay sau panel, nên nó luôn nằm trong top layer.
- Nhánh `confirming ? … : footer` ở đáy panel bị xoá, nút Lưu luôn còn.
- `app/globals.css` có thêm keyframe `kb-pop-in`.

**Tech Stack:** Next.js 16.4.3, React 19.3.1, TypeScript 5.9 `strict`, Tailwind CSS 4.3.3, Vitest (`react-dom/server`, môi trường `node`), Bun. Không thêm gói nào.

**Nhánh:** `feat/kim-bun-hong-diu-m1`, cắt từ `main` (HEAD `8648a1d`). Baseline: 662 test xanh.

**Các mốc của spec này:**

| Mốc               | Nội dung                                     |
| ----------------- | -------------------------------------------- |
| **M1 (plan này)** | §5 popup giữa màn hình                       |
| M2                | §4 chip thuốc, đơn vị gói/ống, Segmented 2–6 |
| M3                | §3 bốn nền sáng (Hồng dịu, Đào mơ, Oải hương, Biển sương), checklist bước 30         |

**Quyết định cho chỗ spec chưa nói rõ:**

- **Lớp tối dùng `bg-black/40`, không dùng `bg-black/35` như spec ghi.** `lib/themeGuard.test.ts` chặn mọi class bảng màu Tailwind trong `.tsx`, chỉ cho phép đúng `bg-black/40`. Tối hơn 5 % so với spec, không ảnh hưởng cảm giác.
- **Tiêu đề hộp thoại là `<h3>`**, vì `<h2>` đã là tiêu đề của sheet.
- **Focus đặt vào "Tiếp tục nhập"** bằng `querySelector("[data-keep]")` trong `useEffect`. Lý do: `Button` không nhận `ref` trong type props.
- **Bấm "Tiếp tục nhập" thì không focus lại ô nhập** (spec §5.1). Người dùng tự chạm vào ô nếu muốn gõ tiếp.
- **Hành vi đóng/hỏi được kiểm bằng hàm thuần `closeStep`**, vì `confirming` là state nội bộ và test SSR không bao giờ thấy được. Phần còn lại (blur bàn phím, Esc) kiểm trong Chrome (Claude in Chrome).

## Global Constraints

- Ngôn ngữ giao diện: chỉ tiếng Việt (`vi-VN`).
- Phiên bản giữ như `package.json`: `next` 16.4.3, `react` 19.3.1, `tailwindcss` 4.3.3. Bun 1.x. TypeScript `strict: true`.
- **Không thêm thư viện nào.** Không tải font web. Không dùng emoji làm icon.
- **Màu:**
  - Mọi màu chỉ đặt trong `app/globals.css` và `lib/ui/tokens.ts`.
  - Ngoại lệ, đúng như spec: lớp tối và bóng `rgb(0 0 0/0.3)` của hộp thoại, và `#E9DBDB` trong `public/manifest.webmanifest`.
  - `lib/themeGuard.test.ts` phải xanh.
- Vùng chạm tối thiểu 44×44 pt. Không thêm `env(safe-area-inset-*)` trong màn hình (`body` đã lo).
- Không lồng `glass` trong `glass` nếu chưa có quy tắc tắt blur (hotfix `7822c90` giữ nguyên).
- Giữ cơ chế `markAutofocus` ở đầu `<dialog>` (fix `8648a1d`), không đụng.
- Không đổi khoá localStorage `be-yeu-*`, tên package, URL `bunkid.vercel.app`.
- **Dev dùng chung Supabase thật của gia đình.** Khi kiểm tay chỉ được mở sheet, gõ, rồi đóng. Không bấm "Lưu", không bắt đầu timer.
- Bước checklist cần iPhone thật ghi "Chờ người dùng", không tự đánh "Đạt".
- Trước khi dùng API mới của Next/React, đọc docs trong `node_modules/next/dist/docs/` (AGENTS.md).
- Các đoạn "thay X bằng Y" có thể bị formatter làm lệch thụt lề: so khớp theo nội dung từng dòng, **bỏ qua thụt lề**.

## Contracts with Other Plans

**Consumes** (đã có trên `main`): `components/ui/Button.tsx` (`Button`, variant `danger` / `secondary`, prop `block`), `components/ui/Sheet.tsx` (`Sheet`, `markAutofocus`), `lib/ui/sheet.ts` (`dragOffset`, `shouldDismissDrag`).

**Produces** (M2 và M3 không dùng trực tiếp; ghi lại cho đủ):

- `lib/ui/sheet.ts`: `export type CloseStep = "close" | "confirm" | "keep"`; `export function closeStep(dirty: boolean, confirming: boolean): CloseStep`.
- `components/ui/Sheet.tsx`: `export function DiscardConfirm({ onDiscard, onKeep }: { onDiscard: () => void; onKeep: () => void })`.
- `app/globals.css`: `@keyframes kb-pop-in`.

---

### Task 1: Hộp thoại `DiscardConfirm` và hàm `closeStep`

**Files:**

- Modify: `lib/ui/sheet.ts` (thêm cuối file), `lib/ui/sheet.test.ts` (thêm 1 `describe`)
- Modify: `components/ui/Sheet.tsx` (thêm component mới ở cuối file), `components/ui/sheet.test.tsx` (thêm 1 `describe`)
- Modify: `app/globals.css` (thêm keyframe ngay sau `@keyframes kb-fade-in`)

**Interfaces:**

- Consumes: `Button`.
- Produces: `closeStep`, `CloseStep`, `DiscardConfirm`, `kb-pop-in`.

- [ ] **Step 1: Viết test hỏng cho `closeStep`**

Thêm vào cuối `lib/ui/sheet.test.ts`, và đổi dòng import đầu file thành:

```ts
import {
  closeStep,
  dragOffset,
  SHEET_DRAG_CLOSE_PX,
  shouldDismissDrag,
} from "./sheet";
```

```ts
describe("closeStep", () => {
  it("closes straight away when nothing was typed", () => {
    expect(closeStep(false, false)).toBe("close");
  });

  it("asks first when there is unsaved input", () => {
    expect(closeStep(true, false)).toBe("confirm");
  });

  it("a second close request while asking keeps the sheet (Esc = Tiếp tục nhập)", () => {
    expect(closeStep(true, true)).toBe("keep");
    expect(closeStep(false, true)).toBe("keep");
  });
});
```

- [ ] **Step 2: Viết test hỏng cho `DiscardConfirm`**

Trong `components/ui/sheet.test.tsx`, đổi dòng import `./Sheet` thành:

```tsx
import { DiscardConfirm, markAutofocus, Sheet } from "./Sheet";
```

Thêm vào cuối file:

```tsx
describe("DiscardConfirm", () => {
  const html = renderToStaticMarkup(
    <DiscardConfirm onDiscard={noop} onKeep={noop} />,
  );

  it("is a modal alert dialog labelled by its title and described by its line", () => {
    expect(html).toContain('role="alertdialog"');
    expect(html).toContain('aria-modal="true"');
    const labelledBy = /aria-labelledby="([^"]+)"/.exec(html)?.[1];
    const describedBy = /aria-describedby="([^"]+)"/.exec(html)?.[1];
    expect(labelledBy).toBeTruthy();
    expect(describedBy).toBeTruthy();
    expect(html).toContain(`id="${labelledBy}"`);
    expect(html).toContain(`id="${describedBy}"`);
    expect(html).toMatch(/<h3[^>]*>Bỏ thay đổi\?<\/h3>/);
    expect(html).toContain(">Những gì vừa nhập sẽ không được lưu.</p>");
  });

  it("puts Bỏ thay đổi (danger) above Tiếp tục nhập (secondary)", () => {
    const discard = html.indexOf(">Bỏ thay đổi</button>");
    const keep = html.indexOf(">Tiếp tục nhập</button>");
    expect(discard).toBeGreaterThan(-1);
    expect(keep).toBeGreaterThan(discard);
    expect(html).toContain("bg-danger-solid text-on-danger");
    expect(html).toContain("data-keep");
  });

  it("sits in the middle of a dimmed full-screen layer, solid so iOS cannot paint it white", () => {
    expect(html).toContain(
      "fixed inset-0 z-10 flex items-center justify-center bg-black/40 p-6",
    );
    expect(html).toContain("animate-[kb-fade-in_180ms_ease-out]");
    expect(html).toContain("max-w-[300px]");
    expect(html).toContain("rounded-[28px] bg-glass-solid");
    expect(html).toContain(
      "animate-[kb-pop-in_180ms_cubic-bezier(0.32,0.72,0,1)]",
    );
    expect(html).not.toContain("glass-strong");
  });
});
```

- [ ] **Step 3: Chạy test để thấy hỏng**

Run: `bun run test lib/ui/sheet.test.ts components/ui/sheet.test.tsx`
Expected: FAIL. `closeStep` và `DiscardConfirm` chưa được export.

- [ ] **Step 4: Viết `closeStep`**

Thêm vào cuối `lib/ui/sheet.ts`:

```ts
export type CloseStep = "close" | "confirm" | "keep";

// Spec §5.1: every way of closing a sheet asks this first.
// While the discard dialog is up, another close request (Esc) means "Tiếp tục nhập".
export function closeStep(dirty: boolean, confirming: boolean): CloseStep {
  if (confirming) return "keep";
  return dirty ? "confirm" : "close";
}
```

- [ ] **Step 5: Viết `DiscardConfirm`**

`components/ui/Sheet.tsx` đã import sẵn `useEffect, useId, useRef, useState, type ReactNode` từ `react` (dòng 3), nên không phải sửa import. Thêm vào cuối file:

```tsx
// Spec §5.2: centred, solid and above the keyboard-free sheet, so it cannot be missed.
export function DiscardConfirm({
  onDiscard,
  onKeep,
}: {
  onDiscard: () => void;
  onKeep: () => void;
}) {
  const titleId = useId();
  const bodyId = useId();
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    box.current
      ?.querySelector<HTMLButtonElement>("[data-keep]")
      ?.focus({ preventScroll: true });
  }, []);

  return (
    <div
      className="fixed inset-0 z-10 flex items-center justify-center bg-black/40 p-6 animate-[kb-fade-in_180ms_ease-out]"
      onClick={(event) => {
        if (event.target === event.currentTarget) onKeep();
      }}
    >
      <div
        ref={box}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={bodyId}
        className="w-full max-w-[300px] rounded-[28px] bg-glass-solid p-[22px_18px_16px] text-center shadow-[0_20px_60px_rgb(0_0_0/0.3)] animate-[kb-pop-in_180ms_cubic-bezier(0.32,0.72,0,1)]"
      >
        <h3 id={titleId} className="text-[19px] leading-6 font-bold text-ink">
          Bỏ thay đổi?
        </h3>
        <p id={bodyId} className="mt-2 text-[15px] leading-5 text-muted">
          Những gì vừa nhập sẽ không được lưu.
        </p>
        <div className="mt-4 flex flex-col gap-2">
          <Button variant="danger" block onClick={onDiscard}>
            Bỏ thay đổi
          </Button>
          <Button variant="secondary" block data-keep onClick={onKeep}>
            Tiếp tục nhập
          </Button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Thêm keyframe `kb-pop-in`**

Trong `app/globals.css`, ngay sau khối `@keyframes kb-fade-in { … }`, thêm:

```css
@keyframes kb-pop-in {
  from {
    opacity: 0;
    transform: scale(0.94);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
```

Khối `@media (prefers-reduced-motion: reduce)` có sẵn trong file đã rút mọi animation xuống 0.01ms, nên không cần thêm gì cho giảm chuyển động.

- [ ] **Step 7: Chạy test để thấy xanh**

Run: `bun run test lib/ui/sheet.test.ts components/ui/sheet.test.tsx lib/themeGuard.test.ts`
Expected: PASS hết. `themeGuard` xanh vì `bg-black/40` nằm trong danh sách cho phép.

- [ ] **Step 8: Commit**

```bash
git add lib/ui/sheet.ts lib/ui/sheet.test.ts components/ui/Sheet.tsx components/ui/sheet.test.tsx app/globals.css
git commit -m "feat(ui): centred discard dialog and the close-step rule"
```

---

### Task 2: `Sheet` dùng hộp thoại giữa màn hình và tắt bàn phím trước

**Files:**

- Modify: `components/ui/Sheet.tsx` (import, hàm `requestClose`, tay cầm kéo, nhánh confirm ở đáy panel)
- Modify: `components/ui/sheet.test.tsx` (thêm 1 test vào `describe("Sheet")`)

**Interfaces:**

- Consumes: `closeStep` (Task 1), `DiscardConfirm` (Task 1).
- Produces: không có API mới. `Sheet` giữ nguyên props.

- [ ] **Step 1: Viết test hỏng**

Thêm vào trong `describe("Sheet", …)` của `components/ui/sheet.test.tsx`:

```tsx
it("keeps the footer for a dirty sheet and no longer draws the old bottom confirm", () => {
  const html = renderToStaticMarkup(
    <Sheet
      open
      dirty
      title="Cho uống thuốc"
      onClose={noop}
      footer={<button>Lưu</button>}
    >
      <p>Thân</p>
    </Sheet>,
  );
  expect(html).toContain(">Lưu</button>");
  expect(html).not.toContain('role="alertdialog"');
  expect(html).not.toContain(">Bỏ</button>");
});
```

Test này chỉ khoá trạng thái ban đầu. Nó xanh cả trước khi sửa. Phần chống hồi quy thật nằm ở Step 3: đọc diff để chắc nhánh `confirming ? … : footer` đã mất.

- [ ] **Step 2: Chạy test**

Run: `bun run test components/ui/sheet.test.tsx`
Expected: PASS (test khoá trạng thái thường).

- [ ] **Step 3: Sửa `Sheet`**

Trong `components/ui/Sheet.tsx`:

1. Đổi dòng import từ `@/lib/ui/sheet` thành:

```tsx
import { closeStep, dragOffset, shouldDismissDrag } from "@/lib/ui/sheet";
```

2. Thay cả hàm `requestClose` bằng:

```tsx
// Every way of closing goes through here; unsaved input asks first (spec §5.1).
function requestClose() {
  const step = closeStep(dirty, confirming);
  if (step === "keep") {
    setConfirming(false);
    return;
  }
  if (step === "confirm") {
    // Drop the iOS keyboard first, or it covers whatever we show next.
    const active = document.activeElement;
    if (active instanceof HTMLElement && ref.current?.contains(active))
      active.blur();
    setConfirming(true);
    return;
  }
  setClosing(true);
}
```

3. Trong `onPointerDown` của tay cầm (`data-sheet-handle`), thêm điều kiện để không kéo được khi đang hỏi. Thay:

```tsx
            onPointerDown={(event) => {
              event.currentTarget.setPointerCapture(event.pointerId);
              setDrag({ startY: event.clientY, dy: 0 });
            }}
```

bằng:

```tsx
            onPointerDown={(event) => {
              if (confirming) return;
              event.currentTarget.setPointerCapture(event.pointerId);
              setDrag({ startY: event.clientY, dy: 0 });
            }}
```

4. Thay cả khối ở đáy panel, ở khoảng `Sheet.tsx:188-212`: bắt đầu bằng dòng `{confirming ? (`, kết thúc bằng dòng `) : null}`. Khối cũ trông như sau (in bằng fence `text` để formatter không chèn thêm dấu `;`):

```text
        {confirming ? (
          <div
            role="alertdialog"
            aria-label="Bỏ thay đổi?"
            className={cx("flex flex-col gap-3 px-5 pt-2", BOTTOM_PAD)}
          >
            <p className="text-center font-semibold">Bỏ thay đổi?</p>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="secondary" onClick={() => setConfirming(false)}>
                Tiếp tục nhập
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  setConfirming(false);
                  setClosing(true);
                }}
              >
                Bỏ
              </Button>
            </div>
          </div>
        ) : footer ? (
          <div className={cx("px-5 pt-2", BOTTOM_PAD)}>{footer}</div>
        ) : null}
```

Thay bằng:

```text
        {footer ? (
          <div className={cx("px-5 pt-2", BOTTOM_PAD)}>{footer}</div>
        ) : null}
```

5. Ngay sau thẻ đóng `</div>` của panel (thẻ `div` có `glass-strong`) và trước `</dialog>`, thêm:

```text
      {confirming && (
        <DiscardConfirm
          onDiscard={() => {
            setConfirming(false);
            setClosing(true);
          }}
          onKeep={() => setConfirming(false)}
        />
      )}
```

Không có dấu `;` nào bên trong cặp `{ … }` của JSX. Nếu thấy dấu đó trong plan thì đó là lỗi formatter, bỏ đi.

Lớp tối của `DiscardConfirm` phủ cả scrim lẫn nút X, nên lúc đang hỏi, chạm ra ngoài hộp chỉ chạy `onKeep`. `onClick` của `<dialog>` vẫn nhận sự kiện nổi bọt lên, nhưng `event.target` khi đó không phải `<dialog>`, nên không có gì xảy ra.

- [ ] **Step 4: Chạy toàn bộ test và typecheck**

Run: `bun run test && bun run typecheck`
Expected: PASS hết, 662 + 7 = **669 test**. Typecheck không lỗi. `Button` vẫn được dùng trong `DiscardConfirm` nên import không thừa.

- [ ] **Step 5: Kiểm trong Chrome (Claude in Chrome, mở tab mới)** (không bấm Lưu)

Chạy dev server (`bun run dev`), mở `http://localhost:3000` trong Chrome (Claude in Chrome) ở 375×812:

1. Bấm "+" → "Thuốc". Gõ "abc" vào "Tên thuốc", rồi bấm nút X. Kỳ vọng:
   - ô nhập mất focus;
   - nền tối phủ cả màn hình, hộp "Bỏ thay đổi?" nằm giữa;
   - "Bỏ thay đổi" ở trên, "Tiếp tục nhập" ở dưới và đang được focus;
   - nút "Lưu" của sheet vẫn còn phía sau.
2. Bấm Esc → hộp tắt, sheet còn nguyên chữ "abc".
3. Bấm X lần nữa, rồi chạm vào vùng tối ngoài hộp → hộp tắt, sheet còn.
4. Bấm X, rồi bấm "Bỏ thay đổi" → sheet trượt xuống và đóng.
5. Mở lại "Thuốc", không gõ gì, bấm X → sheet đóng luôn, không hỏi.
6. Gõ "abc", kéo tay cầm xuống quá 80 px → hộp hiện. Lúc hộp đang mở, kéo tay cầm lần nữa → không có gì xảy ra.
7. Bấm vào mặt trăng ở Trang chủ để bật Ban đêm, rồi lặp lại bước 1. Hộp đọc rõ, màu hổ phách.

Ghi kết quả vào báo cáo cuối. Chrome không tái hiện được bàn phím iPhone; phần đó thuộc checklist bước 30 (M3).

- [ ] **Step 6: Commit**

```bash
git add components/ui/Sheet.tsx components/ui/sheet.test.tsx
git commit -m "fix(ui): discard dialog drops the keyboard and shows in the middle of the screen"
```
