import { AgentPlan } from "@sdk/models";
import { getAlertIconUrl, getMapStyle, getMarkerIconUrl } from "../../core/geoapifyApiConfig";
export type DemoAgentRoute = {
  color: string;
  agentPlan: AgentPlan;
  agentRoute?: any; /* GeoJSON */
};

export type DemoUnassignedMarker = {
  location: [number, number];
  title: string;
  lines: string[];
};

export type DemoMapView = {
  render: (
    routes: DemoAgentRoute[],
    unassignedMarkers?: DemoUnassignedMarker[],
    hiddenAgentIndexes?: Set<number>
  ) => void;
  focusAgent: (agentIndex: number) => void;
};

const formatActionLabel = (action: any) => {
  const type = action.getType?.() ?? action.type ?? "action";
  const jobId = action.getJobId?.() ?? action.job_id;
  const jobIndex = action.getJobIndex?.() ?? action.job_index;
  const shipmentId = action.getShipmentId?.() ?? action.shipment_id;
  const shipmentIndex = action.getShipmentIndex?.() ?? action.shipment_index;

  if (type === "pickup" || type === "delivery") {
    const label =
      shipmentId ?? (shipmentIndex !== undefined ? `#${shipmentIndex}` : "");
    return label ? `${type} ${label}` : type;
  }

  if (type === "job" || type === "service") {
    const label = jobId ?? (jobIndex !== undefined ? `#${jobIndex}` : "");
    return label ? `${type} ${label}` : type;
  }

  if (jobId || jobIndex !== undefined) {
    const label = jobId ?? `#${jobIndex}`;
    return `${type} ${label}`;
  }

  if (shipmentId || shipmentIndex !== undefined) {
    const label = shipmentId ?? `#${shipmentIndex}`;
    return `${type} ${label}`;
  }

  return type;
};

const getActionTargetLabel = (action: any) => {
  const jobId = action.getJobId?.() ?? action.job_id;
  const jobIndex = action.getJobIndex?.() ?? action.job_index;
  const shipmentId = action.getShipmentId?.() ?? action.shipment_id;
  const shipmentIndex = action.getShipmentIndex?.() ?? action.shipment_index;

  if (jobId) return String(jobId);
  if (jobIndex !== undefined) return `#${jobIndex}`;
  if (shipmentId) return String(shipmentId);
  if (shipmentIndex !== undefined) return `#${shipmentIndex}`;
  return "";
};

const buildWaypointPopup = (
  waypoint: any,
  index: number,
  agentLabel: string,
  color: string
) => {
  const container = document.createElement("div");
  container.style.fontSize = "11px";
  container.style.lineHeight = "1.2";
  container.style.whiteSpace = "normal";
  container.style.maxWidth = "220px";
  container.style.wordBreak = "break-word";

  const title = document.createElement("div");
  title.style.fontWeight = "600";
  title.style.marginBottom = "4px";
  title.innerHTML = `
    <span style="display:inline-block;width:9px;height:9px;border-radius:50%;background:${color};margin-right:6px"></span>
    <span style="color:${color}">${agentLabel}</span>
    <span style="color:#555;margin-left:6px">#${index + 1}</span>
  `;
  container.appendChild(title);

  const actions = waypoint.getActions?.() ?? [];
  if (actions.length === 0) {
    const empty = document.createElement("div");
    empty.textContent = "No actions";
    container.appendChild(empty);
    return container;
  }

  const groups = new Map<string, string[]>();
  actions.forEach((action: any) => {
    const type = action.getType?.() ?? action.type ?? "action";
    const label = getActionTargetLabel(action);
    const existing = groups.get(type) || [];
    if (label) {
      existing.push(label);
    } else if (existing.length === 0) {
      existing.push("");
    }
    groups.set(type, existing);
  });

  groups.forEach((labels, type) => {
    const typeLabel = String(type);
    const typeLower = typeLabel.toLowerCase();
    const isTitle = typeLower === "pickup" || typeLower === "delivery";

    if (isTitle) {
      const titleRow = document.createElement("div");
      titleRow.style.fontWeight = "600";
      titleRow.style.marginTop = "2px";
      titleRow.textContent =
        typeLower === "pickup" ? "Pickup" : "Delivery";
      container.appendChild(titleRow);

      if (labels.length > 0 && !(labels.length === 1 && labels[0] === "")) {
        const listRow = document.createElement("div");
        listRow.textContent = labels.join(", ");
        container.appendChild(listRow);
      }
      return;
    }

    const row = document.createElement("div");
    if (labels.length === 0 || (labels.length === 1 && labels[0] === "")) {
      row.textContent = typeLabel;
    } else {
      row.textContent = `${typeLabel}: ${labels.join(", ")}`;
    }
    container.appendChild(row);
  });

  return container;
};

export function createMapView(container: HTMLElement): DemoMapView {
  const maplibre = (window as any).maplibregl;
  if (!maplibre) {
    container.innerHTML =
      "<div style=\"padding:12px\">MapLibre failed to load.</div>";
    return {
      render: () => undefined,
      focusAgent: () => undefined
    };
  }

  const map = new maplibre.Map({
    container,
    style: getMapStyle(),
    center: [13.405, 52.52],
    zoom: 12
  });

  const markers: any[] = [];
  const alertMarkers: any[] = [];
  let lastRoutes: DemoAgentRoute[] = [];
  let lastUnassigned: DemoUnassignedMarker[] = [];
  let pendingFocusIndex: number | null = null;
  let pending:
    | {
        routes: DemoAgentRoute[];
        unassignedMarkers?: DemoUnassignedMarker[];
        hiddenAgentIndexes?: Set<number>;
      }
    | null = null;

  const setMarkers = (
    routes: DemoAgentRoute[],
    hiddenAgentIndexes: Set<number>
  ) => {
    markers.forEach((marker) => marker.remove());
    markers.length = 0;

    routes.forEach((route) => {
      if (hiddenAgentIndexes.has(route.agentPlan.getAgentIndex())) {
        return;
      }
      const waypoints = route.agentPlan.getWaypoints();
      waypoints.forEach((waypoint, index) => {
        const img = document.createElement("img");
        img.src = getMarkerIconUrl(String(index + 1), route.color);
        img.alt = `Waypoint ${index + 1}`;
        img.width = 26;
        img.height = 26;

        const marker = new maplibre.Marker({
          element: img,
          anchor: "center"
        })
          .setLngLat(waypoint.getLocation())
          .addTo(map);

        const popup = new maplibre.Popup({
          offset: 16,
          closeButton: false
        }).setDOMContent(
          buildWaypointPopup(
            waypoint,
            index,
            route.agentPlan.getAgentId() || `agent-${route.agentPlan.getAgentIndex() + 1}`,
            route.color
          )
        );
        marker.setPopup(popup);

        markers.push(marker);
      });
    });
  };

  const buildAlertPopup = (marker: DemoUnassignedMarker) => {
    const container = document.createElement("div");
    container.style.fontSize = "12px";
    container.style.lineHeight = "1.25";
    container.style.maxWidth = "220px";
    container.style.wordBreak = "break-word";

    const title = document.createElement("div");
    title.style.fontWeight = "600";
    title.style.marginBottom = "4px";
    title.textContent = marker.title;
    container.appendChild(title);

    marker.lines.forEach((line) => {
      const row = document.createElement("div");
      row.textContent = line;
      container.appendChild(row);
    });

    return container;
  };

  const setUnassignedMarkers = (markersData: DemoUnassignedMarker[]) => {
    alertMarkers.forEach((marker) => marker.remove());
    alertMarkers.length = 0;
    lastUnassigned = markersData;

    markersData.forEach((markerData) => {
      const img = document.createElement("img");
      img.src = getAlertIconUrl();
      img.alt = "Unassigned";
      img.width = 28;
      img.height = 28;

      const marker = new maplibre.Marker({
        element: img,
        anchor: "center"
      })
        .setLngLat(markerData.location)
        .addTo(map);

      const popup = new maplibre.Popup({
        offset: 16,
        closeButton: false
      }).setDOMContent(buildAlertPopup(markerData));

      marker.setPopup(popup);
      alertMarkers.push(marker);
    });
  };

  const fitToCoordinates = (coords: [number, number][]) => {
    if (coords.length === 0) return;

    let minLng = coords[0][0];
    let minLat = coords[0][1];
    let maxLng = coords[0][0];
    let maxLat = coords[0][1];

    coords.forEach(([lng, lat]) => {
      minLng = Math.min(minLng, lng);
      minLat = Math.min(minLat, lat);
      maxLng = Math.max(maxLng, lng);
      maxLat = Math.max(maxLat, lat);
    });

    map.fitBounds(
      [
        [minLng, minLat],
        [maxLng, maxLat]
      ],
      { padding: 40, duration: 800 }
    );
  };

  const updateRoutes = (
    routes: DemoAgentRoute[],
    unassignedMarkers: DemoUnassignedMarker[],
    hiddenAgentIndexes: Set<number>
  ) => {
    lastRoutes = routes;
    const totalRoutes = routes.length || 1;
    const features = routes
      .map((route: DemoAgentRoute, index: number) => {
        let geometry = route.agentRoute?.geometry;
        if (!geometry) {
          geometry = {
            type: "LineString",
            coordinates: route.agentPlan
              .getWaypoints()
              .map((waypoint) => waypoint.getLocation())
          }
        }

        const offset = (index - (totalRoutes - 1) / 2) * 3;

        return {
          type: "Feature",
          geometry: geometry,
          properties: {
            agentIndex: route.agentPlan.getAgentIndex(),
            color: route.color,
            offset,
            hidden: hiddenAgentIndexes.has(route.agentPlan.getAgentIndex())
          }
        };
      })
      .filter((route): route is any => !!route);

    const source = map.getSource("routes") as any;
    if (source) {
      source.setData({ type: "FeatureCollection", features });
    }

    setMarkers(routes, hiddenAgentIndexes);
    setUnassignedMarkers(unassignedMarkers);
  };

  const collectAllCoordinates = (
    routes: DemoAgentRoute[],
    unassignedMarkers: DemoUnassignedMarker[]
  ) => {
    const coords: [number, number][] = [];
    routes.forEach((route) => {
        coords.push(
          ...route.agentPlan.getWaypoints().map((waypoint) => waypoint.getLocation())
        );
    });
    unassignedMarkers.forEach((marker) => {
      coords.push(marker.location);
    });
    return coords;
  };

  const focusAgent = (agentIndex: number) => {
    const route = lastRoutes.find(
      (entry) => entry.agentPlan.getAgentIndex() === agentIndex
    );
    if (!route) return;

    if (!map.isStyleLoaded()) {
      pendingFocusIndex = agentIndex;
      return;
    }

    const waypointCoords = route.agentPlan
      .getWaypoints()
      .map((waypoint) => waypoint.getLocation());
    fitToCoordinates(waypointCoords);
  };

  map.on("load", () => {
    map.addSource("routes", {
      type: "geojson",
      data: { type: "FeatureCollection", features: [] }
    });

    map.addLayer({
      id: "routes-line",
      type: "line",
      source: "routes",
      paint: {
        "line-color": ["get", "color"],
        "line-offset": ["get", "offset"],
        "line-width": 3,
        "line-opacity": [
          "case",
          ["get", "hidden"],
          0,
          0.8
        ]
      }
    });

    if (pending) {
      updateRoutes(
        pending.routes,
        pending.unassignedMarkers || [],
        pending.hiddenAgentIndexes || new Set()
      );
      if (pendingFocusIndex !== null) {
        focusAgent(pendingFocusIndex);
        pendingFocusIndex = null;
      } else {
        fitToCoordinates(
          collectAllCoordinates(
            pending.routes,
            pending.unassignedMarkers || []
          )
        );
      }
      pending = null;
    } else if (pendingFocusIndex !== null) {
      focusAgent(pendingFocusIndex);
      pendingFocusIndex = null;
    }
  });

  return {
    render(routes, unassignedMarkers = [], hiddenAgentIndexes = new Set()) {
      if (!map.isStyleLoaded()) {
        pending = {
          routes,
          unassignedMarkers,
          hiddenAgentIndexes
        };
        return;
      }
      updateRoutes(routes, unassignedMarkers, hiddenAgentIndexes);
      if (pendingFocusIndex !== null) {
        focusAgent(pendingFocusIndex);
        pendingFocusIndex = null;
      } else {
        console.log("fit to route");
        fitToCoordinates(collectAllCoordinates(routes, unassignedMarkers));
      }
    },
    focusAgent(agentIndex: number) {
      focusAgent(agentIndex);
    }
  };
}
