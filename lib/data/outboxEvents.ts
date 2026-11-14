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
