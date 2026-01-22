export type DemoRoutePlannerState = {
  planner: any | null;
  result: any | null;
  editor: any | null;
  taskId: string | null;
  hiddenAgentIndexes: number[];
};

export type DemoStoreListener = (state: DemoRoutePlannerState) => void;

export function createStore(initialState: DemoRoutePlannerState) {
  let state = { ...initialState };
  const listeners = new Set<DemoStoreListener>();

  const getState = () => state;

  const setState = (partial: Partial<DemoRoutePlannerState>) => {
    state = { ...state, ...partial };
    listeners.forEach((listener) => listener(state));
  };

  const subscribe = (listener: DemoStoreListener) => {
    listeners.add(listener);
    listener(state);
    return () => listeners.delete(listener);
  };

  return { getState, setState, subscribe };
}
