import {
  BaseEntity,
  Coordinates,
  OptionalCoordinates,
  Timestamp,
  EntityStatus,
  RequiredFields,
  StrictOmit,
} from "./common";

export const SENSOR_TYPES = [
  "TEMPERATURE",
  "HUMIDITY",
  "AIR_QUALITY",
  "LIGHT",
  "NOISE",
  "CO2",
] as const;
export type SensorType = (typeof SENSOR_TYPES)[number];

export interface SensorReading {
  readonly value: number;
  readonly unit: string;
  readonly timestamp: Timestamp;
  readonly quality?: "good" | "fair" | "poor";
}

export interface HistoricalSensorReading extends SensorReading {
  readonly sensorId: string;
  readonly interpolated: boolean;
}

interface BaseSensor extends BaseEntity {
  readonly name: string;
  readonly type: SensorType;
  readonly status: EntityStatus;
  readonly description?: string;
  readonly batteryLevel?: number;
}

export interface SensorWithoutLocation extends BaseSensor {
  readonly hasLocation: false;
}

export interface SensorWithLocation
  extends BaseSensor,
    RequiredFields<Coordinates, "latitude" | "longitude"> {
  readonly hasLocation: true;
}

export type Sensor = SensorWithoutLocation | SensorWithLocation;

export interface SensorFormData
  extends StrictOmit<BaseSensor, "id" | "createdAt" | "updatedAt">,
    OptionalCoordinates {
  readonly sensorId?: string;
}

export interface SensorStats {
  readonly average: number;
  readonly minimum: number;
  readonly maximum: number;
  readonly trend: number;
  readonly sampleCount: number;
  readonly timeRange: {
    readonly start: Timestamp;
    readonly end: Timestamp;
  };
}

export interface LiveSensor extends SensorWithLocation {
  readonly latestReading?: SensorReading;
  readonly stats?: SensorStats;
  readonly lastSeen: Timestamp;
  readonly isOnline: boolean;
}

export const isSensorWithLocation = (
  sensor: Sensor,
): sensor is SensorWithLocation => {
  return sensor.hasLocation;
};

export const isSensorOnline = (sensor: LiveSensor): boolean => {
  const now = new Date();
  const lastSeen = new Date(sensor.lastSeen);
  const minutesOffline = (now.getTime() - lastSeen.getTime()) / (1000 * 60);

  return minutesOffline < 5;
};

export type CreateSensorPayload = StrictOmit<SensorFormData, "status"> & {
  readonly initialLocation?: Coordinates;
};

export type UpdateSensorPayload = Partial<
  StrictOmit<CreateSensorPayload, "type">
>;

export const SENSOR_CONFIG = {
  TEMPERATURE: {
    icon: "tabler:temperature",
    label: "Temperature",
    unit: "°C",
  },
  HUMIDITY: {
    icon: "tabler:cloud-rain",
    label: "Humidity",
    unit: "%",
  },
  AIR_QUALITY: {
    icon: "tabler:wind",
    label: "Air Quality",
    unit: "PPM",
  },
  LIGHT: {
    icon: "tabler:sun",
    label: "Light",
    unit: "LUX",
  },
  NOISE: {
    icon: "tabler:volume-2",
    label: "Noise",
    unit: "dB",
  },
  CO2: {
    icon: "tabler:building-factory",
    label: "CO2",
    unit: "PPM",
  },
} as const;
