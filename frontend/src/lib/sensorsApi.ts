import axios from "axios";
import Cookies from "js-cookie";

const api = axios.create({
  baseURL: "http://localhost:3333",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = Cookies.get("access_token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export interface Sensor {
  id: number;
  sensorId: string;
  type: "TEMPERATURE" | "HUMIDITY" | "AIR_QUALITY" | "LIGHT" | "NOISE" | "CO2";
  active: boolean;
  userId: string;
  createdAt: string;
  updatedAt: string;
  latitude?: number | null;
  longitude?: number | null;
  user: {
    id: string;
    email: string;
    name: string;
  };
}

export interface SensorReading {
  id: number;
  sensorId: number;
  timestamp: string;
  value: number;
  unit: "CELSIUS" | "FAHRENHEIT" | "RH_PERCENTAGE" | "PPM" | "LUX" | "DB";
}

export interface CreateSensorRequest {
  sensorId: string;
  type: Sensor["type"];
}

export interface SensorLocation {
  latitude: number;
  longitude: number;
}

export const sensorTypes = [
  {
    value: "TEMPERATURE",
    label: "Temperature",
    icon: "tabler:temperature",
    color: "#ff6b6b",
    unit: "°C",
  },
  {
    value: "HUMIDITY",
    label: "Humidity",
    icon: "tabler:cloud-rain",
    color: "#4ecdc4",
    unit: "%",
  },
  {
    value: "AIR_QUALITY",
    label: "Air Quality",
    icon: "tabler:wind",
    color: "#6680a0",
    unit: "PPM",
  },
  {
    value: "LIGHT",
    label: "Light",
    icon: "tabler:sun",
    color: "#f9ca24",
    unit: "LUX",
  },
  {
    value: "NOISE",
    label: "Noise",
    icon: "tabler:volume-2",
    color: "#f0932b",
    unit: "dB",
  },
  {
    value: "CO2",
    label: "CO2",
    icon: "tabler:building-factory",
    color: "#6c5ce7",
    unit: "PPM",
  },
] as const;

export const sensorsApi = {
  getSensors: async (): Promise<{
    success: boolean;
    data?: { sensors: Sensor[] };
  }> => {
    const response = await api.get("/sensors");

    return response.data;
  },

  createSensor: async (
    data: CreateSensorRequest,
  ): Promise<{ success: boolean; data?: { sensor: Sensor } }> => {
    const response = await api.post("/sensor", data);

    return response.data;
  },

  toggleSensor: async (sensorId: string): Promise<{ success: boolean }> => {
    const response = await api.post("/sensorToggle", { sensorId });

    return response.data;
  },

  setSensorLocation: async (
    sensorId: string,
    location: SensorLocation,
  ): Promise<{ success: boolean }> => {
    const response = await api.post("/sensorLocation", {
      sensorId,
      latitude: location.latitude,
      longitude: location.longitude,
    });

    return response.data;
  },

  getSensorReadings: async (
    sensorId: number,
    startDate?: string,
    endDate?: string,
  ): Promise<{ success: boolean; data?: { readings: SensorReading[] } }> => {
    const params = new URLSearchParams();

    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);

    const response = await api.get(
      `/sensors/${sensorId}/readings?${params.toString()}`,
    );

    return response.data;
  },

  getLatestReading: async (
    sensorId: number,
  ): Promise<{ success: boolean; data?: { reading: SensorReading } }> => {
    const response = await api.get(`/sensors/${sensorId}/latest`);

    return response.data;
  },
};

export const shapesApi = {
  getShapeDetails: async (
    shapeId: number,
  ): Promise<{ success: boolean; data?: any }> => {
    const response = await api.get(`/shapes/${shapeId}/details`);

    return response.data;
  },

  getShapesWithGeometry: async (): Promise<{
    success: boolean;
    data?: any;
  }> => {
    const response = await api.get("/shapes/geometry");

    return response.data;
  },

  createShape: async (
    shapeData: any,
  ): Promise<{ success: boolean; data?: any }> => {
    const response = await api.post("/shapes", shapeData);

    return response.data;
  },

  updateShape: async (
    shapeId: number,
    shapeData: any,
  ): Promise<{ success: boolean; data?: any }> => {
    const response = await api.put(`/shapes/${shapeId}`, shapeData);

    return response.data;
  },

  deleteShape: async (shapeId: number): Promise<{ success: boolean }> => {
    const response = await api.delete(`/shapes/${shapeId}`);

    return response.data;
  },
};

export const formatSensorValue = (
  value: number,
  type: Sensor["type"],
): string => {
  const sensorType = sensorTypes.find((t) => t.value === type);

  if (!sensorType) return `${value}`;

  switch (type) {
    case "TEMPERATURE":
      return `${value.toFixed(1)}${sensorType.unit}`;
    case "HUMIDITY":
      return `${value.toFixed(0)}${sensorType.unit}`;
    case "AIR_QUALITY":
    case "CO2":
      return `${value.toFixed(0)} ${sensorType.unit}`;
    case "LIGHT":
      return `${value.toFixed(0)} ${sensorType.unit}`;
    case "NOISE":
      return `${value.toFixed(1)} ${sensorType.unit}`;
    default:
      return `${value} ${sensorType.unit}`;
  }
};

export const getSensorTypeInfo = (type: Sensor["type"]) => {
  return sensorTypes.find((t) => t.value === type);
};

export const getStatusColor = (status: string) => {
  switch (status) {
    case "active":
      return "success";
    case "inactive":
      return "danger";
    default:
      return "default";
  }
};

export const getPollutionColor = (
  level: "good" | "moderate" | "unhealthy" | "dangerous" | "no-data" | string,
): string => {
  switch (level) {
    case "good":
      return "#22c55e"; // Green
    case "moderate":
      return "#f59e0b"; // Yellow/Orange
    case "unhealthy":
      return "#ef4444"; // Red
    case "dangerous":
      return "#7c2d12"; // Dark red
    case "no-data":
      return "#6b7280"; // Gray
    default:
      return "#6b7280";
  }
};

export const getPollutionIcon = (
  level: "good" | "moderate" | "unhealthy" | "dangerous" | "no-data" | string,
): string => {
  switch (level) {
    case "good":
      return "tabler:shield-check";
    case "moderate":
      return "tabler:shield-exclamation";
    case "unhealthy":
      return "tabler:shield-x";
    case "dangerous":
      return "tabler:alert-triangle";
    case "no-data":
      return "tabler:question-mark";
    default:
      return "tabler:question-mark";
  }
};
