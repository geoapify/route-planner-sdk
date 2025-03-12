import { RoutePlanner } from "../route-planner";
import { Job, Location, Shipment } from "../models";

export class RouteEditor {
  private readonly routePlanner: RoutePlanner;

  constructor(routePlanner: RoutePlanner) {
    this.routePlanner = routePlanner;
  }

  /**
   * Adds a job to the route planner.
   * @param job RouteJob
   */
  public addJob(job: Job): this {
    this.routePlanner.addJob(job);
    return this;
  }

  /**
   * Removes a job by ID.
   * @param jobId string
   */
  public removeJob(jobId: string): this {
    this.routePlanner.getRaw().jobs = this.routePlanner.getRaw().jobs.filter(job => job.id !== jobId);
    return this;
  }

  /**
   * Adds a shipment to the route planner.
   * @param shipment RouteShipment
   */
  public addShipment(shipment: Shipment): this {
    this.routePlanner.addShipment(shipment);
    return this;
  }

  /**
   * Removes a shipment by ID.
   * @param shipmentId string
   */
  public removeShipment(shipmentId: string): this {
    this.routePlanner.getRaw().shipments = this.routePlanner.getRaw().shipments.filter(shipment => shipment.id !== shipmentId);
    return this;
  }

  /**
   * Adds a location to the route planner.
   * @param location RouteShipment
   */
  public addLocation(location: Location): this {
    this.routePlanner.addLocation(location);
    return this;
  }

  /**
   * Removes a location by ID.
   * @param locationId string
   */
  public removeLocation(locationId: string): this {
    this.routePlanner.getRaw().locations = this.routePlanner.getRaw().locations.filter(location => location.id !== locationId);
    return this;
  }


  /**
   * Gets the modified RoutePlanner instance.
   */
  public getRoutePlanner(): RoutePlanner {
    return this.routePlanner;
  }
}
