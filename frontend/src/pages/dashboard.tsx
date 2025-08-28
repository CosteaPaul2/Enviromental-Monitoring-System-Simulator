import React, { useState, useEffect } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Progress } from "@heroui/progress";
import { Icon } from "@iconify/react";
import { Chip } from "@heroui/chip";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";

import DashboardLayout from "@/layouts/DashboardLayout";
import { sensorsApi, type Sensor } from "@/lib/sensorsApi";
import { usePollutionMonitor } from "@/hooks/usePollutionMonitor";
import {
  useSuccessNotification,
  useErrorNotification,
} from "@/contexts/NotificationContext";

interface StatCard {
  title: string;
  value: string | number;
  icon: string;
  color: "primary" | "success" | "warning" | "danger";
  change?: number;
}

interface RealTimeAlert {
  id: string;
  area: string;
  type: string;
  level: "good" | "moderate" | "unhealthy" | "dangerous";
  alertLevel: "none" | "low" | "medium" | "high" | "critical";
  time: string;
  riskScore: number;
  sensorCount: number;
  activeSensorCount: number;
}

const getAlertIcon = (level: string, alertLevel?: string) => {
  if (alertLevel === "critical") return "tabler:alert-triangle";
  if (alertLevel === "high") return "tabler:shield-x";
  if (alertLevel === "medium") return "tabler:shield-exclamation";

  switch (level) {
    case "dangerous":
      return "tabler:alert-triangle";
    case "unhealthy":
      return "tabler:shield-x";
    case "moderate":
      return "tabler:shield-exclamation";
    case "good":
      return "tabler:shield-check";
    default:
      return "tabler:bell";
  }
};

const getAlertColor = (
  level: string,
  alertLevel?: string,
): "danger" | "warning" | "primary" | "success" | "default" => {
  if (alertLevel === "critical") return "danger";
  if (alertLevel === "high") return "danger";
  if (alertLevel === "medium") return "warning";
  if (alertLevel === "low") return "primary";

  switch (level) {
    case "dangerous":
      return "danger";
    case "unhealthy":
      return "warning";
    case "moderate":
      return "warning";
    case "good":
      return "success";
    default:
      return "default";
  }
};

export default function DashboardPage(): React.JSX.Element {
  const [sensors, setSensors] = useState<Sensor[]>([]);
  const [sensorsLoading, setSensorsLoading] = useState(true);

  const addSuccessNotification = useSuccessNotification();
  const addErrorNotification = useErrorNotification();

  const {
    stats: pollutionStats,
    loading: pollutionLoading,
    lastUpdate,
    refreshData,
    getRecentAlerts,
  } = usePollutionMonitor({
    enableNotifications: true,
    autoRefresh: true,
    refreshInterval: 60000,
    notificationThreshold: "high",
    maxAlertsDisplayed: 6,
    alertCacheDuration: 300000,
  });

  useEffect(() => {
    const fetchSensors = async () => {
      try {
        const response = await sensorsApi.getSensors();

        if (response.success && response.data) {
          setSensors(response.data.sensors);
        }
      } catch (error) {
        console.error("Failed to fetch sensors:", error);
      } finally {
        setSensorsLoading(false);
      }
    };

    fetchSensors();
  }, []);

  const recentAlerts: RealTimeAlert[] = getRecentAlerts(6).map((alert) => ({
    id: alert.id,
    area: alert.area,
    type: alert.type,
    level: alert.level,
    alertLevel: alert.alertLevel,
    time: formatDistanceToNow(new Date(alert.timestamp), { addSuffix: true }),
    riskScore: alert.riskScore,
    sensorCount: alert.sensorCount,
    activeSensorCount: alert.activeSensorCount,
  }));

  const activeSensors = sensors.filter((s) => s.active).length;
  const totalSensors = sensors.length;
  const loading = sensorsLoading || pollutionLoading;

  const stats: StatCard[] = [
    {
      title: "Active Sensors",
      value: loading ? "--" : `${activeSensors}`,
      icon: "tabler:device-analytics",
      color: "primary",
      change:
        activeSensors > 0 && totalSensors > 0
          ? Math.round((activeSensors / totalSensors) * 100) - 75
          : 0,
    },
    {
      title: "Monitoring Areas",
      value: loading ? "--" : `${pollutionStats.totalShapes}`,
      icon: "tabler:map-pin",
      color: "success",
    },
    {
      title: "Critical Alerts",
      value: loading ? "--" : `${pollutionStats.criticalAlerts}`,
      icon: "tabler:alert-triangle",
      color: pollutionStats.criticalAlerts > 0 ? "danger" : "success",
    },
    {
      title: "Risk Score",
      value: loading ? "--" : `${pollutionStats.averageRiskScore}/100`,
      icon: "tabler:shield-check",
      color:
        pollutionStats.averageRiskScore > 70
          ? "danger"
          : pollutionStats.averageRiskScore > 40
            ? "warning"
            : "success",
    },
  ];

  const handleRefreshData = async () => {
    try {
      await refreshData();
      addSuccessNotification("Data Refreshed", "Environmental data updated", {
        duration: 2000,
      });
    } catch (error) {
      console.error("Failed to refresh:", error);
      addErrorNotification(
        "Refresh Failed",
        "Could not update environmental data",
      );
    }
  };

  const sensorHealth = [
    "TEMPERATURE",
    "AIR_QUALITY",
    "NOISE",
    "HUMIDITY",
    "LIGHT",
    "CO2",
  ]
    .map((type) => {
      const sensorType = type as Sensor["type"];
      const typeSensors = sensors.filter((s) => s.type === sensorType);
      const workingSensors = typeSensors.filter((s) => s.active);
      const typeLabel =
        sensorType === "AIR_QUALITY"
          ? "Air Quality"
          : sensorType === "CO2"
            ? "CO2"
            : sensorType.charAt(0) + sensorType.slice(1).toLowerCase();

      return {
        name: `${typeLabel} Sensors`,
        working: workingSensors.length,
        total: typeSensors.length,
      };
    })
    .filter((item) => item.total > 0);

  const formatAlertLevel = (alertLevel: string) => {
    switch (alertLevel) {
      case "critical":
        return "Critical";
      case "high":
        return "High";
      case "medium":
        return "Medium";
      case "low":
        return "Low";
      default:
        return "Info";
    }
  };

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Environmental Overview</h2>
        <div className="flex items-center gap-4">
          {lastUpdate && (
            <div className="text-sm text-default-500">
              Last updated:{" "}
              {formatDistanceToNow(lastUpdate, { addSuffix: true })}
            </div>
          )}
          <Button
            color="primary"
            isLoading={pollutionLoading}
            size="sm"
            startContent={
              !pollutionLoading ? <Icon icon="tabler:refresh" /> : undefined
            }
            variant="flat"
            onPress={handleRefreshData}
          >
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {stats.map((stat) => (
          <Card key={stat.title} className="border-none">
            <CardBody className="flex gap-4">
              <div
                className="p-3 rounded-xl"
                style={{
                  backgroundColor: `hsl(var(--heroui-colors-${stat.color}) / 0.1)`,
                }}
              >
                {loading ? (
                  <Icon
                    className="text-2xl animate-spin"
                    icon="tabler:loader"
                    style={{ color: `hsl(var(--heroui-colors-${stat.color}))` }}
                  />
                ) : (
                  <Icon
                    className="text-2xl"
                    icon={stat.icon}
                    style={{ color: `hsl(var(--heroui-colors-${stat.color}))` }}
                  />
                )}
              </div>
              <div className="flex flex-col gap-1">
                <p className="text-small text-default-500">{stat.title}</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-semibold">{stat.value}</span>
                  {stat.change && !loading && (
                    <span
                      className={`text-tiny ${
                        stat.change > 0 ? "text-success" : "text-danger"
                      }`}
                    >
                      {stat.change > 0 ? "+" : ""}
                      {stat.change}%
                    </span>
                  )}
                </div>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      {pollutionStats.criticalAlerts > 0 && (
        <Card className="border-none mb-6 bg-danger/10 border-danger/20">
          <CardBody>
            <div className="flex items-center gap-3">
              <Icon
                className="text-2xl text-danger"
                icon="tabler:alert-triangle"
              />
              <div>
                <h3 className="font-semibold text-danger">
                  Critical Pollution Alert
                </h3>
                <p className="text-sm text-danger/80">
                  {pollutionStats.criticalAlerts} critical alert
                  {pollutionStats.criticalAlerts > 1 ? "s" : ""} requiring
                  immediate attention
                </p>
              </div>
              <div className="ml-auto">
                <Button
                  as={Link}
                  color="danger"
                  endContent={<Icon icon="tabler:arrow-right" />}
                  size="sm"
                  to="/map"
                  variant="solid"
                >
                  View Map
                </Button>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-none">
          <CardHeader className="flex justify-between">
            <div>
              <h3 className="text-lg font-semibold">Recent Pollution Alerts</h3>
              <p className="text-small text-default-500">
                Live environmental monitoring updates
              </p>
            </div>
            <Button
              as={Link}
              color="primary"
              endContent={<Icon icon="tabler:arrow-right" />}
              size="sm"
              to="/map"
              variant="light"
            >
              View Map
            </Button>
          </CardHeader>
          <CardBody>
            {pollutionLoading ? (
              <div className="flex items-center justify-center py-8">
                <Icon
                  className="text-2xl animate-spin mr-3"
                  icon="tabler:loader"
                />
                <span>Loading alerts...</span>
              </div>
            ) : recentAlerts.length === 0 ? (
              <div className="text-center py-8 text-default-500">
                <Icon
                  className="text-4xl mb-2 text-success"
                  icon="tabler:shield-check"
                />
                <p>No recent alerts</p>
                <p className="text-small">
                  All monitoring areas are within safe parameters
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentAlerts.map((alert) => {
                  const alertColor = getAlertColor(
                    alert.level,
                    alert.alertLevel,
                  );

                  return (
                    <div
                      key={alert.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-content2 hover:bg-content3 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="p-2 rounded-lg"
                          style={{
                            backgroundColor: `hsl(var(--heroui-colors-${alertColor}) / 0.1)`,
                          }}
                        >
                          <Icon
                            className="text-xl"
                            icon={getAlertIcon(alert.level, alert.alertLevel)}
                            style={{
                              color: `hsl(var(--heroui-colors-${alertColor}))`,
                            }}
                          />
                        </div>
                        <div>
                          <p className="font-medium">{alert.area}</p>
                          <p className="text-small text-default-500">
                            {alert.type}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-tiny text-default-400">
                              {alert.activeSensorCount}/{alert.sensorCount}{" "}
                              sensors
                            </span>
                            <span className="text-tiny text-default-300">
                              •
                            </span>
                            <span className="text-tiny text-default-400">
                              Risk: {alert.riskScore}/100
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <Chip
                          className="mb-1"
                          color={
                            alertColor as
                              | "danger"
                              | "warning"
                              | "primary"
                              | "success"
                              | "default"
                          }
                          size="sm"
                          variant="flat"
                        >
                          {formatAlertLevel(alert.alertLevel)}
                        </Chip>
                        <p className="text-tiny text-default-400">
                          {alert.time}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardBody>
        </Card>

        <Card className="border-none">
          <CardHeader className="flex justify-between">
            <h3 className="text-lg font-semibold">Sensor Health</h3>
            <Button
              as={Link}
              color="primary"
              endContent={<Icon icon="tabler:arrow-right" />}
              size="sm"
              to="/sensors"
              variant="light"
            >
              Manage Sensors
            </Button>
          </CardHeader>
          <CardBody>
            {sensorsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Icon
                  className="text-2xl animate-spin mr-3"
                  icon="tabler:loader"
                />
                <span>Loading sensor data...</span>
              </div>
            ) : sensorHealth.length === 0 ? (
              <div className="text-center py-8 text-default-500">
                <Icon
                  className="text-4xl mb-2"
                  icon="tabler:layout-dashboard"
                />
                <p>No sensors configured</p>
                <p className="text-small">Add sensors to start monitoring</p>
              </div>
            ) : (
              <div className="space-y-6">
                {sensorHealth.map((sensor) => {
                  const percentage =
                    sensor.total > 0
                      ? (sensor.working / sensor.total) * 100
                      : 0;
                  const status =
                    sensor.working === sensor.total
                      ? "success"
                      : sensor.working === 0
                        ? "danger"
                        : "warning";

                  return (
                    <div key={sensor.name} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-small font-medium">
                          {sensor.name}
                        </span>
                        <div className="flex items-center gap-2">
                          <Chip
                            color={status as "success" | "warning" | "danger"}
                            size="sm"
                            variant="flat"
                          >
                            {sensor.working}/{sensor.total} active
                          </Chip>
                          <span className="text-tiny text-default-400">
                            {percentage.toFixed(0)}%
                          </span>
                        </div>
                      </div>
                      <Progress
                        className="h-2"
                        color={status as "success" | "warning" | "danger"}
                        value={percentage}
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      <div className="mt-6">
        <Card className="border-none">
          <CardHeader>
            <h3 className="text-lg font-semibold">Quick Actions</h3>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              <Button
                as={Link}
                className="h-24"
                color="primary"
                startContent={
                  <Icon className="text-xl" icon="tabler:map-pin" />
                }
                to="/map"
              >
                View Monitoring Map
              </Button>
              <Button
                as={Link}
                className="h-24"
                color="success"
                startContent={<Icon className="text-xl" icon="tabler:plus" />}
                to="/sensors"
              >
                Add New Sensor
              </Button>
              <Button
                as={Link}
                className="h-24"
                color="secondary"
                startContent={
                  <Icon className="text-xl" icon="tabler:chart-line" />
                }
                to="/analytics"
              >
                View Analytics
              </Button>
              <Button
                className="h-24"
                color="warning"
                isLoading={pollutionLoading}
                startContent={
                  !pollutionLoading ? (
                    <Icon className="text-xl" icon="tabler:refresh" />
                  ) : undefined
                }
                onPress={handleRefreshData}
              >
                Refresh Data
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>
    </DashboardLayout>
  );
}
