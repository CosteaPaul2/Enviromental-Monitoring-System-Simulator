import { useState, useEffect, useCallback } from "react";
import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:3333",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = document.cookie
    .split(";")
    .find((row) => row.trim().startsWith("access_token="))
    ?.split("=")[1];

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

interface UseMapDataProps {
  readonly isAuthenticated: boolean;
  readonly isHistoricalMode: boolean;
  readonly selectedDateTime: Date;
  readonly sensorUpdateTrigger: number;
  readonly shapeUpdateTrigger: number;
}

interface MapDataState {
  readonly savedShapes: readonly any[];
  readonly loading: boolean;
  readonly error: string | null;
}

interface MapDataActions {
  readonly loadSavedShapes: () => Promise<void>;
  readonly refreshData: () => Promise<void>;
}

export const useMapData = ({
  isAuthenticated,
  isHistoricalMode,
  selectedDateTime,
  sensorUpdateTrigger,
  shapeUpdateTrigger,
}: UseMapDataProps): MapDataState & MapDataActions => {
  const [savedShapes, setSavedShapes] = useState<readonly any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const processShapeData = useCallback((shapes: any[]) => {
    return shapes
      .map((shape: any) => {
        try {
          let geometry = shape.geometry;

          if (typeof geometry === "string") {
            geometry = JSON.parse(geometry);
          }

          return {
            type: "Feature",
            geometry: geometry,
            properties: {
              id: shape.id,
              name: shape.name,
              type: shape.type,
              createdAt: shape.createdAt,
              updatedAt: shape.updatedAt,
              pollutionLevel: shape.pollutionLevel,
              alertLevel: shape.alertLevel,
              riskScore: shape.riskScore,
              sensorCount: shape.sensorCount,
              activeSensorCount: shape.activeSensorCount,
            },
            pollutionLevel: shape.pollutionLevel,
            alertLevel: shape.alertLevel,
            riskScore: shape.riskScore,
            id: shape.id,
            name: shape.name,
          };
        } catch (err) {
          console.error("Error processing shape:", shape, err);

          return null;
        }
      })
      .filter(Boolean);
  }, []);

  const loadSavedShapes = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      setError(null);

      const endpoint = isHistoricalMode
        ? "/shapes/historical"
        : "/shapes/geometry";
      const params = isHistoricalMode
        ? { timestamp: selectedDateTime.toISOString() }
        : {};

      const response = await api.get(endpoint, { params });

      if (response.data.success && response.data.data) {
        const processedShapes = processShapeData(response.data.data.shapes);

        setSavedShapes(processedShapes);
      }
    } catch (error) {
      console.error("Failed to load shapes:", error);
      setError("Failed to load shapes");

      try {
        const fallbackResponse = await api.get("/shapes");

        if (fallbackResponse.data.success && fallbackResponse.data.data) {
          setSavedShapes([]);
        }
      } catch (fallbackError) {
        console.error("Fallback also failed:", fallbackError);
        setError("Failed to load shapes data");
      }
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, isHistoricalMode, selectedDateTime, processShapeData]);

  const refreshData = useCallback(async () => {
    setLoading(true);
    await loadSavedShapes();
  }, [loadSavedShapes]);

  useEffect(() => {
    if (isAuthenticated) {
      loadSavedShapes();
    }
  }, [isAuthenticated, shapeUpdateTrigger, loadSavedShapes]);

  useEffect(() => {
    if (!isAuthenticated || isHistoricalMode) return;

    const pollInterval = setInterval(() => {
      loadSavedShapes();
    }, 20000);

    return () => clearInterval(pollInterval);
  }, [isAuthenticated, isHistoricalMode, loadSavedShapes]);

  useEffect(() => {
    if (isAuthenticated && sensorUpdateTrigger > 0) {
      const timeout = setTimeout(() => {
        loadSavedShapes();
      }, 2000);

      return () => clearTimeout(timeout);
    }
  }, [sensorUpdateTrigger, isAuthenticated, loadSavedShapes]);

  return {
    savedShapes,
    loading,
    error,
    loadSavedShapes,
    refreshData,
  };
};
