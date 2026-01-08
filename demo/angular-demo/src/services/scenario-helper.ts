import RoutePlanner, { Agent, Job, Shipment, ShipmentStep, RoutePlannerResult } from '../../../../src';
import { Break } from '../../../../src/models/entities/nested/input/break';

/**
 * Helper class for creating test scenarios with agents, jobs, and shipments
 */
export class ScenarioHelper {

  static async createValidationScenario(apiKey: string): Promise<RoutePlannerResult | string> {
    try {
      const planner = new RoutePlanner({ apiKey });
      planner.setMode("drive");

      const warehouse: [number, number] = [44.802171, 41.6928772];

      // Create 3 agents with different constraints
      planner.addAgent(this.createAgent({
        id: 'regular-van',
        location: warehouse,
        capabilities: ['standard_delivery'],
        timeWindow: [32400, 61200],
        deliveryCapacity: 500
      }));

      planner.addAgent(this.createAgent({
        id: 'driver-with-break',
        location: warehouse,
        capabilities: ['standard_delivery'],
        timeWindow: [32400, 61200],
        deliveryCapacity: 300,
        lunchBreak: [43200, 46800]
      }));

      planner.addAgent(this.createAgent({
        id: 'pickup-van',
        location: warehouse,
        capabilities: ['standard_delivery'],
        timeWindow: [28800, 64800],
        pickupCapacity: 400
      }));

      // Add 8 jobs (mix of light and heavy)
      const jobConfigs = [
        { id: 'job-1', loc: [44.805, 41.695], pickup: 50 },
        { id: 'job-2', loc: [44.800, 41.692], delivery: 65 },
        { id: 'job-3', loc: [44.810, 41.696], pickup: 80 },
        { id: 'job-4', loc: [44.808, 41.694], delivery: 95 },
        { id: 'job-5', loc: [44.803, 41.691], pickup: 110 },
        // Heavy jobs (200kg each - will test capacity limits)
        { id: 'heavy-job-1', loc: [44.806, 41.693], delivery: 200 },
        { id: 'heavy-job-2', loc: [44.809, 41.697], delivery: 200 },
        { id: 'heavy-job-3', loc: [44.804, 41.690], delivery: 200 }
      ];
      
      jobConfigs.forEach(config => {
        planner.addJob(this.createJob({
          id: config.id,
          location: config.loc as [number, number],
          pickup: (config as any).pickup,
          delivery: (config as any).delivery
        }));
      });

      // Add 5 shipments
      const deliveryLocations: [number, number][] = [
        [44.805, 41.695], [44.800, 41.692], [44.810, 41.696],
        [44.808, 41.694], [44.803, 41.691]
      ];
      
      deliveryLocations.forEach((loc, i) => {
        planner.addShipment(this.createShipment({
          id: `shipment-${i + 1}`,
          pickupLocation: warehouse,
          deliveryLocation: loc,
          amount: 30 + i * 10
        }));
      });

      return await planner.plan();
    } catch (error) {
      console.error("Failed to create validation scenario:", error);
      return "Error creating validation scenario";
    }
  }

  static createAgent(config: {
    id: string;
    location: [number, number];
    capabilities: string[];
    timeWindow: [number, number];
    pickupCapacity?: number;
    deliveryCapacity?: number;
    lunchBreak?: [number, number];
  }): Agent {
    const agent = new Agent()
      .setId(config.id)
      .setStartLocation(config.location[0], config.location[1]);
    
    config.capabilities.forEach(cap => agent.addCapability(cap));
    agent.addTimeWindow(config.timeWindow[0], config.timeWindow[1]);
    
    if (config.pickupCapacity) agent.setPickupCapacity(config.pickupCapacity);
    if (config.deliveryCapacity) agent.setDeliveryCapacity(config.deliveryCapacity);
    
    if (config.lunchBreak) {
      const lunchBreak = new Break().addTimeWindow(config.lunchBreak[0], config.lunchBreak[1]);
      agent.addBreak(lunchBreak);
    }
    
    return agent;
  }

  static createJob(config: {
    id: string;
    location: [number, number];
    pickup?: number;
    delivery?: number;
    requirements?: string[];
    duration?: number;
  }): Job {
    const job = new Job()
      .setId(config.id)
      .setLocation(config.location[0], config.location[1])
      .setDuration(config.duration || 300);
    
    if (config.pickup) job.setPickupAmount(config.pickup);
    if (config.delivery) job.setDeliveryAmount(config.delivery);
    if (config.requirements) {
      config.requirements.forEach(req => job.addRequirement(req));
    }
    
    return job;
  }

  static createShipment(config: {
    id: string;
    pickupLocation: [number, number];
    deliveryLocation: [number, number];
    amount: number;
    requirements?: string[];
    duration?: number;
  }): Shipment {
    const shipment = new Shipment()
      .setId(config.id)
      .setPickup(
        new ShipmentStep()
          .setLocation(config.pickupLocation[0], config.pickupLocation[1])
          .setDuration(config.duration || 120)
      )
      .setDelivery(
        new ShipmentStep()
          .setLocation(config.deliveryLocation[0], config.deliveryLocation[1])
          .setDuration(config.duration || 120)
      )
      .setAmount(config.amount);
    
    if (config.requirements) {
      config.requirements.forEach(req => shipment.addRequirement(req));
    }
    
    return shipment;
  }
}

