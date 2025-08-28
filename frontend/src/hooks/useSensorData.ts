import type { SensorReading, SensorType } from "@/types/sensors";

import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import {
  getAirQualityColor,
  getTemperatureColor,
  getHumidityColor,
} from "@/styles/theme";

interface UseSensorDataProps {
  sensorId: string;
  type: SensorType;
  timeRange?: "1h" | "24h" | "7d" | "30d";
}

export function useSensorData({
  sensorId,
  type,
  timeRange = "24h",
}: UseSensorDataProps) {
  const [latestReading, setLatestReading] = useState<SensorReading | null>(
    null,
  );

  const { data: historicalData, isLoading } = useQuery({
    queryKey: ["sensor-data", sensorId, timeRange],
    queryFn: () =>
      fetch(`/api/sensors/${sensorId}/readings?timeRange=${timeRange}`).then(
        (res) => res.json(),
      ),
    refetchInterval: 60000,
  });

  useEffect(() => {
    const ws = new WebSocket(`ws://localhost:3000/ws/sensors/${sensorId}`);

    ws.onmessage = (event) => {
      const reading = JSON.parse(event.data);

      setLatestReading(reading);
    };

    return () => ws.close();
  }, [sensorId]);

  const stats = useMemo(() => {
    if (!historicalData || !historicalData.readings) return null;

    const readings = historicalData.readings;
    const values = readings.map((r: SensorReading) => r.value);

    const avg =
      values.reduce((a: number, b: number) => a + b, 0) / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);

    const recentValues = values.slice(-5);
    const trend = recentValues[recentValues.length - 1] - recentValues[0];

    return {
      average: avg,
      minimum: min,
      maximum: max,
      trend,
    };
  }, [historicalData]);

  const getValueColor = (value: number) => {
    switch (type) {
      case "AIR_QUALITY":
        return getAirQualityColor(value);
      case "TEMPERATURE":
        return getTemperatureColor(value);
      case "HUMIDITY":
        return getHumidityColor(value);
      default:
        return "text-default-500";
    }
  };

  const formatValue = (value: number) => {
    switch (type) {
      case "TEMPERATURE":
        return `${value.toFixed(1)}°C`;
      case "HUMIDITY":
        return `${value.toFixed(1)}%`;
      case "AIR_QUALITY":
        return `${value.toFixed(0)} PPM`;
      case "LIGHT":
        return `${value.toFixed(0)} LUX`;
      case "NOISE":
        return `${value.toFixed(1)} dB`;
      case "CO2":
        return `${value.toFixed(0)} PPM`;
      default:
        return value.toString();
    }
  };

  return {
    latestReading,
    historicalData,
    isLoading,
    stats,
    getValueColor,
    formatValue,
  };
}
