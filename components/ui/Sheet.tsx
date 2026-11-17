"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import type { CategoryToken } from "@/lib/ui/categories";
import { cx } from "@/lib/ui/cx";
import type { IconName } from "@/lib/ui/icons";
import { closeStep, dragOffset, shouldDismissDrag } from "@/lib/ui/sheet";
import { Button } from "./Button";
import { Icon } from "./Icon";
import { IconButton } from "./IconButton";

export type SheetVariant = "bottom" | "floating";

const CHIP: Record<CategoryToken, string> = {
  "cat-feed": "bg-cat-feed/15 text-cat-feed",
  "cat-bottle": "bg-cat-bottle/15 text-cat-bottle",
  "cat-sleep": "bg-cat-sleep/15 text-cat-sleep",
  "cat-diaper": "bg-cat-diaper/15 text-cat-diaper",
  "cat-pump": "bg-cat-pump/15 text-cat-pump",
  "cat-tummy": "bg-cat-tummy/15 text-cat-tummy",
  "cat-med": "bg-cat-med/15 text-cat-med",
  "cat-temp": "bg-cat-temp/15 text-cat-temp",
};

const BOTTOM_PAD = "pb-[calc(20px+env(safe-area-inset-bottom))]";

// showModal() focuses the first [autofocus] element. React's autoFocus prop only calls
// focus() on mount and never writes the attribute, so it is set here.
export function markAutofocus(element: HTMLElement | null) {
  element?.setAttribute("autofocus", "");
}

export function Sheet({
  open,
  onClose,
  title,
  icon,
  iconColor,
  dirty = false,
  footer,
  variant = "bottom",
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  icon?: IconName;
  iconColor?: CategoryToken;
  dirty?: boolean;
  footer?: ReactNode;
  variant?: SheetVariant;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [confirming, setConfirming] = useState(false);
  const [closing, setClosing] = useState(false);
  const [drag, setDrag] = useState<{ startY: number; dy: number } | null>(null);
  // A tap on the scrim closes the sheet; a text selection released over it does not.
  const downOnScrim = useRef(false);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      setConfirming(false);
      setClosing(false);
      dialog.showModal();
    }
    if (!open && dialog.open) dialog.close();
  }, [open]);

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

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      data-closing={closing ? "" : undefined}
      onCancel={(event) => {
        event.preventDefault();
        requestClose();
      }}
      onClose={() => {
        // The browser can close the dialog itself (e.g. a second Esc on Android Chrome):
        // tell the parent so `open` does not stay true and block the next open.
        setConfirming(false);
        setClosing(false);
        if (open) onClose();
      }}
      onPointerDown={(event) => {
        downOnScrim.current = event.target === event.currentTarget;
      }}
      onClick={(event) => {
        if (downOnScrim.current && event.target === event.currentTarget)
          requestClose();
        downOnScrim.current = false;
      }}
      className="m-0 h-dvh max-h-none w-full max-w-none flex-col justify-end bg-transparent p-2 text-ink backdrop:animate-[kb-fade-in_200ms_ease-out] backdrop:bg-scrim open:flex"
    >
      {/* Without this, showModal() focuses the close button while the panel is still below
          the screen, and iOS Safari scrolls up to it: the sheet shows at the top, then drops. */}
      <span
        ref={markAutofocus}
        tabIndex={-1}
        className="fixed top-0 left-0 size-px outline-none"
      />
      <div
        onAnimationEnd={(event) => {
          // `closing` stays set until the dialog's close event, so the scrim keeps
          // fading instead of restarting kb-fade-in for one frame (spec 2026-11-17 §3).
          if (closing && event.target === event.currentTarget) onClose();
        }}
        style={{
          // The gap under the panel: p-2 for both, plus mb-24 for the floating one.
          ["--kb-sheet-gap" as string]: variant === "bottom" ? "8px" : "104px",
          ...(drag && drag.dy > 0
            ? { transform: `translateY(${dragOffset(drag.dy)}px)` }
            : {}),
        }}
        className={cx(
          "glass-strong mx-auto flex w-full max-w-md flex-col shadow-[0_-10px_40px_rgb(0_0_0/0.18)] will-change-transform",
          variant === "bottom"
            ? "max-h-[88dvh] rounded-[38px]"
            : "mb-24 max-h-[80dvh] rounded-[34px]",
          closing
            ? "animate-[kb-sheet-out_280ms_cubic-bezier(0.32,0.72,0,1)_forwards]"
            : "animate-[kb-sheet-in_280ms_cubic-bezier(0.32,0.72,0,1)]",
        )}
      >
        {variant === "bottom" && (
          <div
            data-sheet-handle
            className="flex cursor-grab touch-none justify-center pt-2.5 pb-1"
            onPointerDown={(event) => {
              if (confirming) return;
              event.currentTarget.setPointerCapture(event.pointerId);
              setDrag({ startY: event.clientY, dy: 0 });
            }}
            onPointerMove={(event) => {
              if (drag)
                setDrag({
                  startY: drag.startY,
                  dy: event.clientY - drag.startY,
                });
            }}
            onPointerUp={() => {
              if (drag && shouldDismissDrag(drag.dy)) requestClose();
              setDrag(null);
            }}
            onPointerCancel={() => setDrag(null)}
          >
            <span className="h-[5px] w-9 rounded-full bg-muted/40" />
          </div>
        )}
        <header className="flex items-center justify-between gap-3 px-5 pt-3 pb-2">
          <div className="flex min-w-0 items-center gap-2.5">
            {icon && iconColor && (
              <span
                className={cx(
                  "flex size-9 shrink-0 items-center justify-center rounded-full",
                  CHIP[iconColor],
                )}
              >
                <Icon name={icon} size={18} strokeWidth={2.2} />
              </span>
            )}
            <h2 id={titleId} className="text-[22px] leading-7 font-bold">
              {title}
            </h2>
          </div>
          <IconButton
            label="Đóng"
            icon="close"
            small
            variant="plain"
            className="bg-muted/15"
            onClick={requestClose}
          />
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-3">
          {children}
        </div>
        {footer ? (
          <div className={cx("px-5 pt-2", BOTTOM_PAD)}>{footer}</div>
        ) : null}
      </div>
      {confirming && (
        <DiscardConfirm
          onDiscard={() => {
            setConfirming(false);
            setClosing(true);
          }}
          onKeep={() => setConfirming(false)}
        />
      )}
    </dialog>
  );
}

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
