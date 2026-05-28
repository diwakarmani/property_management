type Listener = (active: boolean) => void;

let count = 0;
const listeners = new Set<Listener>();

const notify = () => {
  const active = count > 0;
  listeners.forEach((fn) => fn(active));
};

export const requestTracker = {
  show() {
    count++;
    notify();
  },
  hide() {
    count = Math.max(0, count - 1);
    notify();
  },
  subscribe(fn: Listener): () => void {
    listeners.add(fn);
    fn(count > 0);
    return () => listeners.delete(fn);
  },
};
