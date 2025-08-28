import { BaseEntity, RiskLevel, Timestamp, ApiResponse } from "./common";
import { GeoJSONGeometry } from "./geometry";

export interface Demographics {
  readonly children: number;
  readonly adults: number;
  readonly elderly: number;
  readonly vulnerable: number;
  readonly total: number;
}

export interface PopulationData {
  readonly total: number;
  readonly density: number;
  readonly area: number;
  readonly demographics: Demographics;
  readonly source: "estimated" | "census" | "api" | "interpolated";
  readonly confidence: number;
  readonly lastUpdated: Timestamp;
}

export interface HealthcareInfrastructure {
  readonly hospitals: number;
  readonly clinics: number;
  readonly pharmacies: number;
  readonly emergencyServices: number;
  readonly totalFacilities: number;
}

export interface EducationInfrastructure {
  readonly schools: number;
  readonly daycares: number;
  readonly universities: number;
  readonly totalFacilities: number;
}

export interface EmergencyInfrastructure {
  readonly fireStations: number;
  readonly policeStations: number;
  readonly emergencyExits: number;
  readonly totalFacilities: number;
}

export interface ResidentialInfrastructure {
  readonly housingUnits: number;
  readonly apartmentBuildings: number;
  readonly commercialBuildings: number;
  readonly totalBuildings: number;
}

export interface Infrastructure {
  readonly healthcare: HealthcareInfrastructure;
  readonly education: EducationInfrastructure;
  readonly emergency: EmergencyInfrastructure;
  readonly residential: ResidentialInfrastructure;
}

export interface EnvironmentalContext {
  readonly urbanDensity: "low" | "medium" | "high";
  readonly zoneClassification: string;
  readonly accessibilityIndex: number;
  readonly vulnerabilityIndex: number;
}

export interface SensorInfo extends BaseEntity {
  readonly sensorId: string;
  readonly type: string;
  readonly active: boolean;
  readonly ownerName: string;
  readonly ownerEmail: string;
  readonly coordinates: {
    readonly longitude: number;
    readonly latitude: number;
  };
  readonly lastReading?: {
    readonly value: number;
    readonly timestamp: Timestamp;
  };
}

export interface SensorsData {
  readonly total: number;
  readonly active: number;
  readonly inactive: number;
  readonly sensors: readonly SensorInfo[];
  readonly coverage: {
    readonly averageDistance: number;
    readonly density: number;
  };
}

export interface RiskAssessment {
  readonly level: RiskLevel;
  readonly score: number;
  readonly factors: readonly string[];
  readonly recommendations: readonly string[];
  readonly priority: "low" | "medium" | "high" | "urgent";
  readonly lastAssessed: Timestamp;
}

export interface ZoneAnalysis {
  readonly population: PopulationData;
  readonly infrastructure: Infrastructure;
  readonly environmental: EnvironmentalContext;
  readonly sensors: SensorsData;
  readonly riskAssessment: RiskAssessment;
  readonly analysisId: string;
  readonly completedAt: Timestamp;
  readonly processingTime: number;
}

export interface ClientZoneAnalysis {
  readonly zoneName: string;
  readonly geometry: GeoJSONGeometry;
  readonly analysis: ZoneAnalysis;
}

export interface SpatialAnalysisRequest {
  readonly geometry: GeoJSONGeometry;
  readonly name: string;
  readonly options?: {
    readonly includeHistorical?: boolean;
    readonly detailLevel?: "basic" | "detailed" | "comprehensive";
    readonly radiusBuffer?: number; // meters
  };
}

export interface BatchAnalysisRequest {
  readonly zones: ReadonlyArray<SpatialAnalysisRequest>;
  readonly options?: {
    readonly parallel?: boolean;
    readonly maxConcurrency?: number;
  };
}

export interface BatchAnalysisResponse {
  readonly results: ReadonlyArray<ClientZoneAnalysis>;
  readonly summary: {
    readonly totalZones: number;
    readonly successful: number;
    readonly failed: number;
    readonly totalProcessingTime: number;
  };
}

export interface ZoneComparison {
  readonly zoneA: ClientZoneAnalysis;
  readonly zoneB: ClientZoneAnalysis;
  readonly differences: {
    readonly populationDiff: number;
    readonly riskLevelDiff: number;
    readonly infrastructureScore: number;
  };
  readonly recommendation: string;
}

export interface HistoricalAnalysisPoint {
  readonly timestamp: Timestamp;
  readonly analysis: ZoneAnalysis;
  readonly changes?: {
    readonly populationChange: number;
    readonly riskLevelChange: RiskLevel;
    readonly newInfrastructure: string[];
  };
}

export interface TimeSeriesAnalysis {
  readonly zoneId: string;
  readonly timeRange: {
    readonly start: Timestamp;
    readonly end: Timestamp;
  };
  readonly dataPoints: readonly HistoricalAnalysisPoint[];
  readonly trends: {
    readonly populationTrend: "increasing" | "decreasing" | "stable";
    readonly riskTrend: "improving" | "worsening" | "stable";
    readonly developmentRate: number;
  };
}

export const isHighRiskZone = (analysis: ZoneAnalysis): boolean => {
  return (
    analysis.riskAssessment.level === "high" ||
    analysis.riskAssessment.level === "critical"
  );
};

export const hasAdequateHealthcare = (
  infrastructure: Infrastructure,
): boolean => {
  return infrastructure.healthcare.totalFacilities > 0;
};

export const isUrbanArea = (population: PopulationData): boolean => {
  return population.density > 1000;
};

export const requiresImmediateAttention = (
  assessment: RiskAssessment,
): boolean => {
  return assessment.priority === "urgent" || assessment.level === "critical";
};

export type SpatialAnalysisApiResponse = ApiResponse<ClientZoneAnalysis>;
export type BatchAnalysisApiResponse = ApiResponse<BatchAnalysisResponse>;
export type TimeSeriesApiResponse = ApiResponse<TimeSeriesAnalysis>;

export interface AnalysisState {
  readonly currentAnalysis: ClientZoneAnalysis | null;
  readonly isAnalyzing: boolean;
  readonly error: string | null;
  readonly lastAnalyzed: Timestamp | null;
  readonly cache: Map<string, ClientZoneAnalysis>;
}
