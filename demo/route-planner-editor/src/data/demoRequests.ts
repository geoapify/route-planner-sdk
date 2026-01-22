export type DemoTaskMeta = {
  id: string;
  filename: string;
  label: string;
  description: string;
};

export const demoTaskMap: Record<string, DemoTaskMeta> = {
  "simple-delivery-berlin": {
    id: "simple-delivery-berlin",
    filename: "simple-delivery-berlin.json",
    label: "Simple Delivery Berlin",
    description: "Single-agent delivery loop in Berlin."
  },
  "salesman-with-time-frames": {
    id: "salesman-with-time-frames",
    filename: "salesman-with-time-frames.json",
    label: "Salesman With Time Frames",
    description: "Time-windowed stops for a single salesman."
  },
  "pickups-and-delivery-paris": {
    id: "pickups-and-delivery-paris",
    filename: "pickups-and-delivery-paris.json",
    label: "Pickups And Delivery Paris",
    description: "Pickup and delivery pairs across Paris."
  },
  "bulky-items-houston": {
    id: "bulky-items-houston",
    filename: "bulky-items-houston.json",
    label: "Bulky Items Houston",
    description: "Capacity-aware bulky delivery set in Houston."
  }
};

export const demoTasks = Object.values(demoTaskMap);

export function getTaskById(id: string): DemoTaskMeta | undefined {
  return demoTaskMap[id];
}

export async function loadTaskInput(task: DemoTaskMeta): Promise<any> {
  const url = new URL(`./${task.filename}`, import.meta.url);
  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`Failed to load ${task.filename}`);
  }
  return response.json();
}
