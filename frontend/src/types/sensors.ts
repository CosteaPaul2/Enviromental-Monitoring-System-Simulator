export type SensorType =
  | "TEMPERATURE"
  | "HUMIDITY"
  | "AIR_QUALITY"
  | "LIGHT"
  | "NOISE"
  | "CO2";

export interface SensorReading {
  value: number;
  unit: string;
  timestamp: string;
}

export interface Sensor {
  id: string;
  name: string;
  type: SensorType;
  active: boolean;
  latitude?: number;
  longitude?: number;
}

export interface SensorStats {
  average: number;
  minimum: number;
  maximum: number;
  trend: number;
}

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
