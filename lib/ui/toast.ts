export const TOAST_MS = 5000;

export type ToastAction = { label: string; onAction: () => void };
export type ToastItem = { id: number; message: string; action?: ToastAction };
export type ToastState = { nextId: number; current: ToastItem | null };
export type ToastEvent =
  | { type: "show"; message: string; action?: ToastAction }
  | { type: "dismiss"; id: number };

export const INITIAL_TOAST: ToastState = { nextId: 1, current: null };

export function toastReducer(state: ToastState, event: ToastEvent): ToastState {
  if (event.type === "show")
    return {
      nextId: state.nextId + 1,
      current: {
        id: state.nextId,
        message: event.message,
        action: event.action,
      },
    };
  return state.current?.id === event.id ? { ...state, current: null } : state;
}
