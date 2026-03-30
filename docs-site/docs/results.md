# Route Optimization Result: Conceptual Overview

Once you submit a route planning request, the Geoapify Route Planner API returns a structured plan — not just a route, but a full execution schedule for each agent (driver, worker, or vehicle).

This result helps answer key questions:

* What will each agent do?
* In what order will they visit stops?
* When will they arrive and how long will they stay?
* Are there any unassigned jobs or unresolved constraints?

The SDK processes this output and provides tools to explore, visualize, and modify the result.



## How the Result Is Structured

The result is organized by agent. For each agent, the system provides:

* A **route path** (map line connecting the stops)
* A **sequence of actions** (e.g., pickup, delivery)
* A **timeline** of when each action happens
* A **list of waypoints** where actions occur
* Travel **legs** between waypoints, with distances and durations

It also includes a summary of **issues**, such as unassigned jobs or idle agents.

```
RoutePlannerResult
│
├─ Agent 1
│  ├─ Route path
│  ├─ Waypoints
│  │  ├─ Waypoint 1 → actions + arrival time
│  │  ├─ Waypoint 2 → actions + arrival time
│  │  └─ Waypoint 3 → actions + arrival time
│  ├─ Legs
│  │  ├─ Leg 1 → distance + duration
│  │  └─ Leg 2 → distance + duration
│  └─ Timeline
│
├─ Agent 2
│  └─ ...
│
└─ Unassigned
   ├─ Jobs
   ├─ Shipments
   └─ Agents
```


Think of it as a personalized itinerary for every agent, shaped by all the constraints and optimization logic you provided.

## AgentPlan: Agent Execution Plan

Each agent’s result is encapsulated as an `AgentPlan`. This object describes all activities and movements assigned to the agent, including:

* **Start time**: When their shift or route begins
* **Route geometry**: A visual path between all stops
* **Action list**: Step-by-step tasks like pickups and deliveries
* **Waypoint list**: All physical locations visited
* **Travel segments**: Durations and distances between stops


These components allow you to:

* Plot the route on a map
* Build a timeline view of the day
* Animate movement between tasks
* Track delays or idle time

```
AgentPlan data
│
├── routeGeometry ───────→ Map visualization
│
├── waypoints + actions ─→ Stop list / itinerary
│
├── timeline ────────────→ Daily schedule view
│
├── legs ────────────────→ Distance & duration analysis
│
└── all combined ────────→ Animation / simulation
```

## Relationship Between Waypoints, Legs, and Actions

A route is built from three interconnected elements: waypoints, legs, and actions:

* Waypoints represent fixed locations where the agent stops
* Legs represent movement between two waypoints
* Actions represent work performed either at a waypoint or during travel

```
[Waypoint A | 09:00]
  actions: start
      │
      ├─ Leg 1 (5 km, 10 min)
      │     actions: break (5 min)
      ▼
[Waypoint B | 09:30]
  actions: pickup, job
      │
      ├─ Leg 2 (8 km, 15 min)
      │     actions: delay (traffic)
      ▼
[Waypoint C | 10:15]
  actions: delivery
      │
      ├─ Leg 3 (3 km, 7 min)
      ▼
[Waypoint D | 10:30]
  actions: end
```

### Waypoints (stops on map)

Waypoints represent physical route stops:

* Location (coordinates)
* Planned start time at that stop
* Total stop duration
* Actions executed at that location

Use waypoints for:

* map markers
* stop lists
* ETA/stop cards

#### Waypoint list Example

| Waypoint | Start Time | Duration | Actions at Waypoint | UX Meaning |
|---|---|---|---|---|
| `0` | `08:00` | `0m` | `start` | Depot/start marker |
| `1` | `08:12` | `10m` | `pickup`, `job` | Customer stop with multiple tasks |
| `2` | `08:34` | `4m` | `delivery` | Next customer stop |

### Actions (events on timeline)

Actions represent events in time:

* `start`, `job`, `pickup`, `delivery`, `end`
* plus `break` and `delay` events

Actions can be:

* attached to a waypoint via `waypoint_index`
* between waypoints (for example, timeline-level `break` / `delay` events)

Use actions for:

* timeline view
* workload/order of tasks
* detailed operational logs

#### Action List Example

| Action | Time | Duration | Waypoint Link | UX Meaning |
|---|---|---|---|---|
| `start` | `08:00` | `0m` | `waypoint_index=0` | Route begins |
| `pickup` | `08:12` | `3m` | `waypoint_index=1` | Pickup at stop 1 |
| `job` | `08:18` | `7m` | `waypoint_index=1` | Service at same stop |
| `delay` | `08:25` | `5m` | `-` | Between-stop delay (traffic/loading) |
| `delivery` | `08:34` | `4m` | `waypoint_index=2` | Delivery at stop 2 |


### Travel Segments (Legs)

Between every pair of waypoints is a **travel leg**. Legs describe:

* The distance to the next stop
* The time it will take
* Step-by-step navigation data (optional)

This helps estimate total drive time and fuel usage, and can be used for route visualization.

## What Happens When Planning Fails?

In some cases, the system cannot assign all tasks. These situations are summarized in the Unassigned section of the result, which highlights what could not be planned:

* **Unassigned agents** — agents who were not given any jobs or shipments
* **Unassigned jobs** — jobs that couldn't be included in any agent’s route
* **Unassigned shipments** — shipments that had no matching or available agent

Unassignment can occur due to:

* Conflicting or tight time windows
* Capacity limits being exceeded
* Lack of required capabilities or skills
* Inadequate available working time

The SDK exposes this information so you can adjust the input, add agents, relax constraints, or manually reassign tasks using [`RoutePlannerResultEditor`](./api/route-planner-result-editor.md).


## Why This Matters

The result isn’t just a route — it’s a complete **logistics schedule**:

* Optimized for time and distance
* Respecting all constraints
* Ready for visualization, reporting, or editing

This enables:

* Driver-facing dashboards or printed plans
* Timeline and map views for dispatchers
* Automated plan editing with SDK tools

To work with this output, use the SDK’s:

* [`RoutePlannerResult`](./api/route-planner-result.md) — to access the plan
* [`Understanding Editing Functionality`](./editing-functionality.md) — when and how to apply route edits
* [`RoutePlannerResultEditor`](./api/route-planner-result-editor.md) — to modify or rebalance the plan
* [`RoutePlannerTimeline`](./api/route-planner-timeline.md) — to generate structured timelines for UI components
