# Installation

Install the SDK from NPM:

```bash
npm install @geoapify/route-planner-sdk
```

## Import and Initialize the SDK

You can use the SDK in both frontend and backend environments.

## In TypeScript / Node.js / ES modules

```ts
import RoutePlanner, { Agent, Job } from "@geoapify/route-planner-sdk";

const planner = new RoutePlanner({
  apiKey: "YOUR_API_KEY", // Get it from https://my.geoapify.com/
});
```

## In a Browser (via CDN)

```html
<script src="https://unpkg.com/@geoapify/route-planner-sdk/dist/index.min.js"></script>
<script>
  const planner = new RoutePlannerSDK.RoutePlanner({
    apiKey: "YOUR_API_KEY"
  });
</script>
```

> **Note:** This method loads the SDK via [unpkg CDN](https://unpkg.com/) and makes it available globally as `RoutePlannerSDK`.


## Getting the API Key

You need a valid **Geoapify API key** to use the SDK.
You can get a free key by signing up at [https://www.geoapify.com/](https://www.geoapify.com/).

This key is required to authenticate requests to the [Geoapify Route Planner API](https://www.geoapify.com/route-planner-api/).