# Geoapify Route Planner SDK

## Overview
The **Geoapify Route Planner SDK** is a lightweight, dependency-free TypeScript library that simplifies building, executing, and processing requests for the [Geoapify Route Planner API](https://apidocs.geoapify.com/docs/route-planner/). It is designed to work in both frontend (browser) and backend (Node.js) environments.

## Features
- **Request Building**: Easily configure route planning requests with agents, jobs, shipments, and locations.
- **Cross-Platform Support**: Works seamlessly in frontend and backend environments using a universal fetch wrapper.
- **Zero Dependencies**: Built for lightweight integration.

## Installation
```sh
npm install @geoapify/route-planner-sdk
```

## Building the SDK
```sh
npm run build
```

## Running Tests
```sh
npm test
```

## Quick Start

### Importing the SDK
```ts
import { RoutePlanner } from "@geoapify/route-planner-sdk";
```

### Creating a Route Planner Instance
```ts
const planner = new RoutePlanner("YOUR_API_KEY");
```

### Building and Sending a Route Request
```ts
await planner
    .setMode("drive")
    .addAgent(new RouteAgent().setId("agent-1").setStartLocation(13.38, 52.52))
    .addJob(new RouteJob().setId("job-1").setLocation(13.39, 52.51))
    .plan();
```

## API Documentation
For more details, visit:
- **[API Playground](https://apidocs.geoapify.com/playground/route-planner/)** – Test and generate API requests.
- **[API Documentation](https://apidocs.geoapify.com/docs/route-planner/)** – Complete reference for API endpoints and parameters.