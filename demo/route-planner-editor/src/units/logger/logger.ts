export type DemoLogEntry = {
  timestamp: number;
  method: string;
  detail?: string;
  level?: "info" | "error";
};

export type DemoLogger = {
  log: (entry: Omit<DemoLogEntry, "timestamp">) => void;
  clear: () => void;
  subscribe: (listener: (entries: DemoLogEntry[]) => void) => () => void;
  getEntries: () => DemoLogEntry[];
};

export function createLogger(): DemoLogger {
  let entries: DemoLogEntry[] = [];
  const listeners = new Set<(entries: DemoLogEntry[]) => void>();

  const notify = () => listeners.forEach((listener) => listener(entries));

  return {
    log(entry) {
      entries = [{ timestamp: Date.now(), ...entry }, ...entries];
      notify();
    },
    clear() {
      entries = [];
      notify();
    },
    subscribe(listener) {
      listeners.add(listener);
      listener(entries);
      return () => listeners.delete(listener);
    },
    getEntries() {
      return entries;
    }
  };
}

export function bindLoggerPanel(
  container: HTMLElement,
  clearButton: HTMLButtonElement,
  copyButton: HTMLButtonElement | null,
  logger: DemoLogger
) {
  clearButton.addEventListener("click", () => logger.clear());

  if (copyButton && navigator.clipboard) {
    copyButton.addEventListener("click", async () => {
      const text = logger
        .getEntries()
        .map((entry) => {
          const detail = entry.detail ? ` - ${entry.detail}` : "";
          return `${formatTime(entry.timestamp)} | ${entry.method}${detail}`;
        })
        .join("\n");
      try {
        await navigator.clipboard.writeText(text);
        copyButton.textContent = "Copied";
        setTimeout(() => {
          copyButton.textContent = "Copy";
        }, 1200);
      } catch (error) {
        console.warn("Clipboard copy failed", error);
      }
    });
  } else if (copyButton) {
    copyButton.disabled = true;
    copyButton.title = "Clipboard unavailable";
  }

  logger.subscribe((entries) => {
    if (entries.length === 0) {
      container.innerHTML =
        '<div class="log__entry">No calls yet. Load a task to begin.</div>';
      return;
    }

    container.innerHTML = entries
      .map((entry) => {
        const detail = entry.detail ? ` - ${entry.detail}` : "";
        const levelClass = entry.level === "error" ? " log__entry--error" : "";
        return `
          <div class="log__entry${levelClass}">
            <span class="log__timestamp">${formatTime(entry.timestamp)}</span>
            <span class="log__message">${entry.method}${detail}</span>
          </div>
        `;
      })
      .join("");
  });
}

const formatTime = (timestamp: number) =>
  new Date(timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });
