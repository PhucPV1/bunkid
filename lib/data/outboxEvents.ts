type Listener<T> = (value: T) => void;

function channel<T>() {
  const listeners = new Set<Listener<T>>();
  return {
    emit: (value: T) => listeners.forEach((listener) => listener(value)),
    listen: (listener: Listener<T>) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}

// Asks the outbox runner to flush now (after a new write, for example).
export const flushRequests = channel<void>();
// A queued write the server refused for good; the text is shown to the user.
export const droppedWrites = channel<string>();

// The last refused write, kept briefly so a notice raised while SyncBar was not
// on screen (cold start, "Đang tải…") still reaches the user once.
let lastDrop: { reason: string; at: number } | null = null;
droppedWrites.listen((reason) => {
  lastDrop = { reason, at: Date.now() };
});

export function takeRecentDrop(
  now: number = Date.now(),
  withinMs = 60_000,
): string | null {
  const drop = lastDrop;
  lastDrop = null;
  return drop && now - drop.at <= withinMs ? drop.reason : null;
}
