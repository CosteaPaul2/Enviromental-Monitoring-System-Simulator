import React, { useState, useEffect } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Icon } from "@iconify/react";
import { Link } from "react-router-dom";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/modal";
import { formatDistanceToNow } from "date-fns";

import DashboardLayout from "@/layouts/DashboardLayout";
import { adminApi, AdminShape, ShapeDetails } from "@/lib/adminApi";
import { sensorsApi, type Sensor } from "@/lib/sensorsApi";
import {
  useSuccessNotification,
  useErrorNotification,
} from "@/contexts/NotificationContext";

interface ShapeWithSensors extends AdminShape {
  sensorsInside: Sensor[];
  details?: ShapeDetails;
}

const getShapeTypeInfo = (type: string) => {
  switch (type.toUpperCase()) {
    case "CIRCLE":
      return {
        label: "Circle",
        icon: "tabler:circle",
        color: "primary" as const,
      };
    case "RECTANGLE":
      return {
        label: "Rectangle",
        icon: "tabler:square",
        color: "secondary" as const,
      };
    case "POLYGON":
      return {
        label: "Polygon",
        icon: "tabler:polygon",
        color: "warning" as const,
      };
    default:
      return {
        label: "Unknown",
        icon: "tabler:shape",
        color: "default" as const,
      };
  }
};

const getSensorTypeInfo = (type: string) => {
  switch (type) {
    case "TEMPERATURE":
      return { label: "Temperature", icon: "tabler:temperature", color: "danger" };
    case "HUMIDITY":
      return { label: "Humidity", icon: "tabler:droplet", color: "primary" };
    case "AIR_QUALITY":
      return { label: "Air Quality", icon: "tabler:wind", color: "warning" };
    case "LIGHT":
      return { label: "Light", icon: "tabler:sun", color: "warning" };
    case "NOISE":
      return { label: "Noise", icon: "tabler:volume", color: "secondary" };
    case "CO2":
      return { label: "CO2", icon: "tabler:cloud", color: "success" };
    default:
      return { label: type, icon: "tabler:device-analytics", color: "default" };
  }
};

export default function AnalyticsPage(): React.JSX.Element {
  const [shapes, setShapes] = useState<ShapeWithSensors[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedShape, setSelectedShape] = useState<ShapeWithSensors | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const addSuccessNotification = useSuccessNotification();
  const addErrorNotification = useErrorNotification();

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);

      // Fetch all shapes
      const shapesResponse = await adminApi.getAllShapes({
        page: 1,
        limit: 100, // Get all shapes
      });

      if (!shapesResponse.success || !shapesResponse.data) {
        throw new Error("Failed to fetch shapes");
      }

      const shapesData = shapesResponse.data.shapes || [];

      // For each shape, get detailed information including sensors
      const shapesWithDetails = await Promise.all(
        shapesData.map(async (shape) => {
          try {
            const detailsResponse = await adminApi.getShapeDetails(shape.id);
            const details = detailsResponse.success ? detailsResponse.data?.shape : null;
            
            return {
              ...shape,
              sensorsInside: details?.sensorsInside || [],
              details: details || undefined,
            } as ShapeWithSensors;
          } catch (error) {
            console.warn(`Failed to fetch details for shape ${shape.id}:`, error);
            return {
              ...shape,
              sensorsInside: [],
            } as ShapeWithSensors;
          }
        })
      );

      setShapes(shapesWithDetails);
    } catch (error) {
      console.error("Failed to fetch analytics data:", error);
      addErrorNotification("Failed to Load", "Could not fetch analytics data");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await fetchAnalyticsData();
      addSuccessNotification("Data Refreshed", "Analytics data updated", {
        duration: 2000,
      });
    } catch (error) {
      console.error("Failed to refresh:", error);
      addErrorNotification("Refresh Failed", "Could not refresh analytics data");
    } finally {
      setRefreshing(false);
    }
  };

  const handleViewDetails = async (shape: ShapeWithSensors) => {
    try {
      setLoadingDetails(true);
      setSelectedShape(shape);
      setIsDetailsModalOpen(true);

      // If we don't have detailed data, fetch it
      if (!shape.details) {
        const detailsResponse = await adminApi.getShapeDetails(shape.id);
        if (detailsResponse.success && detailsResponse.data) {
          setSelectedShape({
            ...shape,
            details: detailsResponse.data.shape,
            sensorsInside: detailsResponse.data.shape.sensorsInside || [],
          });
        }
      }
    } catch (error) {
      console.error("Failed to fetch shape details:", error);
      addErrorNotification("Failed to Load", "Could not fetch shape details");
      setIsDetailsModalOpen(false);
    } finally {
      setLoadingDetails(false);
    }
  };

  const totalShapes = shapes.length;
  const totalSensors = shapes.reduce((sum, shape) => sum + shape.sensorsInside.length, 0);
  const activeSensors = shapes.reduce(
    (sum, shape) => sum + shape.sensorsInside.filter(sensor => sensor.active).length,
    0
  );
  const monitoredShapes = shapes.filter(shape => shape.sensorsInside.length > 0).length;

  const stats = [
    {
      title: "Total Shapes",
      value: totalShapes,
      icon: "tabler:shapes",
      color: "primary" as const,
    },
    {
      title: "Monitored Shapes",
      value: monitoredShapes,
      icon: "tabler:eye",
      color: "success" as const,
    },
    {
      title: "Total Sensors",
      value: totalSensors,
      icon: "tabler:device-analytics",
      color: "secondary" as const,
    },
    {
      title: "Active Sensors", 
      value: activeSensors,
      icon: "tabler:activity",
      color: "warning" as const,
    },
  ];

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">Analytics Overview</h2>
          <p className="text-default-500">Shapes and their sensor coverage</p>
        </div>
        <div className="flex gap-2">
          <Button
            color="primary"
            isLoading={refreshing}
            size="sm"
            startContent={!refreshing ? <Icon icon="tabler:refresh" /> : undefined}
            variant="flat"
            onPress={handleRefresh}
          >
            Refresh
          </Button>
          <Button
            as={Link}
            color="primary"
            endContent={<Icon icon="tabler:arrow-right" />}
            size="sm"
            to="/map"
            variant="solid"
          >
            View Map
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
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
                <Icon
                  className="text-2xl"
                  icon={stat.icon}
                  style={{ color: `hsl(var(--heroui-colors-${stat.color}))` }}
                />
              </div>
              <div className="flex flex-col gap-1">
                <p className="text-small text-default-500">{stat.title}</p>
                <span className="text-xl font-semibold">{stat.value}</span>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      {/* Shapes List */}
      <Card className="border-none">
        <CardHeader className="flex justify-between">
          <div>
            <h3 className="text-lg font-semibold">Monitoring Shapes</h3>
            <p className="text-small text-default-500">
              All shapes and their sensor coverage
            </p>
          </div>
        </CardHeader>
        <CardBody>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Icon className="text-2xl animate-spin mr-3" icon="tabler:loader" />
              <span>Loading analytics data...</span>
            </div>
          ) : shapes.length === 0 ? (
            <div className="text-center py-12 text-default-500">
              <Icon className="text-4xl mb-4" icon="tabler:shapes" />
              <p className="text-lg font-medium mb-2">No shapes found</p>
              <p className="text-small mb-4">Create shapes on the map to start monitoring</p>
              <Button
                as={Link}
                color="primary"
                startContent={<Icon icon="tabler:map-pin" />}
                to="/map"
              >
                Go to Map
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {shapes.map((shape) => {
                const shapeTypeInfo = getShapeTypeInfo(shape.type);
                const activeSensorsInShape = shape.sensorsInside.filter(s => s.active).length;
                const totalSensorsInShape = shape.sensorsInside.length;
                
                return (
                  <div
                    key={shape.id}
                    className="p-4 rounded-lg border border-divider bg-content1 hover:bg-content2 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-start gap-3">
                        <div
                          className="p-2 rounded-lg"
                          style={{
                            backgroundColor: `hsl(var(--heroui-colors-${shapeTypeInfo.color}) / 0.1)`,
                          }}
                        >
                          <Icon
                            className="text-xl"
                            icon={shapeTypeInfo.icon}
                            style={{
                              color: `hsl(var(--heroui-colors-${shapeTypeInfo.color}))`,
                            }}
                          />
                        </div>
                        <div>
                          <h4 className="font-semibold text-lg">{shape.name}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <Chip
                              color={shapeTypeInfo.color}
                              size="sm"
                              variant="flat"
                            >
                              {shapeTypeInfo.label}
                            </Chip>
                            <span className="text-small text-default-500">
                              by {shape.user.name}
                            </span>
                          </div>
                          <p className="text-small text-default-400 mt-1">
                            Created {formatDistanceToNow(new Date(shape.createdAt), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {totalSensorsInShape > 0 ? (
                          <Chip
                            color={activeSensorsInShape === totalSensorsInShape ? "success" : activeSensorsInShape > 0 ? "warning" : "danger"}
                            size="sm"
                            variant="flat"
                          >
                            {activeSensorsInShape}/{totalSensorsInShape} sensors active
                          </Chip>
                        ) : (
                          <Chip color="default" size="sm" variant="flat">
                            No sensors
                          </Chip>
                        )}
                        <Button
                          isIconOnly
                          color="primary"
                          size="sm"
                          variant="flat"
                          onPress={() => handleViewDetails(shape)}
                        >
                          <Icon icon="tabler:eye" />
                        </Button>
                      </div>
                    </div>

                    {/* Sensors in Shape */}
                    {shape.sensorsInside.length > 0 && (
                      <div className="border-t border-divider pt-3">
                        <h5 className="text-small font-medium mb-2 flex items-center gap-2">
                          <Icon icon="tabler:device-analytics" />
                          Sensors in this shape ({shape.sensorsInside.length})
                        </h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                          {shape.sensorsInside.map((sensor) => {
                            const sensorTypeInfo = getSensorTypeInfo(sensor.type);
                            return (
                              <div
                                key={sensor.id}
                                className="p-2 rounded-lg bg-content2 border border-divider/50"
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <Icon
                                      className="text-sm"
                                      icon={sensorTypeInfo.icon}
                                      style={{
                                        color: `hsl(var(--heroui-colors-${sensorTypeInfo.color}))`,
                                      }}
                                    />
                                    <span className="text-small font-medium">
                                      {sensorTypeInfo.label}
                                    </span>
                                  </div>
                                  <Chip
                                    color={sensor.active ? "success" : "danger"}
                                    size="sm"
                                    variant="dot"
                                  >
                                    {sensor.active ? "Active" : "Inactive"}
                                  </Chip>
                                </div>
                                <p className="text-tiny text-default-400 mt-1">
                                  ID: {sensor.sensorId}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Shape Details Modal */}
      <Modal
        isOpen={isDetailsModalOpen}
        scrollBehavior="inside"
        size="5xl"
        onClose={() => setIsDetailsModalOpen(false)}
      >
        <ModalContent>
          <ModalHeader>
            {selectedShape && (
              <div className="flex items-center gap-3">
                <div
                  className="p-2 rounded-lg"
                  style={{
                    backgroundColor: `hsl(var(--heroui-colors-${getShapeTypeInfo(selectedShape.type).color}) / 0.1)`,
                  }}
                >
                  <Icon
                    className="text-lg"
                    icon={getShapeTypeInfo(selectedShape.type).icon}
                    style={{
                      color: `hsl(var(--heroui-colors-${getShapeTypeInfo(selectedShape.type).color}))`,
                    }}
                  />
                </div>
                <div>
                  <h3 className="text-xl font-bold">{selectedShape.name}</h3>
                  <p className="text-sm text-default-500">
                    {getShapeTypeInfo(selectedShape.type).label} • Created by{" "}
                    {selectedShape.user.name}
                  </p>
                </div>
              </div>
            )}
          </ModalHeader>
          <ModalBody>
            {loadingDetails ? (
              <div className="flex justify-center py-8">
                <div className="flex items-center gap-3">
                  <Icon className="animate-spin" icon="tabler:loader-2" />
                  Loading shape details...
                </div>
              </div>
            ) : selectedShape ? (
              <div className="space-y-6">
                {/* Shape Info */}
                <Card>
                  <CardHeader>
                    <h4 className="text-lg font-semibold">Shape Information</h4>
                  </CardHeader>
                  <CardBody>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-default-500">Name</p>
                        <p className="font-semibold">{selectedShape.name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-default-500">Type</p>
                        <Chip
                          color={getShapeTypeInfo(selectedShape.type).color}
                          size="sm"
                          variant="flat"
                        >
                          {getShapeTypeInfo(selectedShape.type).label}
                        </Chip>
                      </div>
                      <div>
                        <p className="text-sm text-default-500">Owner</p>
                        <p className="font-semibold">{selectedShape.user.name}</p>
                        <p className="text-sm text-default-400">
                          {selectedShape.user.email}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-default-500">Created</p>
                        <p className="font-semibold">
                          {formatDistanceToNow(new Date(selectedShape.createdAt), {
                            addSuffix: true,
                          })}
                        </p>
                      </div>
                    </div>
                  </CardBody>
                </Card>

                {/* Sensors Inside */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <h4 className="text-lg font-semibold">
                        Sensors Inside ({selectedShape.sensorsInside.length})
                      </h4>
                      <Chip color="primary" variant="flat">
                        {selectedShape.sensorsInside.length} sensors
                      </Chip>
                    </div>
                  </CardHeader>
                  <CardBody>
                    {selectedShape.sensorsInside.length === 0 ? (
                      <div className="text-center py-8 text-default-500">
                        <Icon
                          className="text-4xl mx-auto mb-2"
                          icon="tabler:device-analytics-off"
                        />
                        <p>No sensors found inside this shape</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {selectedShape.sensorsInside.map((sensor) => {
                          const sensorTypeInfo = getSensorTypeInfo(sensor.type);

                          return (
                            <div
                              key={sensor.id}
                              className="flex items-center justify-between p-3 border rounded-lg border-divider"
                            >
                              <div className="flex items-center gap-3">
                                <div
                                  className="p-2 rounded-lg"
                                  style={{
                                    backgroundColor: `hsl(var(--heroui-colors-${sensorTypeInfo.color}) / 0.1)`,
                                  }}
                                >
                                  <Icon
                                    className="text-lg"
                                    icon={sensorTypeInfo.icon}
                                    style={{
                                      color: `hsl(var(--heroui-colors-${sensorTypeInfo.color}))`,
                                    }}
                                  />
                                </div>
                                <div>
                                  <p className="font-semibold">
                                    {sensor.sensorId}
                                  </p>
                                  <p className="text-sm text-default-500">
                                    {sensorTypeInfo.label}
                                  </p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Chip
                                      color={sensor.active ? "success" : "danger"}
                                      size="sm"
                                      variant="flat"
                                    >
                                      {sensor.active ? "Active" : "Inactive"}
                                    </Chip>
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-xs text-default-400">
                                  Sensor ID
                                </p>
                                <p className="text-sm font-mono text-default-600">
                                  {sensor.id}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardBody>
                </Card>
              </div>
            ) : null}
          </ModalBody>
          <ModalFooter>
            <Button
              color="primary"
              onPress={() => setIsDetailsModalOpen(false)}
            >
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </DashboardLayout>
  );
}