import { useState, useEffect, useCallback, useRef } from "react";

import PollutionMonitorService, {
  PollutionAlert,
  ShapeWithPollution,
  PollutionMonitorStats,
} from "@/lib/pollutionMonitor";
import { usePollutionNotification } from "@/contexts/NotificationContext";

interface UsePollutionMonitorOptions {
  enableNotifications?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number;
  notificationThreshold?: "low" | "medium" | "high" | "critical";
  maxAlertsDisplayed?: number;
  alertCacheDuration?: number;
}

interface UsePollutionMonitorReturn {
  alerts: PollutionAlert[];
  shapes: ShapeWithPollution[];
  stats: PollutionMonitorStats;
  loading: boolean;
  error: string | null;
  lastUpdate: Date | null;
  refreshData: () => Promise<void>;
  getAlertsByLevel: (level: PollutionAlert["alertLevel"]) => PollutionAlert[];
  getHighPriorityAlerts: () => PollutionAlert[];
  getRecentAlerts: (limit?: number) => PollutionAlert[];
}

export const usePollutionMonitor = (
  options: UsePollutionMonitorOptions = {},
): UsePollutionMonitorReturn => {
  const {
    enableNotifications = false,
    autoRefresh = true,
    refreshInterval = 30000,
    notificationThreshold = "medium",
    maxAlertsDisplayed = 8,
    alertCacheDuration = 300000,
  } = options;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [alerts, setAlerts] = useState<PollutionAlert[]>([]);
  const [shapes, setShapes] = useState<ShapeWithPollution[]>([]);
  const [stats, setStats] = useState<PollutionMonitorStats>({
    totalShapes: 0,
    shapesWithAlerts: 0,
    criticalAlerts: 0,
    highAlerts: 0,
    mediumAlerts: 0,
    lowAlerts: 0,
    totalSensors: 0,
    activeSensors: 0,
    averageRiskScore: 0,
  });
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [previousAlerts] = useState<string[]>([]);

  const alertCache = useRef<
    Map<string, { alert: PollutionAlert; timestamp: number }>
  >(new Map());
  const notificationCache = useRef<Set<string>>(new Set());
  const lastNotificationTime = useRef<Map<string, number>>(new Map());

  const addPollutionNotification = usePollutionNotification();
  const pollutionService = PollutionMonitorService.getInstance();

  const filterAndCacheAlerts = useCallback(
    (newAlerts: PollutionAlert[]): PollutionAlert[] => {
      const now = Date.now();
      const filteredAlerts: PollutionAlert[] = [];

      for (const [key, cached] of alertCache.current.entries()) {
        if (now - cached.timestamp > alertCacheDuration) {
          alertCache.current.delete(key);
        }
      }

      for (const alert of newAlerts) {
        const alertKey = `${alert.shapeId}-${alert.alertLevel}-${alert.level}`;
        const cached = alertCache.current.get(alertKey);

        const isNewAlert = !cached;
        const isCritical =
          alert.alertLevel === "critical" || alert.alertLevel === "high";
        const hasSignificantChange =
          cached && Math.abs(alert.riskScore - cached.alert.riskScore) > 20;

        if (isNewAlert || isCritical || hasSignificantChange) {
          alertCache.current.set(alertKey, { alert, timestamp: now });
          filteredAlerts.push(alert);
        } else if (cached) {
          filteredAlerts.push(cached.alert);
        }
      }

      return filteredAlerts
        .sort((a, b) => {
          const priorityOrder = {
            critical: 4,
            high: 3,
            medium: 2,
            low: 1,
            none: 0,
          };
          const aPriority = priorityOrder[a.alertLevel] || 0;
          const bPriority = priorityOrder[b.alertLevel] || 0;

          if (aPriority !== bPriority) return bPriority - aPriority;

          return (
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          );
        })
        .slice(0, maxAlertsDisplayed);
    },
    [alertCacheDuration, maxAlertsDisplayed],
  );

  const refreshData = useCallback(async () => {
    try {
      setError(null);

      const shapesData = await pollutionService.fetchPollutionData();

      setShapes(shapesData);

      const detailedAlerts = await pollutionService.getDetailedAlerts();

      const filteredAlerts = filterAndCacheAlerts(detailedAlerts);

      setAlerts(filteredAlerts);

      const newStats = pollutionService.generateStats(shapesData);

      setStats(newStats);

      setLastUpdate(new Date());

      if (enableNotifications) {
        const now = Date.now();
        const minNotificationInterval = 120000;

        const alertsToNotify = filteredAlerts.filter((alert) => {
          const alertId = `${alert.shapeId}-${alert.alertLevel}`;
          const notificationKey = `${alert.shapeId}-notification`;

          const lastNotification =
            lastNotificationTime.current.get(notificationKey);
          const tooSoon =
            lastNotification &&
            now - lastNotification < minNotificationInterval;
          const shouldNotify = shouldNotifyForAlert(
            alert.alertLevel,
            notificationThreshold,
          );
          const isFirstTime = !notificationCache.current.has(alertId);
          const isCritical =
            alert.alertLevel === "critical" || alert.alertLevel === "high";

          return shouldNotify && !tooSoon && (isFirstTime || isCritical);
        });

        alertsToNotify.forEach((alert) => {
          const alertId = `${alert.shapeId}-${alert.alertLevel}`;
          const notificationKey = `${alert.shapeId}-notification`;

          const details =
            alert.pollutionFactors.length > 0
              ? alert.pollutionFactors.slice(0, 2).join(", ")
              : `Risk Score: ${alert.riskScore}`;

          addPollutionNotification(alert.level, alert.area, details, {
            persistent: alert.alertLevel === "critical",
            duration: alert.alertLevel === "critical" ? 0 : 8000,
          });

          notificationCache.current.add(alertId);
          lastNotificationTime.current.set(notificationKey, now);
        });
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load pollution data",
      );
      console.error("Failed to refresh pollution data:", err);
    } finally {
      setLoading(false);
    }
  }, [
    enableNotifications,
    notificationThreshold,
    addPollutionNotification,
    previousAlerts,
  ]);

  const shouldNotifyForAlert = (
    alertLevel: string,
    threshold: string,
  ): boolean => {
    const levels = ["low", "medium", "high", "critical"];
    const alertLevelIndex = levels.indexOf(alertLevel);
    const thresholdIndex = levels.indexOf(threshold);

    return (
      alertLevelIndex >= thresholdIndex &&
      (alertLevel === "high" || alertLevel === "critical")
    );
  };

  const getAlertsByLevel = useCallback(
    (level: PollutionAlert["alertLevel"]) => {
      return alerts.filter((alert) => alert.alertLevel === level);
    },
    [alerts],
  );

  const getHighPriorityAlerts = useCallback(() => {
    return alerts.filter(
      (alert) => alert.alertLevel === "critical" || alert.alertLevel === "high",
    );
  }, [alerts]);

  const getRecentAlerts = useCallback(
    (limit: number = 5) => {
      return alerts
        .sort(
          (a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
        )
        .slice(0, limit);
    },
    [alerts],
  );

  useEffect(() => {
    refreshData();

    if (autoRefresh) {
      const interval = setInterval(refreshData, refreshInterval);

      return () => clearInterval(interval);
    }
  }, [refreshData, autoRefresh, refreshInterval]);

  useEffect(() => {
    if (autoRefresh) {
      pollutionService.startMonitoring(refreshInterval);

      return () => pollutionService.stopMonitoring();
    }
  }, [autoRefresh, refreshInterval]);

  return {
    alerts,
    shapes,
    stats,
    loading,
    error,
    lastUpdate,
    refreshData,
    getAlertsByLevel,
    getHighPriorityAlerts,
    getRecentAlerts,
  };
};
