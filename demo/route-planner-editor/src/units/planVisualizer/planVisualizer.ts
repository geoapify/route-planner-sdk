import { createMapView, DemoAgentRoute, DemoUnassignedMarker } from "./mapView";
import { createTimelineView } from "./timelineView";
import type { DemoRoutePlannerState } from "../../core/store";
import { AgentPlan, RoutePlannerResult } from "@sdk/models";
import { getAgentColor } from "../../core/agentColors";

const buildAgentRoutes = async (
  result: RoutePlannerResult
): Promise<DemoAgentRoute[]> => {
  const agentPlans = result.getAgentPlans();
  const plans = agentPlans
    .map((agentPlan, index) => ({ agentPlan, index }))
    .filter(
      (entry): entry is { agentPlan: AgentPlan; index: number } =>
        !!entry.agentPlan
    );

  return Promise.all(
    plans.map(async ({ agentPlan, index }) => {
      const agentRouteFeature = await agentPlan.getRoute();
      return {
        color: getAgentColor(index),
        agentPlan,
        agentRoute: agentRouteFeature
      };
    })
  );
};

const formatCoords = (location: [number, number]) =>
  `${location[1].toFixed(5)}, ${location[0].toFixed(5)}`;

const buildUnassignedMarkers = (
  result: RoutePlannerResult
): DemoUnassignedMarker[] => {
  const inputData = result.getRoutingOptions() as any;
  const locations = inputData?.locations || [];
  const locationsById = new Map<string, [number, number]>();
  locations.forEach((loc: any) => {
    if (loc?.id && loc?.location) {
      locationsById.set(loc.id, loc.location);
    }
  });

  const resolveLocation = (item: any) => {
    let location = item?.location as [number, number] | undefined;
    let locationId = item?.location_id as string | undefined;

    if (!location && typeof item?.location_index === "number") {
      const resolved = locations[item.location_index];
      location = resolved?.location;
      if (!locationId) {
        locationId = resolved?.id;
      }
    }

    if (!location && locationId) {
      location = locationsById.get(locationId);
    }

    return { location, locationId };
  };

  const markers: DemoUnassignedMarker[] = [];

  const jobs = result.getUnassignedJobs?.() ?? [];
  const allJobs = inputData?.jobs || [];
  jobs.forEach((job: any) => {
    const jobIndex = allJobs.indexOf(job);
    const jobLabel =
      job?.id || (jobIndex >= 0 ? `#${jobIndex}` : "unnamed");
    const { location, locationId } = resolveLocation(job);
    if (!location) return;
    markers.push({
      location,
      title: "Unassigned job",
      lines: [
        `Job: ${jobLabel}`,
        `Location: ${locationId || formatCoords(location)}`
      ]
    });
  });

  const shipments = result.getUnassignedShipments?.() ?? [];
  const allShipments = inputData?.shipments || [];
  shipments.forEach((shipment: any) => {
    const shipmentIndex = allShipments.indexOf(shipment);
    const shipmentLabel = `Shipment: ${
      shipment?.id || (shipmentIndex >= 0 ? `#${shipmentIndex}` : "unnamed")
    }`;
    const pickupInfo = shipment?.pickup
      ? resolveLocation(shipment.pickup)
      : { location: undefined, locationId: undefined };
    const deliveryInfo = shipment?.delivery
      ? resolveLocation(shipment.delivery)
      : { location: undefined, locationId: undefined };

    const pickupHidden = pickupInfo.locationId === "storage-0";
    const deliveryHidden = deliveryInfo.locationId === "storage-0";

    const lines: string[] = [shipmentLabel];
    if (pickupInfo.location && !pickupHidden) {
      lines.push(
        `Pickup: ${pickupInfo.locationId || formatCoords(pickupInfo.location)}`
      );
    }
    if (deliveryInfo.location && !deliveryHidden) {
      lines.push(
        `Delivery: ${
          deliveryInfo.locationId || formatCoords(deliveryInfo.location)
        }`
      );
    }

    if (pickupInfo.location && !pickupHidden) {
      markers.push({
        location: pickupInfo.location,
        title: "Unassigned shipment (pickup)",
        lines
      });
    }

    if (deliveryInfo.location && !deliveryHidden) {
      markers.push({
        location: deliveryInfo.location,
        title: "Unassigned shipment (delivery)",
        lines
      });
    }
  });

  return markers;
};

export function createPlanVisualizer(
  mapContainer: HTMLElement,
  timelineContainer: HTMLElement,
  timelineMeta: HTMLElement,
  store: { subscribe: (listener: (state: DemoRoutePlannerState) => void) => void }
) {
  const mapView = createMapView(mapContainer);
  let renderToken = 0;
  const timelineView = createTimelineView(timelineContainer, timelineMeta);
  let cachedResult: RoutePlannerResult | null = null;
  let cachedRoutes: DemoAgentRoute[] | null = null;
  let cachedPromise: Promise<DemoAgentRoute[]> | null = null;

  store.subscribe(async (state) => {
    if (!state.result) {
      mapView.render([]);
      timelineView.render(null);
      cachedResult = null;
      cachedRoutes = null;
      cachedPromise = null;
      return;
    }

    const token = ++renderToken;
    const result: RoutePlannerResult = state.result;
    const hiddenAgentIndexes = new Set(state.hiddenAgentIndexes || []);
    let routes: DemoAgentRoute[] | null = null;

    if (result !== cachedResult) {
      cachedResult = result;
      cachedRoutes = null;
      cachedPromise = buildAgentRoutes(result);
    }

    if (cachedRoutes) {
      routes = cachedRoutes;
    } else if (cachedPromise) {
      routes = await cachedPromise;
      if (token !== renderToken) return;
      cachedRoutes = routes;
      cachedPromise = null;
    } else {
      cachedPromise = buildAgentRoutes(result);
      routes = await cachedPromise;
      if (token !== renderToken) return;
      cachedRoutes = routes;
      cachedPromise = null;
    }

    if (token !== renderToken) return;

    const unassignedMarkers = buildUnassignedMarkers(result);
    mapView.render(routes, unassignedMarkers, hiddenAgentIndexes);
    timelineView.render(result);
    timelineView.setHiddenAgents(hiddenAgentIndexes);
  });

  return {
    focusAgent(agentIndex: number) {
      mapView.focusAgent(agentIndex);
    },
    setTimelineType(type: "time" | "distance") {
      timelineView.setTimelineType(type);
    }
  };
}
