import { useState, useEffect } from "react";
import { Card, CardHeader, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Divider } from "@heroui/divider";
import { Switch } from "@heroui/switch";
import { Tooltip } from "@heroui/tooltip";
import { Icon } from "@iconify/react";

import { Sensor, sensorsApi, getSensorTypeInfo } from "@/lib/sensorsApi";

interface SensorPanelProps {
  onSensorSelect?: (sensor: Sensor | null) => void;
  selectedSensor?: Sensor | null;
  isPlacementMode?: boolean;
  onPlacementModeChange?: (enabled: boolean) => void;
}

export default function SensorPanel({
  onSensorSelect,
  selectedSensor,
}: SensorPanelProps) {
  const [sensors, setSensors] = useState<Sensor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSensors();
  }, []);

  const loadSensors = async () => {
    try {
      setLoading(true);
      const response = await sensorsApi.getSensors();

      if (response.success && response.data) {
        setSensors(response.data.sensors);
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSensor = async (
    sensor: Sensor,
    event: React.MouseEvent,
  ) => {
    event.stopPropagation();
    try {
      const response = await sensorsApi.toggleSensor(sensor.sensorId);

      if (response.success) {
        await loadSensors();
      }
    } catch (error) {
    }
  };

  const sensorsWithLocation = sensors.filter((s) => s.latitude && s.longitude);
  const sensorsWithoutLocation = sensors.filter(
    (s) => !s.latitude || !s.longitude,
  );

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between w-full">
          <h3 className="text-lg font-semibold">Sensor Management</h3>
          <div className="flex gap-2">
            <Chip color="primary" size="sm" variant="flat">
              {sensors.length} total
            </Chip>
          </div>
        </div>
      </CardHeader>

      <CardBody className="space-y-4">
        {loading ? (
          <div className="text-center py-6">
            <Icon
              className="text-2xl text-foreground/40 animate-spin mb-2"
              icon="tabler:refresh"
            />
            <p className="text-sm text-foreground/60">Loading sensors...</p>
          </div>
        ) : (
          <>
            {sensorsWithLocation.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-foreground-600">
                    On Map
                  </h4>
                  <Chip color="success" size="sm" variant="flat">
                    {sensorsWithLocation.length} placed
                  </Chip>
                </div>

                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {sensorsWithLocation.map((sensor) => {
                    const sensorType = getSensorTypeInfo(sensor.type);
                    const isSelected = selectedSensor?.id === sensor.id;

                    return (
                      <Card
                        key={sensor.id}
                        className={`border transition-colors cursor-pointer w-full h-16 ${
                          isSelected
                            ? "border-primary bg-primary/5"
                            : "border-divider hover:border-primary/50"
                        }`}
                        isPressable={!!onSensorSelect}
                        onPress={() => onSensorSelect?.(sensor)}
                      >
                        <CardBody className="p-0 h-16 w-full">
                          <div className="flex items-center h-16 w-full px-3">
                            <div
                              className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center"
                              style={{
                                backgroundColor: `${sensorType?.color}20`,
                              }}
                            >
                              <Icon
                                className="text-sm"
                                icon={sensorType?.icon || "tabler:cpu"}
                                style={{ color: sensorType?.color }}
                              />
                            </div>

                            <div className="flex-1 px-2 min-w-0 overflow-hidden">
                              <div className="text-xs font-medium text-foreground truncate leading-tight">
                                {sensor.sensorId}
                              </div>
                              <div className="text-xs text-foreground/60 truncate leading-tight">
                                {sensor.type.toLowerCase()}
                              </div>
                            </div>

                            <div className="flex-shrink-0 w-16 flex justify-end items-center gap-1">
                              <div className="w-6"> </div>
                              <Tooltip
                                content={
                                  sensor.active
                                    ? "Deactivate sensor"
                                    : "Activate sensor"
                                }
                              >
                                <Switch
                                  color={sensor.active ? "success" : "default"}
                                  isSelected={sensor.active}
                                  size="sm"
                                  onValueChange={() =>
                                    handleToggleSensor(sensor, {
                                      stopPropagation: () => {},
                                    } as React.MouseEvent)
                                  }
                                />
                              </Tooltip>
                            </div>
                          </div>
                        </CardBody>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

            {sensorsWithoutLocation.length > 0 && (
              <>
                {sensorsWithLocation.length > 0 && <Divider />}

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-foreground-600">
                      Needs Placement
                    </h4>
                    <Chip color="warning" size="sm" variant="flat">
                      {sensorsWithoutLocation.length} unplaced
                    </Chip>
                  </div>

                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {sensorsWithoutLocation.map((sensor) => {
                      const sensorType = getSensorTypeInfo(sensor.type);
                      const isSelected = selectedSensor?.id === sensor.id;

                      return (
                        <Card
                          key={sensor.id}
                          className={`border transition-colors cursor-pointer w-full h-16 ${
                            isSelected
                              ? "border-warning bg-warning/5"
                              : "border-divider hover:border-warning/50"
                          }`}
                          isPressable={!!onSensorSelect}
                          onPress={() => onSensorSelect?.(sensor)}
                        >
                          <CardBody className="p-0 h-16 w-full">
                            <div className="flex items-center h-16 w-full px-3">
                              <div
                                className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center"
                                style={{
                                  backgroundColor: `${sensorType?.color}20`,
                                }}
                              >
                                <Icon
                                  className="text-sm"
                                  icon={sensorType?.icon || "tabler:cpu"}
                                  style={{ color: sensorType?.color }}
                                />
                              </div>

                              <div className="flex-1 px-2 min-w-0 overflow-hidden">
                                <div className="text-xs font-medium text-foreground truncate leading-tight">
                                  {sensor.sensorId}
                                </div>
                                <div className="text-xs text-foreground/60 truncate leading-tight">
                                  {sensor.type.toLowerCase()}
                                </div>
                              </div>

                              <div className="flex-shrink-0 w-16 flex justify-end items-center gap-1">
                                <Tooltip content="Click to place on map">
                                  <div className="w-6 h-6 bg-warning/20 rounded-md flex items-center justify-center border border-warning/30">
                                    <Icon
                                      className="text-warning text-sm animate-pulse"
                                      icon="tabler:map-pin-plus"
                                    />
                                  </div>
                                </Tooltip>
                                <Tooltip
                                  content={
                                    sensor.active
                                      ? "Deactivate sensor"
                                      : "Activate sensor"
                                  }
                                >
                                  <Switch
                                    color={
                                      sensor.active ? "success" : "default"
                                    }
                                    isSelected={sensor.active}
                                    size="sm"
                                    onValueChange={() =>
                                      handleToggleSensor(sensor, {
                                        stopPropagation: () => {},
                                      } as React.MouseEvent)
                                    }
                                  />
                                </Tooltip>
                              </div>
                            </div>
                          </CardBody>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              </>
            )}

            {sensors.length === 0 && (
              <div className="text-center py-8">
                <div className="p-4 bg-content2 rounded-full w-fit mx-auto mb-4">
                  <Icon
                    className="text-4xl text-foreground/40"
                    icon="tabler:square-plus"
                  />
                </div>
                <h4 className="text-lg font-medium text-foreground mb-2">
                  No sensors yet
                </h4>
                <p className="text-sm text-foreground/60 mb-4">
                  Create sensors from the sensor management page to see them
                  here.
                </p>
                <Button
                  color="primary"
                  size="sm"
                  startContent={<Icon icon="tabler:settings" />}
                  onPress={() => (window.location.href = "/sensors")}
                >
                  Manage Sensors
                </Button>
              </div>
            )}

            {selectedSensor && (
              <>
                <Divider />
                <div className="p-3 rounded-lg bg-primary-50 border border-primary-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon
                      className="text-primary-600 text-sm"
                      icon="tabler:cursor-arrow"
                    />
                    <span className="text-sm font-medium text-primary-700">
                      {selectedSensor.sensorId} Selected
                    </span>
                  </div>
                  <p className="text-xs text-primary-600">
                    {selectedSensor.latitude && selectedSensor.longitude
                      ? "Click on map to move this sensor to a new location"
                      : "Click on the map to place this sensor"}
                  </p>
                </div>
              </>
            )}
          </>
        )}
      </CardBody>
    </Card>
  );
}
