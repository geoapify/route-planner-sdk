import { Component, Input, OnChanges, SimpleChanges, ViewChild, ElementRef, AfterViewInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Map, NavigationControl, LngLatBounds, MapMouseEvent, Popup } from 'maplibre-gl';
import { RoutePlannerResult } from '../../../../../../src';

@Component({
  selector: 'app-route-map',
  standalone: true,
  imports: [CommonModule, HttpClientModule],
  templateUrl: './route-map.component.html',
  styleUrls: ['./route-map.component.css']
})
export class RouteMapComponent implements AfterViewInit, OnChanges {
  @ViewChild('mapContainer', { static: true }) mapContainer!: ElementRef;
  
  @Input() result: RoutePlannerResult | undefined;
  @Input() apiKey = '';

  @Output() addJobAtLocation = new EventEmitter<{ lon: number; lat: number }>();
  @Output() addShipmentAtLocation = new EventEmitter<{ lon: number; lat: number }>();

  private map: Map | undefined;
  private routeLayers: string[] = [];
  private markerLayers: string[] = [];

  private readonly AGENT_COLORS = [
    '#3498db', // Blue
    '#e74c3c', // Red
    '#2ecc71', // Green
    '#f39c12', // Orange
    '#9b59b6', // Purple
    '#1abc9c', // Turquoise
    '#34495e'  // Dark gray
  ];


  constructor(private http: HttpClient) {}

  ngAfterViewInit() {
    this.initializeMap();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['result'] && this.map) {
      this.visualizeResult();
    }
  }

  private initializeMap() {
    this.map = new Map({
      container: this.mapContainer.nativeElement,
      style: `https://maps.geoapify.com/v1/styles/osm-bright-smooth/style.json?apiKey=${this.apiKey}`,
      center: [0, 0],
      zoom: 2
    });

    this.map.addControl(new NavigationControl({}), 'top-right');

    this.map.on('load', () => {
      if (this.result) {
        this.visualizeResult();
      }
    });

    // Add click handler for adding jobs/shipments
    this.map.on('click', (e: MapMouseEvent) => {
      this.handleMapClick(e);
    });
  }

  private handleMapClick(e: MapMouseEvent) {
    const { lng, lat } = e.lngLat;

    // Create popup with options
    const popup = new Popup({ closeOnClick: true })
      .setLngLat([lng, lat])
      .setHTML(`
        <div style="padding: 10px;">
          <h4 style="margin: 0 0 10px 0; font-size: 14px;">Add at this location</h4>
          <div style="display: flex; flex-direction: column; gap: 8px;">
            <button id="add-job-btn" style="padding: 8px 12px; background: #27ae60; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 13px;">
              📋 Add Job
            </button>
            <button id="add-shipment-btn" style="padding: 8px 12px; background: #3498db; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 13px;">
              📦 Add Shipment
            </button>
          </div>
        </div>
      `)
      .addTo(this.map!);

    // Add event listeners after popup is added
    setTimeout(() => {
      const jobBtn = document.getElementById('add-job-btn');
      const shipmentBtn = document.getElementById('add-shipment-btn');

      if (jobBtn) {
        jobBtn.onclick = () => {
          this.addJobAtLocation.emit({ lon: lng, lat });
          popup.remove();
        };
      }

      if (shipmentBtn) {
        shipmentBtn.onclick = () => {
          this.addShipmentAtLocation.emit({ lon: lng, lat });
          popup.remove();
        };
      }
    }, 0);
  }

  private async visualizeResult() {
    if (!this.map || !this.result) return;

    this.clearLayers();

    const data = this.result.getData();
    const bounds = new LngLatBounds();
    const totalAgents = data.agents.length;

    // Draw routes for each agent with offset
    const promises = data.agents.map((agent, index) => {
      const color = this.AGENT_COLORS[index % this.AGENT_COLORS.length];
      const offset = this.calculateOffset(index, totalAgents);
      return this.drawAgentRoute(agent, index, color, bounds, offset);
    });

    await Promise.all(promises);

    // Fit map to show all routes
    if (!bounds.isEmpty()) {
      this.map.fitBounds(bounds, { padding: 50 });
    }
  }

  private calculateOffset(agentIndex: number, totalAgents: number): [number, number] {
    if (totalAgents === 1) return [0, 0];
    
    // Offset each route slightly so they don't overlap perfectly
    const maxOffset = 3;
    const step = (maxOffset * 2) / (totalAgents - 1);
    const offsetX = -maxOffset + (step * agentIndex);
    
    return [offsetX, offsetX];
  }

  private async drawAgentRoute(agent: any, agentIndex: number, color: string, bounds: LngLatBounds, offset: [number, number]): Promise<void> {
    if (!agent.waypoints || agent.waypoints.length === 0) return;

    // Extract waypoint locations
    const coordinates: [number, number][] = agent.waypoints.map((wp: any) => {
      const location = wp.location as [number, number];
      bounds.extend(location);
      return location;
    });

    // Fetch route geometry from Routing API
    const mode = this.result!.getData().inputData.mode || 'drive';
    const routeGeometry = await this.fetchRouteGeometry(coordinates, mode);

    if (!routeGeometry) {
      // Fallback to straight lines if API fails
      this.drawSimpleLine(coordinates, agentIndex, color, offset);
      await this.drawWaypoints(agent, agentIndex, color, coordinates);
      return;
    }

    // Create route line with real geometry
    const routeLayerId = `route-${agentIndex}`;
    
    this.map!.addSource(routeLayerId, {
      type: 'geojson',
      data: routeGeometry
    });

    // Add border layer for better visibility
    this.map!.addLayer({
      id: `${routeLayerId}-border`,
      type: 'line',
      source: routeLayerId,
      layout: {
        'line-cap': 'round',
        'line-join': 'round'
      },
      paint: {
        'line-color': '#ffffff',
        'line-width': 6,
        'line-translate': offset
      }
    });

    // Add route line layer with offset
    this.map!.addLayer({
      id: routeLayerId,
      type: 'line',
      source: routeLayerId,
      layout: {
        'line-cap': 'round',
        'line-join': 'round'
      },
      paint: {
        'line-color': color,
        'line-width': 4,
        'line-translate': offset
      }
    });

    this.routeLayers.push(`${routeLayerId}-border`, routeLayerId);

    // Draw waypoints AFTER routes so they appear on top
    await this.drawWaypoints(agent, agentIndex, color, coordinates);
  }

  private async fetchRouteGeometry(waypoints: [number, number][], mode: string): Promise<any> {
    try {
      // Build waypoints parameter - Geoapify expects lon,lat format
      // waypoints come as [lon, lat] from the route planner result
      const waypointsStr = waypoints.map(wp => `${wp[1]},${wp[0]}`).join('|');
      
      // Request GeoJSON format explicitly
      const url = `https://api.geoapify.com/v1/routing?waypoints=${waypointsStr}&mode=${mode}&apiKey=${this.apiKey}`;
      
      const response: any = await this.http.get(url).toPromise();
      
      // The response is already a FeatureCollection in GeoJSON format
      return response;
    } catch (error) {
      console.error('Failed to fetch route geometry:', error);
      return null;
    }
  }

  private drawSimpleLine(coordinates: [number, number][], agentIndex: number, color: string, offset: [number, number]) {
    const routeLayerId = `route-${agentIndex}`;
    const routeData = {
      type: 'Feature' as const,
      geometry: {
        type: 'LineString' as const,
        coordinates
      },
      properties: {}
    };

    this.map!.addSource(routeLayerId, {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: [routeData]
      }
    });

    // Border layer
    this.map!.addLayer({
      id: `${routeLayerId}-border`,
      type: 'line',
      source: routeLayerId,
      layout: {
        'line-cap': 'round',
        'line-join': 'round'
      },
      paint: {
        'line-color': '#ffffff',
        'line-width': 6,
        'line-translate': offset
      }
    });

    // Route layer
    this.map!.addLayer({
      id: routeLayerId,
      type: 'line',
      source: routeLayerId,
      layout: {
        'line-cap': 'round',
        'line-join': 'round'
      },
      paint: {
        'line-color': color,
        'line-width': 4,
        'line-translate': offset
      }
    });

    this.routeLayers.push(`${routeLayerId}-border`, routeLayerId);
  }

  private async drawWaypoints(agent: any, agentIndex: number, color: string, coordinates: [number, number][]) {
    // Load marker icons for start, end, and waypoints
    await this.loadMarkerIcons(agentIndex, color);

    const features = coordinates.map((coord, index) => ({
      type: 'Feature' as const,
      geometry: {
        type: 'Point' as const,
        coordinates: coord
      },
      properties: {
        isStart: index === 0,
        isEnd: index === coordinates.length - 1,
        waypointNumber: index,
        iconName: index === 0 ? `marker-start-${agentIndex}` 
                : index === coordinates.length - 1 ? `marker-end-${agentIndex}`
                : `marker-waypoint-${agentIndex}-${index}`
      }
    }));

    const markersLayerId = `markers-${agentIndex}`;
    
    this.map!.addSource(markersLayerId, {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features
      }
    });

    // Add icon markers using Geoapify Icon API images with text embedded
    this.map!.addLayer({
      id: markersLayerId,
      type: 'symbol',
      source: markersLayerId,
      layout: {
        'icon-image': ['get', 'iconName'],
        'icon-size': 1.0,
        'icon-anchor': 'bottom',
        'icon-allow-overlap': true
      }
    });

    this.markerLayers.push(markersLayerId);
  }

  private async loadMarkerIcons(agentIndex: number, color: string): Promise<void> {
    // URL encode the hex color (replace # with %23)
    const colorEncoded = encodeURIComponent(color);
    
    // Load start marker icon with "S" text
    const startIconUrl = `https://api.geoapify.com/v2/icon/?type=material&color=${colorEncoded}&size=23&iconType=awesome&contentSize=10&text=S&scaleFactor=2&apiKey=${this.apiKey}`;
    await this.loadImage(`marker-start-${agentIndex}`, startIconUrl);

    // Load end marker icon with "E" text
    const endIconUrl = `https://api.geoapify.com/v2/icon/?type=material&color=${colorEncoded}&size=23&iconType=awesome&contentSize=10&text=E&scaleFactor=2&apiKey=${this.apiKey}`;
    await this.loadImage(`marker-end-${agentIndex}`, endIconUrl);

    // Load waypoint marker icons with numbers 1-20
    for (let i = 1; i <= 20; i++) {
      const waypointIconUrl = `https://api.geoapify.com/v2/icon/?type=material&color=${colorEncoded}&size=19&iconType=awesome&contentSize=8&text=${i}&scaleFactor=2&apiKey=${this.apiKey}`;
      await this.loadImage(`marker-waypoint-${agentIndex}-${i}`, waypointIconUrl);
    }
  }

  private async loadImage(name: string, url: string): Promise<void> {
    if (this.map!.hasImage(name)) {
      return;
    }

    try {
      // Fetch the image manually
      const response = await fetch(url);
      const blob = await response.blob();
      const imageBitmap = await createImageBitmap(blob);
      
      if (!this.map!.hasImage(name)) {
        this.map!.addImage(name, imageBitmap as any);
      }
    } catch (error) {
      console.error(`Failed to load image ${name}:`, error);
    }
  }

  private clearLayers() {
    [...this.routeLayers, ...this.markerLayers].forEach(layerId => {
      if (this.map!.getLayer(layerId)) {
        this.map!.removeLayer(layerId);
      }
      if (this.map!.getSource(layerId)) {
        this.map!.removeSource(layerId);
      }
    });

    this.routeLayers = [];
    this.markerLayers = [];
  }

  getAgentColor(index: number): string {
    return this.AGENT_COLORS[index % this.AGENT_COLORS.length];
  }

  formatDistance(meters: number): string {
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(1)} km`;
    }
    return `${meters} m`;
  }

  formatTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  }
}

