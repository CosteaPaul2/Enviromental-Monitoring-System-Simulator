import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import axios from "axios";
import Cookies from "js-cookie";

import { Sensor } from "@/lib/sensorsApi";

interface HistoricalDataContextType {
  isHistoricalMode: boolean;
  selectedDateTime: Date;
  historicalSensors: Sensor[];
  historicalShapes: any[];
  isLoading: boolean;
  error: string | null;

  // Actions
  setHistoricalMode: (enabled: boolean) => void;
  setSelectedDateTime: (dateTime: Date) => void;
  loadHistoricalData: (dateTime: Date) => Promise<void>;
  refreshHistoricalData: () => Promise<void>;
}

const HistoricalDataContext = createContext<
  HistoricalDataContextType | undefined
>(undefined);

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

interface HistoricalDataProviderProps {
  children: ReactNode;
}

export function HistoricalDataProvider({
  children,
}: HistoricalDataProviderProps) {
  const [isHistoricalMode, setIsHistoricalMode] = useState(false);
  const [selectedDateTime, setSelectedDateTime] = useState(new Date());
  const [historicalSensors, setHistoricalSensors] = useState<Sensor[]>([]);
  const [historicalShapes, setHistoricalShapes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setHistoricalMode = (enabled: boolean) => {
    setIsHistoricalMode(enabled);
    if (!enabled) {
      // Clear historical data when switching back to live mode
      setHistoricalSensors([]);
      setHistoricalShapes([]);
      setError(null);
    }
  };

  const setSelectedDateTimeAndLoad = (dateTime: Date) => {
    setSelectedDateTime(dateTime);
    if (isHistoricalMode) {
      loadHistoricalData(dateTime);
    }
  };

  const loadHistoricalData = async (dateTime: Date) => {
    if (!isHistoricalMode) return;

    try {
      setIsLoading(true);
      setError(null);

      console.log("🕐 Loading historical data for:", dateTime.toISOString());

      // Load historical sensors with their states at the specified time
      const sensorsResponse = await api.get("/sensors/historical", {
        params: {
          timestamp: dateTime.toISOString(),
        },
      });

      if (sensorsResponse.data.success) {
        setHistoricalSensors(sensorsResponse.data.data.sensors || []);
      }

      // Load historical shapes with pollution analysis at the specified time
      const shapesResponse = await api.get("/shapes/historical", {
        params: {
          timestamp: dateTime.toISOString(),
        },
      });

      if (shapesResponse.data.success) {
        setHistoricalShapes(shapesResponse.data.data.shapes || []);
      }

      console.log("✅ Historical data loaded successfully");
    } catch (error: any) {
      console.error("❌ Failed to load historical data:", error);
      setError(
        error.response?.data?.message || "Failed to load historical data",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const refreshHistoricalData = async () => {
    if (isHistoricalMode) {
      await loadHistoricalData(selectedDateTime);
    }
  };

  // Load historical data when historical mode is enabled or date changes
  useEffect(() => {
    if (isHistoricalMode) {
      loadHistoricalData(selectedDateTime);
    }
  }, [isHistoricalMode]);

  const value: HistoricalDataContextType = {
    isHistoricalMode,
    selectedDateTime,
    historicalSensors,
    historicalShapes,
    isLoading,
    error,

    setHistoricalMode,
    setSelectedDateTime: setSelectedDateTimeAndLoad,
    loadHistoricalData,
    refreshHistoricalData,
  };

  return (
    <HistoricalDataContext.Provider value={value}>
      {children}
    </HistoricalDataContext.Provider>
  );
}

export function useHistoricalData() {
  const context = useContext(HistoricalDataContext);

  if (context === undefined) {
    throw new Error(
      "useHistoricalData must be used within a HistoricalDataProvider",
    );
  }

  return context;
}
