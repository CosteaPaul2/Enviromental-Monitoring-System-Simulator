import { useState, useEffect } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Progress } from "@heroui/progress";
import { Icon } from "@iconify/react";
import { Chip } from "@heroui/chip";
import { Button } from "@heroui/button";
import { Link } from "react-router-dom";

import AdminLayout from "@/layouts/AdminLayout";
import { adminApi, AdminDashboardStats } from "@/lib/adminApi";
import { useErrorNotification } from "@/contexts/NotificationContext";

interface StatCard {
  title: string;
  value: string | number;
  icon: string;
  color: "primary" | "success" | "warning" | "danger";
  change?: { value: number; label: string };
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const addErrorNotification = useErrorNotification();

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getDashboardStats();

      if (response.success && response.data) {
        setStats(response.data);
      }
    } catch (error) {
      console.error("Failed to fetch dashboard stats:", error);
      addErrorNotification(
        "Failed to Load",
        "Could not fetch dashboard statistics",
      );
    } finally {
      setLoading(false);
    }
  };

  if (!stats) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          {loading ? (
            <div className="text-center">
              <Icon
                className="text-4xl animate-spin mb-4 text-primary"
                icon="tabler:loader"
              />
              <p className="text-foreground/60">Loading dashboard...</p>
            </div>
          ) : (
            <div className="text-center">
              <Icon
                className="text-4xl mb-4 text-danger"
                icon="tabler:alert-circle"
              />
              <p className="text-foreground/60">
                Failed to load dashboard data
              </p>
              <Button
                className="mt-4"
                color="primary"
                startContent={<Icon icon="tabler:refresh" />}
                variant="flat"
                onPress={fetchDashboardStats}
              >
                Retry
              </Button>
            </div>
          )}
        </div>
      </AdminLayout>
    );
  }

  const statCards: StatCard[] = [
    {
      title: "Total Users",
      value: stats.overview.totalUsers,
      icon: "tabler:users",
      color: "primary",
      change: {
        value: stats.activity.newUsersToday,
        label: "new today",
      },
    },
    {
      title: "Total Sensors",
      value: stats.overview.totalSensors,
      icon: "tabler:device-analytics",
      color: "success",
      change: {
        value: stats.activity.newSensorsToday,
        label: "new today",
      },
    },
    {
      title: "Active Sensors",
      value: stats.overview.activeSensors,
      icon: "tabler:activity",
      color:
        stats.overview.activeSensors > stats.overview.inactiveSensors
          ? "success"
          : "warning",
    },
    {
      title: "Monitoring Areas",
      value: stats.overview.totalShapes,
      icon: "tabler:map-pin",
      color: "primary",
      change: {
        value: stats.activity.newShapesToday,
        label: "new today",
      },
    },
    {
      title: "Total Readings",
      value: stats.overview.totalReadings.toLocaleString(),
      icon: "tabler:chart-line",
      color: "success",
      change: {
        value: stats.activity.readingsToday,
        label: "today",
      },
    },
    {
      title: "Admin Users",
      value: stats.overview.adminUsers,
      icon: "tabler:shield-check",
      color: "warning",
    },
  ];

  const sensorUtilization =
    stats.overview.totalSensors > 0
      ? (stats.overview.activeSensors / stats.overview.totalSensors) * 100
      : 0;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Admin Dashboard
            </h1>
            <p className="text-foreground/60 mt-1">
              System overview and management
            </p>
          </div>
          <Button
            color="primary"
            isLoading={loading}
            startContent={<Icon icon="tabler:refresh" />}
            variant="flat"
            onPress={fetchDashboardStats}
          >
            Refresh
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {statCards.map((stat, index) => (
            <Card key={index} className="border-none shadow-md">
              <CardBody className="flex gap-4">
                <div
                  className="p-3 rounded-xl"
                  style={{
                    backgroundColor: `hsl(var(--heroui-colors-${stat.color}) / 0.1)`,
                  }}
                >
                  <Icon
                    className="text-2xl"
                    icon={stat.icon}
                    style={{ color: `hsl(var(--heroui-colors-${stat.color}))` }}
                  />
                </div>
                <div className="flex-1">
                  <p className="text-small text-foreground/60">{stat.title}</p>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-2xl font-bold">{stat.value}</span>
                    {stat.change && (
                      <div className="flex items-center gap-1">
                        <Chip
                          color={stat.change.value > 0 ? "success" : "default"}
                          size="sm"
                          variant="flat"
                        >
                          +{stat.change.value}
                        </Chip>
                        <span className="text-tiny text-foreground/50">
                          {stat.change.label}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>

        {/* System Status */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sensor Status */}
          <Card className="border-none shadow-md">
            <CardHeader>
              <h3 className="text-xl font-semibold">Sensor Status</h3>
            </CardHeader>
            <CardBody className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-foreground/70">Active Sensors</span>
                <span className="font-semibold text-success">
                  {stats.overview.activeSensors}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-foreground/70">Inactive Sensors</span>
                <span className="font-semibold text-danger">
                  {stats.overview.inactiveSensors}
                </span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-small text-foreground/60">
                    Utilization
                  </span>
                  <span className="text-small font-medium">
                    {sensorUtilization.toFixed(1)}%
                  </span>
                </div>
                <Progress
                  className="h-2"
                  color={
                    sensorUtilization > 80
                      ? "success"
                      : sensorUtilization > 50
                        ? "warning"
                        : "danger"
                  }
                  value={sensorUtilization}
                />
              </div>
            </CardBody>
          </Card>

          {/* Quick Actions */}
          <Card className="border-none shadow-md">
            <CardHeader>
              <h3 className="text-xl font-semibold">Quick Actions</h3>
            </CardHeader>
            <CardBody className="space-y-3">
              <Button
                as={Link}
                className="w-full justify-start"
                color="primary"
                startContent={<Icon icon="tabler:user-plus" />}
                to="/admin/users"
                variant="flat"
              >
                Manage Users
              </Button>
              <Button
                as={Link}
                className="w-full justify-start"
                color="success"
                startContent={<Icon icon="tabler:device-analytics" />}
                to="/admin/sensors"
                variant="flat"
              >
                Monitor Sensors
              </Button>
              <Button
                as={Link}
                className="w-full justify-start"
                color="secondary"
                startContent={<Icon icon="tabler:map-pin" />}
                to="/admin/shapes"
                variant="flat"
              >
                View Areas
              </Button>
              <Button
                as={Link}
                className="w-full justify-start"
                color="warning"
                startContent={<Icon icon="tabler:chart-line" />}
                to="/admin/analytics"
                variant="flat"
              >
                View Analytics
              </Button>
            </CardBody>
          </Card>
        </div>

        {/* Recent Activity Summary */}
        <Card className="border-none shadow-md">
          <CardHeader>
            <h3 className="text-xl font-semibold">Today's Activity</h3>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-content2 rounded-lg">
                <Icon
                  className="text-2xl text-primary mx-auto mb-2"
                  icon="tabler:user-plus"
                />
                <div className="text-2xl font-bold text-primary">
                  {stats.activity.newUsersToday}
                </div>
                <div className="text-small text-foreground/60">New Users</div>
              </div>
              <div className="text-center p-4 bg-content2 rounded-lg">
                <Icon
                  className="text-2xl text-success mx-auto mb-2"
                  icon="tabler:device-plus"
                />
                <div className="text-2xl font-bold text-success">
                  {stats.activity.newSensorsToday}
                </div>
                <div className="text-small text-foreground/60">New Sensors</div>
              </div>
              <div className="text-center p-4 bg-content2 rounded-lg">
                <Icon
                  className="text-2xl text-secondary mx-auto mb-2"
                  icon="tabler:map-pin-plus"
                />
                <div className="text-2xl font-bold text-secondary">
                  {stats.activity.newShapesToday}
                </div>
                <div className="text-small text-foreground/60">New Areas</div>
              </div>
              <div className="text-center p-4 bg-content2 rounded-lg">
                <Icon
                  className="text-2xl text-warning mx-auto mb-2"
                  icon="tabler:activity"
                />
                <div className="text-2xl font-bold text-warning">
                  {stats.activity.readingsToday.toLocaleString()}
                </div>
                <div className="text-small text-foreground/60">Readings</div>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </AdminLayout>
  );
}
