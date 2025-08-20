import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAirQualityColor, getTemperatureColor, getHumidityColor } from '@/styles/theme';
import type { SensorReading, SensorType } from '@/types/sensors';

interface UseSensorDataProps {
  sensorId: string;
  type: SensorType;
  timeRange?: '1h' | '24h' | '7d' | '30d';
}

export function useSensorData({ sensorId, type, timeRange = '24h' }: UseSensorDataProps) {
  const [latestReading, setLatestReading] = useState<SensorReading | null>(null);

  // Fetch historical data
  const { data: historicalData, isLoading } = useQuery(
    ['sensor-data', sensorId, timeRange],
    () => fetch(`/api/sensors/${sensorId}/readings?timeRange=${timeRange}`).then(res => res.json()),
    {
      refetchInterval: 60000, // Refetch every minute
    }
  );

  // Subscribe to real-time updates
  useEffect(() => {
    const ws = new WebSocket(`ws://localhost:3000/ws/sensors/${sensorId}`);

    ws.onmessage = (event) => {
      const reading = JSON.parse(event.data);
      setLatestReading(reading);
    };

    return () => ws.close();
  }, [sensorId]);

  // Calculate statistics and trends
  const stats = useMemo(() => {
    if (!historicalData?.readings) return null;

    const readings = historicalData.readings;
    const values = readings.map((r: SensorReading) => r.value);

    const avg = values.reduce((a: number, b: number) => a + b, 0) / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);

    // Calculate trend (positive or negative)
    const recentValues = values.slice(-5);
    const trend = recentValues[recentValues.length - 1] - recentValues[0];

    return {
      average: avg,
      minimum: min,
      maximum: max,
      trend,
    };
  }, [historicalData]);

  // Get appropriate color based on sensor type and value
  const getValueColor = (value: number) => {
    switch (type) {
      case 'AIR_QUALITY':
        return getAirQualityColor(value);
      case 'TEMPERATURE':
        return getTemperatureColor(value);
      case 'HUMIDITY':
        return getHumidityColor(value);
      default:
        return 'text-default-500';
    }
  };

  // Format value based on sensor type
  const formatValue = (value: number) => {
    switch (type) {
      case 'TEMPERATURE':
        return `${value.toFixed(1)}°C`;
      case 'HUMIDITY':
        return `${value.toFixed(1)}%`;
      case 'AIR_QUALITY':
        return `${value.toFixed(0)} PPM`;
      case 'LIGHT':
        return `${value.toFixed(0)} LUX`;
      case 'NOISE':
        return `${value.toFixed(1)} dB`;
      case 'CO2':
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