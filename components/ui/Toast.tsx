"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useReducer,
  type ReactNode,
} from "react";
import {
  INITIAL_TOAST,
  TOAST_MS,
  toastReducer,
  type ToastAction,
  type ToastItem,
} from "@/lib/ui/toast";

type ShowToast = (message: string, action?: ToastAction) => void;

const ToastContext = createContext<ShowToast | null>(null);

export function ToastView({
  item,
  onDismiss,
}: {
  item: ToastItem | null;
  onDismiss: (id: number) => void;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-4 bottom-[calc(max(env(safe-area-inset-bottom)+10px,26px)+74px)] z-40 flex justify-center print:hidden"
    >
      {item && (
        <div className="glass-strong pointer-events-auto flex max-w-md items-center gap-3 rounded-full py-1.5 pr-1.5 pl-5 shadow-[0_10px_30px_rgb(0_0_0/0.15)]">
          <span className="text-[15px] font-medium text-ink">
            {item.message}
          </span>
          {item.action && (
            <button
              type="button"
              onClick={() => {
                item.action?.onAction();
                onDismiss(item.id);
              }}
              className="min-h-11 shrink-0 rounded-full px-4 text-[15px] font-semibold text-accent-text"
            >
              {item.action.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(toastReducer, INITIAL_TOAST);
  const show = useCallback<ShowToast>(
    (message, action) => dispatch({ type: "show", message, action }),
    [],
  );
  const current = state.current;
  useEffect(() => {
    if (!current) return;
    const timer = window.setTimeout(
      () => dispatch({ type: "dismiss", id: current.id }),
      TOAST_MS,
    );
    return () => window.clearTimeout(timer);
  }, [current]);
  return (
    <ToastContext.Provider value={show}>
      {children}
      <ToastView
        item={current}
        onDismiss={(id) => dispatch({ type: "dismiss", id })}
      />
    </ToastContext.Provider>
  );
}

export function useToast(): ShowToast {
  const show = useContext(ToastContext);
  if (!show) throw new Error("useToast must be used inside ToastProvider");
  return show;
}
