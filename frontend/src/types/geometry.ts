import { BaseEntity, RiskLevel, Timestamp, StrictOmit } from "./common";

export interface Point {
  readonly type: "Point";
  readonly coordinates: readonly [number, number];
}

export interface Polygon {
  readonly type: "Polygon";
  readonly coordinates: readonly (readonly [number, number])[][];
}

export interface MultiPolygon {
  readonly type: "MultiPolygon";
  readonly coordinates: readonly (readonly (readonly [number, number])[])[][];
}

export type GeoJSONGeometry = Point | Polygon | MultiPolygon;

export const SHAPE_TYPES = ["rectangle", "polygon", "circle"] as const;
export type ShapeType = (typeof SHAPE_TYPES)[number];

export type ComplianceStatus = "compliant" | "warning" | "violation";

export interface EnvironmentalAnalysis {
  readonly totalArea: number;
  readonly riskLevel: RiskLevel;
  readonly affectedPopulation: number;
  readonly complianceStatus: ComplianceStatus;
  readonly recommendations: readonly string[];
  readonly lastAnalyzed: Timestamp;
  readonly confidence: number;
}

interface BaseZone extends BaseEntity {
  readonly name: string;
  readonly type: ShapeType;
  readonly geometry: GeoJSONGeometry;
  readonly color: string;
  readonly description?: string;
}

export interface ZoneWithoutAnalysis extends BaseZone {
  readonly hasAnalysis: false;
  readonly selected: boolean;
}

export interface ZoneWithAnalysis extends BaseZone {
  readonly hasAnalysis: true;
  readonly selected: boolean;
  readonly environmentalAnalysis: EnvironmentalAnalysis;
}

export interface ClientZone {
  id: string;
  name: string;
  type: "rectangle" | "polygon" | "circle";
  geometry: any;
  selected: boolean;
  color: string;
  created?: Date;
  createdAt?: string;
  updatedAt?: string;
  radius?: number;
  hasAnalysis?: boolean;
  environmentalAnalysis?: {
    totalArea: number;
    riskLevel: "low" | "moderate" | "high" | "critical";
    affectedPopulation: number;
    complianceStatus: "compliant" | "warning" | "violation";
    recommendations: string[];
    lastAnalyzed?: string;
    confidence?: number;
  };
}

export type StrictClientZone = ZoneWithoutAnalysis | ZoneWithAnalysis;

export interface CircleZoneExtended extends ZoneWithoutAnalysis {
  readonly type: "circle";
  readonly geometry: Point;
  readonly radius: number;
}

export interface RectangleZoneExtended extends ZoneWithoutAnalysis {
  readonly type: "rectangle";
  readonly geometry: Polygon;
  readonly bounds?: {
    readonly north: number;
    readonly south: number;
    readonly east: number;
    readonly west: number;
  };
}

export interface PolygonZoneExtended extends ZoneWithoutAnalysis {
  readonly type: "polygon";
  readonly geometry: Polygon | MultiPolygon;
}

export interface CreateZonePayload {
  readonly name: string;
  readonly type: ShapeType;
  readonly geometry: GeoJSONGeometry;
  readonly color?: string;
  readonly description?: string;
  readonly radius?: number;
}

export type UpdateZonePayload = Partial<
  StrictOmit<CreateZonePayload, "type">
> & {
  readonly id: string;
};

export interface ZoneSelectionState {
  readonly selectedIds: readonly string[];
  readonly zones: readonly ClientZone[];
}

export const hasEnvironmentalAnalysis = (
  zone: ClientZone,
): zone is ClientZone & {
  environmentalAnalysis: NonNullable<ClientZone["environmentalAnalysis"]>;
} => {
  return !!zone.environmentalAnalysis;
};

export const isCircleZone = (
  zone: ClientZone,
): zone is ClientZone & { type: "circle"; radius?: number } => {
  return zone.type === "circle";
};

export const isRectangleZone = (
  zone: ClientZone,
): zone is ClientZone & { type: "rectangle" } => {
  return zone.type === "rectangle";
};

export const isPolygonZone = (
  zone: ClientZone,
): zone is ClientZone & { type: "polygon" } => {
  return zone.type === "polygon";
};

export const isValidPoint = (geometry: any): geometry is Point => {
  return (
    geometry &&
    geometry.type === "Point" &&
    Array.isArray(geometry.coordinates) &&
    geometry.coordinates.length === 2 &&
    typeof geometry.coordinates[0] === "number" &&
    typeof geometry.coordinates[1] === "number"
  );
};

export const isValidPolygon = (geometry: any): geometry is Polygon => {
  return (
    geometry &&
    geometry.type === "Polygon" &&
    Array.isArray(geometry.coordinates) &&
    geometry.coordinates.length > 0 &&
    Array.isArray(geometry.coordinates[0]) &&
    geometry.coordinates[0].length >= 4
  );
};
