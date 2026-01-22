import type { DemoTaskMeta } from "../../data/demoRequests";

export function initTaskSelector(
  selectEl: HTMLSelectElement,
  loadButton: HTMLButtonElement,
  tasks: DemoTaskMeta[],
  onLoad: (taskId: string) => void | Promise<void>
) {
  selectEl.innerHTML = tasks
    .map((task) => `<option value="${task.id}">${task.label}</option>`)
    .join("");

  loadButton.addEventListener("click", () => {
    const value = selectEl.value;
    if (!value) return;
    const result = onLoad(value);
    if (result && typeof (result as Promise<void>).finally === "function") {
      loadButton.disabled = true;
      selectEl.disabled = true;
      (result as Promise<void>).finally(() => {
        loadButton.disabled = false;
        selectEl.disabled = false;
      });
    }
  });
}
