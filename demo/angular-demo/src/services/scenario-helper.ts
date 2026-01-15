import RoutePlanner, { Agent, Job, Shipment, ShipmentStep, RoutePlannerResult } from '../../../../src';
import { Break } from '../../../../src/models/entities/nested/input/break';

/**
 * Helper class for creating test scenarios with agents, jobs, and shipments
 */
export class ScenarioHelper {

  static async createLargeScenario(apiKey: string): Promise<RoutePlannerResult | string> {
    try {
      const planner = new RoutePlanner({ apiKey });
      planner.setMode("drive");

      // Washington, DC - Different depot locations for each agent
      const depot1: [number, number] = [-77.0369, 38.9072];  // Downtown DC
      const depot2: [number, number] = [-77.0450, 38.9035];  // Southwest DC
      const depot3: [number, number] = [-77.0280, 38.9145];  // Northeast DC

      // Create 3 agents with simple time windows
      planner.addAgent(this.createAgent({
        id: 'Agent 1',
        location: depot1,
        capabilities: [],
        timeWindow: [0, 7200]
      }));

      planner.addAgent(this.createAgent({
        id: 'Agent 2',
        location: depot2,
        capabilities: [],
        timeWindow: [0, 7200]
      }));

      planner.addAgent(this.createAgent({
        id: 'Agent 3',
        location: depot3,
        capabilities: [],
        timeWindow: [0, 7200]
      }));

      // Add 20 shipments with pickup locations in a horizontal line
      // and delivery locations spread across the city
      const shipmentConfigs = [
        { pickup: [-77.0550, 38.9072], delivery: [-77.0315, 38.9105] },
        { pickup: [-77.0530, 38.9072], delivery: [-77.0485, 38.9028] },
        { pickup: [-77.0510, 38.9072], delivery: [-77.0245, 38.9170] },
        { pickup: [-77.0490, 38.9072], delivery: [-77.0355, 38.9083] },
        { pickup: [-77.0470, 38.9072], delivery: [-77.0425, 38.9052] },
        { pickup: [-77.0450, 38.9072], delivery: [-77.0325, 38.9098] },
        { pickup: [-77.0430, 38.9072], delivery: [-77.0465, 38.9045] },
        { pickup: [-77.0410, 38.9072], delivery: [-77.0260, 38.9162] },
        { pickup: [-77.0390, 38.9072], delivery: [-77.0340, 38.9090] },
        { pickup: [-77.0370, 38.9072], delivery: [-77.0495, 38.9025] },
        { pickup: [-77.0350, 38.9072], delivery: [-77.0255, 38.9158] },
        { pickup: [-77.0330, 38.9072], delivery: [-77.0345, 38.9093] },
        { pickup: [-77.0310, 38.9072], delivery: [-77.0455, 38.9042] },
        { pickup: [-77.0290, 38.9072], delivery: [-77.0335, 38.9088] },
        { pickup: [-77.0270, 38.9072], delivery: [-77.0268, 38.9148] },
        { pickup: [-77.0250, 38.9072], delivery: [-77.0478, 38.9032] },
        { pickup: [-77.0230, 38.9072], delivery: [-77.0310, 38.9108] },
        { pickup: [-77.0210, 38.9072], delivery: [-77.0445, 38.9050] },
        { pickup: [-77.0190, 38.9072], delivery: [-77.0275, 38.9155] },
        { pickup: [-77.0170, 38.9072], delivery: [-77.0365, 38.9075] }
      ];

      shipmentConfigs.forEach((config, i) => {
        planner.addShipment(this.createShipmentSimple({
          id: `order_${i + 1}`,
          pickupLocation: config.pickup as [number, number],
          deliveryLocation: config.delivery as [number, number]
        }));
      });

      return await planner.plan();
    } catch (error) {
      console.error("Failed to create large scenario:", error);
      return "Error creating large scenario";
    }
  }

  static async createValidationScenario(apiKey: string): Promise<RoutePlannerResult | string> {
    try {
      const planner = new RoutePlanner({ apiKey });
      planner.setMode("drive");

      // Washington, DC - Different depot locations for each agent
      const depot1: [number, number] = [-77.0369, 38.9072];  // Downtown DC
      const depot2: [number, number] = [-77.0450, 38.9035];  // Southwest DC
      const depot3: [number, number] = [-77.0280, 38.9145];  // Northeast DC

      // Create 3 agents with different constraints and start locations
      planner.addAgent(this.createAgent({
        id: 'Agent 1',
        location: depot1,
        capabilities: ['standard_delivery'],
        timeWindow: [32400, 61200],
        deliveryCapacity: 500
      }));

      planner.addAgent(this.createAgent({
        id: 'Agent 2',
        location: depot2,
        capabilities: ['standard_delivery'],
        timeWindow: [32400, 61200],
        deliveryCapacity: 300,
        lunchBreak: [43200, 46800]
      }));

      planner.addAgent(this.createAgent({
        id: 'Agent 3',
        location: depot3,
        capabilities: ['standard_delivery'],
        timeWindow: [28800, 64800],
        pickupCapacity: 400
      }));

      // Add 8 jobs around Washington, DC (mix of light and heavy)
      // All unique locations, different from depot1, depot2, depot3
      const jobConfigs = [
        { id: 'job-1', loc: [-77.0319, 38.9101], pickup: 50 },      // Near White House
        { id: 'job-2', loc: [-77.0500, 38.9020], delivery: 65 },    // Southwest
        { id: 'job-3', loc: [-77.0250, 38.9160], pickup: 80 },      // Northeast
        { id: 'job-4', loc: [-77.0390, 38.9095], delivery: 95 },    // Central
        { id: 'job-5', loc: [-77.0475, 38.9042], pickup: 110 },     // Southwest area
        // Heavy jobs (200kg each - will test capacity limits)
        { id: 'heavy-job-1', loc: [-77.0334, 38.9110], delivery: 200 }, // North central
        { id: 'heavy-job-2', loc: [-77.0265, 38.9155], delivery: 200 }, // Far northeast
        { id: 'heavy-job-3', loc: [-77.0510, 38.9015], delivery: 200 }  // Far southwest
      ];
      
      jobConfigs.forEach(config => {
        planner.addJob(this.createJob({
          id: config.id,
          location: config.loc as [number, number],
          pickup: (config as any).pickup,
          delivery: (config as any).delivery
        }));
      });

      // Add 5 shipments around DC with unique pickup locations near the warehouse
      const shipmentConfigs = [
        { pickup: [-77.0370, 38.9073], delivery: [-77.0315, 38.9105] },  // Near Capitol
        { pickup: [-77.0371, 38.9074], delivery: [-77.0485, 38.9028] },  // Southwest waterfront
        { pickup: [-77.0372, 38.9075], delivery: [-77.0245, 38.9170] },  // Northeast corridor
        { pickup: [-77.0368, 38.9071], delivery: [-77.0355, 38.9083] },  // Downtown
        { pickup: [-77.0367, 38.9070], delivery: [-77.0425, 38.9052] }   // Southwest area
      ];
      
      shipmentConfigs.forEach((config, i) => {
        planner.addShipment(this.createShipment({
          id: `shipment-${i + 1}`,
          pickupLocation: config.pickup as [number, number],
          deliveryLocation: config.delivery as [number, number],
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

  static createShipmentSimple(config: {
    id: string;
    pickupLocation: [number, number];
    deliveryLocation: [number, number];
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
      );
    
    if (config.requirements) {
      config.requirements.forEach(req => shipment.addRequirement(req));
    }
    
    return shipment;
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

