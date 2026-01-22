export type DemoEventHandler<T> = (payload: T) => void;

export function createEventBus<T extends Record<string, any>>() {
  const handlers = new Map<keyof T, Set<DemoEventHandler<any>>>();

  const on = <K extends keyof T>(event: K, handler: DemoEventHandler<T[K]>) => {
    if (!handlers.has(event)) {
      handlers.set(event, new Set());
    }
    handlers.get(event)!.add(handler as DemoEventHandler<any>);
    return () => handlers.get(event)!.delete(handler as DemoEventHandler<any>);
  };

  const emit = <K extends keyof T>(event: K, payload: T[K]) => {
    const listeners = handlers.get(event);
    if (!listeners) return;
    listeners.forEach((handler) => handler(payload));
  };

  return { on, emit };
}
