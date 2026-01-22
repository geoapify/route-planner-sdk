import { AvoidType } from "../../../types";
import { CoordinatesData } from "./coordinates-data";

export interface AvoidData {
    type?: AvoidType;
    importance?: number;
    values: CoordinatesData[];
}