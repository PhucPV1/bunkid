"use client";

import {
  type MouseEvent,
  type ReactNode,
  type Ref,
  useEffect,
  useId,
  useRef,
} from "react";
import { Button } from "./Button";

// The dialog without its hooks, so tests can read it as a plain tree.
export function PopupView({
  title,
  titleId,
  onClose,
  dialogRef,
  children,
}: {
  title: string;
  titleId: string;
  onClose: () => void;
  dialogRef?: Ref<HTMLDialogElement>;
  children: ReactNode;
}) {
  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      // Esc closes a modal dialog by itself and fires this event.
      onClose={onClose}
      onClick={(event: MouseEvent<HTMLDialogElement>) => {
        if (event.target === event.currentTarget) onClose();
      }}
      className="fixed inset-0 m-0 hidden h-full max-h-none w-full max-w-none items-center justify-center bg-transparent p-6 backdrop:bg-black/40 open:flex"
    >
      <div className="w-full max-w-[300px] rounded-[28px] bg-glass-solid p-[22px_18px_16px] text-center shadow-[0_20px_60px_rgb(0_0_0/0.3)] animate-[kb-pop-in_180ms_cubic-bezier(0.32,0.72,0,1)]">
        <h2 id={titleId} className="text-[19px] leading-6 font-bold text-ink">
          {title}
        </h2>
        <div className="mt-2 text-[15px] leading-5 text-muted">{children}</div>
        <div className="mt-4 flex flex-col">
          <Button variant="secondary" block onClick={onClose}>
            Đã hiểu
          </Button>
        </div>
      </div>
    </dialog>
  );
}

// Spec 2026-11-25 §5.3: a short explanation in the middle of the screen, in
// the look of the "Bỏ thay đổi?" dialog (spec 2026-11-15 §5.2). Mount it to
// open it; it asks to be unmounted through onClose.
export function Popup({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const dialog = ref.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);
  return (
    <PopupView
      title={title}
      titleId={titleId}
      onClose={onClose}
      dialogRef={ref}
    >
      {children}
    </PopupView>
  );
}
