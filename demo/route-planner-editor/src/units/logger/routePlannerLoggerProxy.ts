import type { DemoLogger } from "./logger";

const extractId = (value: unknown): string | null => {
  if (!value || typeof value !== "object") return null;
  if ("id" in value && typeof (value as { id?: unknown }).id === "string") {
    return (value as { id: string }).id;
  }
  const maybeGetRaw = (value as { getRaw?: () => unknown }).getRaw;
  if (typeof maybeGetRaw === "function") {
    try {
      const raw = maybeGetRaw();
      if (raw && typeof raw === "object") {
        const rawId = (raw as { id?: unknown }).id;
        if (typeof rawId === "string") return rawId;
      }
    } catch {
      return null;
    }
  }
  return null;
};

const summarizeArray = (values: unknown[], label?: string) => {
  if (!Array.isArray(values)) return "";
  const parts = values.slice(0, 3).map((item) => {
    if (typeof item === "string" || typeof item === "number") return String(item);
    const id = extractId(item);
    if (id) return id;
    return "object";
  });
  const tail = values.length > 3 ? `,+${values.length - 3}` : "";
  const prefix = label ? `${label}:` : "";
  return `${prefix}[${parts.join(",")}${tail}]`;
};

const summarizeOptions = (value: unknown) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return "";
  const options = value as Record<string, unknown>;
  const keys = ["strategy", "afterId", "priority", "mode"];
  const picked = keys
    .filter((key) => key in options)
    .map((key) => `${key}=${String(options[key])}`);
  if (picked.length === 0) return "";
  return `opts:${picked.join(",")}`;
};

const summarizeArg = (arg: unknown) => {
  if (arg === undefined) return "undefined";
  if (arg === null) return "null";
  if (typeof arg === "string" || typeof arg === "number") return String(arg);
  if (Array.isArray(arg)) return summarizeArray(arg) || `array(${arg.length})`;
  if (typeof arg === "object") {
    const maybeId = extractId(arg);
    if (maybeId) return `id:${maybeId}`;
    const opts = summarizeOptions(arg);
    return opts ? opts : "object";
  }
  return typeof arg;
};

const summarizeArgsForMethod = (methodName: string, args: unknown[]) => {
  if (args.length === 0) return "";
  switch (methodName) {
    case "assignJobs":
      return [
        `agent:${summarizeArg(args[0])}`,
        summarizeArray(args[1] as unknown[], "jobs"),
        summarizeOptions(args[2])
      ]
        .filter(Boolean)
        .join(" ");
    case "assignShipments":
      return [
        `agent:${summarizeArg(args[0])}`,
        summarizeArray(args[1] as unknown[], "shipments"),
        summarizeOptions(args[2])
      ]
        .filter(Boolean)
        .join(" ");
    case "removeJobs":
      return [
        summarizeArray(args[0] as unknown[], "jobs"),
        summarizeOptions(args[1])
      ]
        .filter(Boolean)
        .join(" ");
    case "removeShipments":
      return [
        summarizeArray(args[0] as unknown[], "shipments"),
        summarizeOptions(args[1])
      ]
        .filter(Boolean)
        .join(" ");
    case "addNewJobs":
      return [
        `agent:${summarizeArg(args[0])}`,
        summarizeArray(args[1] as unknown[], "jobs"),
        summarizeOptions(args[2])
      ]
        .filter(Boolean)
        .join(" ");
    case "addNewShipments":
      return [
        `agent:${summarizeArg(args[0])}`,
        summarizeArray(args[1] as unknown[], "shipments"),
        summarizeOptions(args[2])
      ]
        .filter(Boolean)
        .join(" ");
    default:
      return args.map(summarizeArg).slice(0, 3).join(", ");
  }
};

export function createRoutePlannerLoggerProxy<T extends object>(
  target: T,
  logger: DemoLogger,
  label: string
): T {
  return new Proxy(target, {
    get(obj, prop, receiver) {
      if (prop === "then") {
        return undefined;
      }
      const value = Reflect.get(obj, prop, receiver);
      if (typeof value !== "function") {
        return value;
      }
      return (...args: unknown[]) => {
        logger.log({
          method: `${label}.${String(prop)}`,
          detail: summarizeArgsForMethod(String(prop), args)
        });
        return value.apply(obj, args);
      };
    }
  });
}
