# Geoapify Route Optimization SDK

The **Geoapify Route Optimization SDK** is a lightweight, dependency-free TypeScript library that simplifies building, executing requests, and modifying results for the [Geoapify Route Planner API](https://www.geoapify.com/route-planner-api/).

It helps you easily implement advanced **route optimization** and **delivery planning** in both frontend (browser) and backend (Node.js) environments.

## SDK Overview

| Class | Description | Docs |
|-------|-------------|------|
| **RoutePlanner** | Entry point for the SDK. Handles request construction and execution. | [Read more](./api/route-planner.md) |
| **RoutePlannerResult** | Encapsulates the API response and provides access to raw and structured route data. | [Read more](./api/route-planner-result.md) |
| **RoutePlannerResultEditor** | Utility for modifying planned routes: reassign jobs, remove stops, or re-sequence visits. | [Read more](./api/route-planner-result-editor.md) |
| **RoutePlannerTimeline** | Extracts agent schedules, travel times, idle periods — useful for visualization. | [Read more](./api/route-planner-timeline.md) |


## Quick Start

Install the SDK using npm:

```bash
npm install @geoapify/route-planner-sdk
```

### In TypeScript / Node.js:

```ts
import RoutePlanner, { Agent, Job } from "@geoapify/route-planner-sdk";

const planner = new RoutePlanner({
  apiKey: "YOUR_API_KEY",
});

const solution = await planner
  .setMode("drive")
  .addAgent(new Agent().setId("agent-1").setStartLocation(13.38, 52.52))
  .addJob(new Job().setId("job-1").setLocation(13.39, 52.51))
  .plan();
```

Or initialize using raw data:

```ts
const routePlannerData: RoutePlannerInputData = {
    "mode": "drive",
    "agents": [
      {
        "start_location": [
          13.408979393152407,
          52.5217881
        ],
        "end_location": [
          13.408979393152407,
          52.5217881
        ],
        "time_windows": [
          [
            3600,
            10800
          ]
        ],
        "capabilities": [
          "Cooling system tester",
          "Welding machine"
        ]
      },
      {
        "start_location": [
          13.412346074367065,
          52.5247835
        ],
        "end_location": [
          13.412346074367065,
          52.5247835
        ],
        "time_windows": [
          [
            0,
            7200
          ]
        ],
        "capabilities": [
          "Welding machine",
          "Motor locking tool",
          "Electrician"
        ]
      },
      ...
      }
    ],
    "jobs": [
      {
        "location": [
          13.399061126634654,
          52.5245554
        ],
        "duration": 3600,
        "requirements": [
          "Electrician"
        ]
      },
      {
        "location": [
          13.409279714436334,
          52.52310275
        ],
        "duration": 3600
      },
      {
        "location": [
          13.399706613593082,
          52.52515335
        ],
        "duration": 1800
      },
      {
        "location": [
          13.402211587720586,
          52.523039600000004
        ],
        "duration": 3600,
        "requirements": [
          "Welding machine"
        ]
      },
      ...
    ]
};

const planner = new RoutePlanner({ apiKey: "YOUR_API_KEY" }, routePlannerData);
const solution = await planner.plan();
```

### In HTML (via CDN):

```html
<script src="https://unpkg.com/@geoapify/route-planner-sdk/dist/index.min.js"></script>
<script>
  const planner = new RoutePlannerSDK.RoutePlanner({
    apiKey: "YOUR_API_KEY"
  });
</script>
```

> Get your API key by signing up on [geoapify.com](https://www.geoapify.com)


## Try It Live

Explore the API in an interactive environment using the [Geoapify Route Planner Playground →](https://apidocs.geoapify.com/playground/route-planner/)


