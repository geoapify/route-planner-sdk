import {TimeframeOption} from "./timeframe-option";
import {ProbableOption} from "./probable-option";
import {ShipmentDurationOption} from "./shipment-duration-option";
import {CapabilityOption} from "./capability-option";

export interface Scenario {
    id: string;
    mode: 'drive' | 'truck' | 'bicycle' | 'walk' ;
    agentIcon?: string;
    label: string;
    description: string;
    agentLabel: string;

    itemType?: 'pizza',

    capacityUnit?: string;

    agentFromCategory?: string[];
    agentToCategory?: string[];

    agentsNumberOfFromLocations?: number;
    agentsNumberOfToLocations?: number;

    agentTimeframeOptions?: TimeframeOption[]

    agentPickupCapacityOptions?: ProbableOption[];
    agentDeliveryCapacityOptions?: ProbableOption[];

    storageCenterCategory?: string[];
    storageCenterLocations?: number;
    storageLabel?: string;

    startFromStorage?: boolean;
    returnToStart?: boolean;

    waypointLocationCategories: string[];
    waypointPickupAmountOptions?: ProbableOption[];
    waypointDeliveryAmountOptions?: ProbableOption[];

    waypointPickupItemsOptions?: ProbableOption[];
    waypointDeliveryItemsOptions?: ProbableOption[];

    shipmentDurationOptions?: ShipmentDurationOption[];
    shipmentAmountOptions?: ProbableOption[];

    jobDurationOptions?: ProbableOption[];

    waypointPriorityOptions?: ProbableOption[];

    waypointTimeframeOptions?: TimeframeOption[];

    capabilityOptions?: CapabilityOption[];

    numberOfWaypoints: number;
    numberOfAgents: number;
}
