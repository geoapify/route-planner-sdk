# Route Optimization Result: Conceptual Overview

Once you submit a route planning request, the Geoapify Route Planner API returns a structured plan — not just a route, but a full execution schedule for each agent (driver, worker, or vehicle).

This result helps answer key questions:

* What will each agent do?
* In what order will they visit stops?
* When will they arrive and how long will they stay?
* Are there any unassigned jobs or unresolved constraints?

The SDK processes this output and provides tools to explore, visualize, and modify the result.

---

## How the Result Is Structured

The result is organized by agent. For each agent, the system provides:

* A **route path** (map line connecting the stops)
* A **sequence of actions** (e.g., pickup, delivery)
* A **timeline** of when each action happens
* A **list of waypoints** where actions occur
* Travel **legs** between waypoints, with distances and durations

It also includes a summary of **issues**, such as unassigned jobs or idle agents.

Think of it as a personalized itinerary for every agent, shaped by all the constraints and optimization logic you provided.

---

## AgentSolution: Agent Execution Plan

Each agent’s result is encapsulated as an `AgentSolution`. This object describes all activities and movements assigned to the agent, including:

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

---

## Waypoints and Actions

Each stop along an agent's route is called a **waypoint**. A waypoint includes:

* Its location
* The time the agent arrives
* All actions performed at that location (e.g., deliver a package, take a break)

Actions are the smallest unit of work. They can represent:

* **Start** of the route
* **Pickup** of a shipment
* **Job** execution
* **Delivery** of a shipment
* **End** of the route

By combining actions with locations and times, you can reconstruct an agent’s full day.

---

## Travel Segments (Legs)

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
* [`RoutePlannerResultEditor`](./api/route-planner-result-editor.md) — to modify or rebalance the plan
* [`RoutePlannerTimeline`](./api/route-planner-timeline.md) — to generate structured timelines for UI components
