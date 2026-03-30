# `Shipment`

`Shipment` defines a pickup+delivery pair that must be executed by the same agent.

## Constructor

Signature: `new Shipment(raw?: ShipmentData)`

Creates a shipment instance. If `raw` is omitted, empty `requirements` are initialized.

```ts
const shipment = new Shipment();
```

## Methods

| Method | Signature | Purpose |
|---|---|---|
| `getRaw` | `getRaw(): ShipmentData` | Return current raw payload |
| `setRaw` | `setRaw(value: ShipmentData): this` | Replace raw payload |
| `setId` | `setId(id: string): this` | Set shipment ID |
| `setPickup` | `setPickup(value: ShipmentStep): this` | Set pickup step |
| `setDelivery` | `setDelivery(value: ShipmentStep): this` | Set delivery step |
| `addRequirement` | `addRequirement(value: string): this` | Add required capability |
| `setPriority` | `setPriority(value: number): this` | Set priority |
| `setDescription` | `setDescription(value: string): this` | Set description |
| `setAmount` | `setAmount(value: number): this` | Set amount for capacity calculations |

### getRaw()

Returns current `ShipmentData`.

```ts
const raw = shipment.getRaw();
```

### setRaw(value)

Replaces whole shipment payload.

```ts
shipment.setRaw({ requirements: [], pickup: { location: [13.38, 52.52] }, delivery: { location: [13.40, 52.50] } });
```

### setId(id)

Sets shipment ID.

```ts
shipment.setId('order-1');
```

### setPickup(value)

Sets pickup step.

```ts
shipment.setPickup(new ShipmentStep().setLocation(13.38, 52.52).setDuration(180));
```

### setDelivery(value)

Sets delivery step.

```ts
shipment.setDelivery(new ShipmentStep().setLocation(13.40, 52.50).setDuration(180));
```

### addRequirement(value)

Adds required capability tag.

```ts
shipment.addRequirement('cooled');
```

### setPriority(value)

Sets shipment priority.

```ts
shipment.setPriority(90);
```

### setDescription(value)

Sets human-readable description.

```ts
shipment.setDescription('Pickup at warehouse, deliver to store');
```

### setAmount(value)

Sets shipment amount for capacity tracking.

```ts
shipment.setAmount(20);
```

## Example

```ts
import { Shipment, ShipmentStep } from '@geoapify/route-planner-sdk';

const pickup = new ShipmentStep()
  .setLocation(13.38, 52.52)
  .setDuration(180)
  .addTimeWindow(0, 14400);

const delivery = new ShipmentStep()
  .setLocation(13.40, 52.50)
  .setDuration(180)
  .addTimeWindow(3600, 21600);

const shipment = new Shipment()
  .setId('order-1')
  .setPickup(pickup)
  .setDelivery(delivery)
  .setAmount(20)
  .setPriority(80)
  .addRequirement('cooled');
```

## ShipmentData Interface

This is the original plain data object shape used in API payloads (request/response), not the SDK wrapper class.

```ts
interface ShipmentData {
  id?: string;
  pickup?: ShipmentStepData;
  delivery?: ShipmentStepData;
  requirements: string[];
  priority?: number;
  description?: string;
  amount?: number;
}
```

Referenced nested interface: [`ShipmentStepData`](./shipment-step.md#shipmentstepdata-interface).

## Related

- [`ShipmentStep`](./shipment-step.md)
- [`Agent`](./agent.md)
- [`Job`](./job.md)
