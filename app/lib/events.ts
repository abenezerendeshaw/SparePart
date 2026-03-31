type Listener = (...args: any[]) => void;

const listeners: Record<string, Set<Listener>> = {};

export default {
  on(event: string, fn: Listener) {
    if (!listeners[event]) listeners[event] = new Set();
    listeners[event].add(fn);
  },
  off(event: string, fn: Listener) {
    listeners[event]?.delete(fn);
  },
  emit(event: string, ...args: any[]) {
    listeners[event]?.forEach((fn) => {
      try {
        fn(...args);
      } catch (e) {
        // ignore
      }
    });
  },
};
