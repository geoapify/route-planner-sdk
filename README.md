# Geoapify Route Planner SDK

## Installation

```sh
npm install
```

## Building the SDK

```sh
npm run build
```

## Running Tests

```sh
npm test
```

## Usage Example

```ts
import { RoutePlannerSDK } from "@geoapify/route-planner-sdk";

const sdk = new RoutePlannerSDK("YOUR_API_KEY");

sdk.testMethod().then(response => console.log(response));
```
