interface RoutePlannerTimeLineOptions {
  menu?: Array<RoutePlannerTimeLineOptionMenu>;
  showWaypointPopup?: boolean;
  waypointPopupGenerator?: (waypoint: any) => HTMLElement;
}

interface RoutePlannerTimeLineOptionMenu {
    key: string;
    label: string;
    callback: () => void;
}