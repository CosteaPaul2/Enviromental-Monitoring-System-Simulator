import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@heroui/button";
import { Card, CardHeader, CardBody } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { Divider } from "@heroui/divider";
import { Progress } from "@heroui/progress";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/modal";
import { Input } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import { Icon } from "@iconify/react";

import {
  sensorsApi,
  sensorTypes,
  formatSensorValue,
  getSensorTypeInfo,
  getStatusColor,
  type Sensor,
  type SensorReading,
} from "@/lib/sensorsApi";
import DefaultLayout from "@/layouts/default";
import { useAppUpdates } from "@/contexts/AppUpdateContext";

export default function SensorsPage() {
  const navigate = useNavigate();
  const { triggerAllUpdates } = useAppUpdates();
  const [sensors, setSensors] = useState<Sensor[]>([]);
  const [sensorReadings, setSensorReadings] = useState<
    Map<number, SensorReading>
  >(new Map());
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [alertMessage, setAlertMessage] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const [formData, setFormData] = useState({
    sensorId: "",
    type: "TEMPERATURE" as Sensor["type"],
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    loadSensors();
  }, []);

  const loadSensors = async () => {
    try {
      setLoading(true);
      const response = await sensorsApi.getSensors();

      if (response.success && response.data) {
        setSensors(response.data.sensors);

        const readingsMap = new Map<number, SensorReading>();

        for (const sensor of response.data.sensors) {
          try {
            const readingResponse = await sensorsApi.getLatestReading(
              sensor.id,
            );

            if (readingResponse.success && readingResponse.data) {
              readingsMap.set(sensor.id, readingResponse.data.reading);
            }
          } catch (error) {
            console.warn(
              `Failed to load reading for sensor ${sensor.id}`,
              error,
            );
          }
        }
        setSensorReadings(readingsMap);
      }
    } catch (error) {
      console.error("Failed to load sensors:", error);
      setAlertMessage({ type: "error", message: "Failed to load sensors" });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSensor = async () => {
    setErrors({});

    if (!formData.sensorId.trim()) {
      setErrors({ sensorId: "Sensor ID is required" });

      return;
    }

    try {
      setCreating(true);
      const response = await sensorsApi.createSensor({
        sensorId: formData.sensorId.trim(),
        type: formData.type,
      });

      if (response.success) {
        setAlertMessage({
          type: "success",
          message: "Sensor created successfully!",
        });
        setIsCreateModalOpen(false);
        resetForm();
        loadSensors();
        triggerAllUpdates();
      } else {
        setAlertMessage({ type: "error", message: "Failed to create sensor" });
      }
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || "Failed to create sensor";

      setAlertMessage({ type: "error", message: errorMessage });
    } finally {
      setCreating(false);
    }
  };

  const resetForm = () => {
    setFormData({
      sensorId: "",
      type: "TEMPERATURE",
    });
    setErrors({});
  };

  const handleSensorClick = (sensorId: number) => {
    navigate(`/sensors/${sensorId}`);
  };

  const handleToggleSensor = async (sensor: Sensor) => {
    try {
      const response = await sensorsApi.toggleSensor(sensor.sensorId);

      if (response.success) {
        setAlertMessage({
          type: "success",
          message: `Sensor ${sensor.active ? "deactivated" : "activated"} successfully!`,
        });
        loadSensors();
        triggerAllUpdates();
      } else {
        setAlertMessage({ type: "error", message: "Failed to toggle sensor" });
      }
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || "Failed to toggle sensor";

      setAlertMessage({ type: "error", message: errorMessage });
    }
  };

  return (
    <DefaultLayout>
      <div className="container mx-auto px-4 py-8 space-y-6">
        {alertMessage && (
          <div
            className={`p-4 rounded-large border ${
              alertMessage.type === "success"
                ? "bg-success-50 border-success-200 text-success-700"
                : "bg-danger-50 border-danger-200 text-danger-700"
            }`}
            role="alert"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icon
                  className="text-lg"
                  icon={
                    alertMessage.type === "success"
                      ? "tabler:check"
                      : "tabler:alert-circle"
                  }
                />
                <span className="text-small">{alertMessage.message}</span>
              </div>
              <Button
                isIconOnly
                size="sm"
                variant="light"
                onPress={() => setAlertMessage(null)}
              >
                <Icon icon="tabler:x" />
              </Button>
            </div>
          </div>
        )}

        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <Icon className="text-primary" icon="tabler:settings" />
              Sensor Management
            </h1>
            <p className="text-foreground/60 mt-2">
              Manage your environmental monitoring sensors
            </p>
          </div>
          <Button
            className="font-medium"
            color="primary"
            size="lg"
            startContent={<Icon className="text-lg" icon="tabler:plus" />}
            onPress={() => setIsCreateModalOpen(true)}
          >
            Create Sensor
          </Button>
        </div>

        <Card className="border-none bg-gradient-to-br from-content1 to-content2/20">
          <CardHeader className="border-b border-divider">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-xl">
                  <Icon
                    className="text-2xl text-primary"
                    icon="tabler:list-check"
                  />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-foreground">
                    My Sensors
                  </h3>
                  <p className="text-sm text-foreground/60 mt-1">
                    {sensors.length} sensors configured
                  </p>
                </div>
              </div>
              <Chip color="primary" size="sm" variant="flat">
                {sensors.length} Total
              </Chip>
            </div>
          </CardHeader>

          <CardBody className="p-6">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Progress
                  isIndeterminate
                  aria-label="Loading sensors..."
                  className="max-w-md"
                  color="primary"
                  size="sm"
                />
                <p className="text-sm text-foreground/60 mt-3">
                  Loading sensors...
                </p>
              </div>
            ) : sensors.length === 0 ? (
              <div className="text-center py-12">
                <div className="p-4 bg-content2 rounded-full w-fit mx-auto mb-4">
                  <Icon
                    className="text-4xl text-foreground/40"
                    icon="tabler:square-plus"
                  />
                </div>
                <h4 className="text-lg font-medium text-foreground mb-2">
                  No sensors yet
                </h4>
                <p className="text-sm text-foreground/60 mb-6 max-w-md mx-auto">
                  Create your first sensor to start collecting environmental
                  data. The simulator will automatically generate realistic
                  patterns.
                </p>
                <Button
                  color="primary"
                  size="lg"
                  startContent={<Icon icon="tabler:plus" />}
                  onPress={() => setIsCreateModalOpen(true)}
                >
                  Create Your First Sensor
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sensors.map((sensor) => {
                  const reading = sensorReadings.get(sensor.id);
                  const sensorType = getSensorTypeInfo(sensor.type);

                  return (
                    <Card
                      key={sensor.id}
                      isPressable
                      className="border border-divider hover:border-primary/50 transition-colors cursor-pointer"
                      onPress={() => handleSensorClick(sensor.id)}
                    >
                      <CardBody className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div
                              className="p-3 rounded-xl"
                              style={{
                                backgroundColor: `${sensorType?.color}20`,
                              }}
                            >
                              <Icon
                                className="text-xl"
                                icon={sensorType?.icon || "tabler:cpu"}
                                style={{ color: sensorType?.color }}
                              />
                            </div>
                            <div>
                              <h4 className="font-semibold text-lg text-foreground">
                                {sensor.sensorId}
                              </h4>
                              <p className="text-sm text-foreground/60 capitalize">
                                {sensor.type.toLowerCase()} sensor
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <Chip
                              color={getStatusColor(
                                sensor.active ? "active" : "inactive",
                              )}
                              size="sm"
                              startContent={
                                <div
                                  className={`w-2 h-2 rounded-full ${
                                    sensor.active
                                      ? "bg-success-500"
                                      : "bg-danger-500"
                                  }`}
                                />
                              }
                              variant="flat"
                            >
                              {sensor.active ? "active" : "inactive"}
                            </Chip>
                            <Button
                              isIconOnly
                              className="min-w-unit-8 w-unit-8 h-unit-8"
                              color={sensor.active ? "danger" : "success"}
                              size="sm"
                              variant="light"
                              onClick={(e) => e.stopPropagation()}
                              onPress={() => handleToggleSensor(sensor)}
                            >
                              <Icon
                                className="text-sm"
                                icon={
                                  sensor.active
                                    ? "tabler:player-pause"
                                    : "tabler:player-play"
                                }
                              />
                            </Button>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-foreground/60">
                              Sensor ID:
                            </span>
                            <span className="bg-default-100 text-default-700 px-2 py-1 rounded-small text-xs font-mono">
                              {sensor.id}
                            </span>
                          </div>

                          <Divider />

                          <div className="text-center">
                            <div
                              className="text-3xl font-bold mb-1"
                              style={{ color: sensorType?.color }}
                            >
                              {reading
                                ? formatSensorValue(reading.value, sensor.type)
                                : "---"}
                            </div>
                            <p className="text-xs text-foreground/60">
                              {reading ? "Latest Reading" : "No Data Available"}
                            </p>
                            {reading && (
                              <div className="mt-2 text-xs text-foreground/70">
                                <div>
                                  Timestamp:{" "}
                                  {new Date(reading.timestamp).toLocaleString()}
                                </div>
                              </div>
                            )}
                          </div>

                          {reading && (
                            <>
                              <Divider />
                              <div className="text-xs text-foreground/60 text-center">
                                Last updated:{" "}
                                {new Date(reading.timestamp).toLocaleString()}
                              </div>
                            </>
                          )}

                          <div className="mt-4 pt-3 border-t border-divider">
                            <div className="flex items-center justify-center gap-2 text-primary">
                              <Icon
                                className="text-sm"
                                icon="tabler:chart-line"
                              />
                              <span className="text-xs font-medium">
                                Click to view charts & readings
                              </span>
                            </div>
                          </div>
                        </div>
                      </CardBody>
                    </Card>
                  );
                })}
              </div>
            )}
          </CardBody>
        </Card>

        <Modal
          backdrop="blur"
          isOpen={isCreateModalOpen}
          size="2xl"
          onClose={() => {
            setIsCreateModalOpen(false);
            resetForm();
          }}
        >
          <ModalContent>
            <ModalHeader className="flex flex-col gap-1 border-b border-divider pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Icon className="text-xl text-primary" icon="tabler:plus" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold">Create New Sensor</h3>
                  <p className="text-sm text-foreground/60 font-normal">
                    Configure your environmental monitoring sensor
                  </p>
                </div>
              </div>
            </ModalHeader>

            <ModalBody className="py-6">
              <div className="space-y-4">
                <Input
                  isRequired
                  classNames={{
                    input: "text-foreground",
                    inputWrapper:
                      "border-divider hover:border-focus focus-within:border-focus bg-content2",
                  }}
                  description="Unique identifier (A-Z, 0-9, _)"
                  errorMessage={errors.sensorId}
                  isInvalid={!!errors.sensorId}
                  label="Sensor ID"
                  placeholder="e.g., TEMP_001"
                  startContent={
                    <Icon className="text-default-400" icon="tabler:hash" />
                  }
                  value={formData.sensorId}
                  variant="bordered"
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      sensorId: e.target.value.toUpperCase(),
                    }))
                  }
                />

                <Select
                  isRequired
                  classNames={{
                    trigger: "border-divider hover:border-focus bg-content2",
                    value: "text-foreground",
                  }}
                  label="Sensor Type"
                  placeholder="Select sensor type"
                  selectedKeys={[formData.type]}
                  startContent={
                    getSensorTypeInfo(formData.type) && (
                      <Icon
                        className="text-lg"
                        icon={getSensorTypeInfo(formData.type)!.icon}
                        style={{
                          color: getSensorTypeInfo(formData.type)!.color,
                        }}
                      />
                    )
                  }
                  variant="bordered"
                  onSelectionChange={(keys) =>
                    setFormData((prev) => ({
                      ...prev,
                      type: Array.from(keys)[0] as Sensor["type"],
                    }))
                  }
                >
                  {sensorTypes.map((type) => (
                    <SelectItem
                      key={type.value}
                      startContent={
                        <Icon
                          className="text-lg"
                          icon={type.icon}
                          style={{ color: type.color }}
                        />
                      }
                      textValue={`${type.label} (${type.unit})`}
                    >
                      {type.label} ({type.unit})
                    </SelectItem>
                  ))}
                </Select>
              </div>
            </ModalBody>

            <ModalFooter className="border-t border-divider pt-4">
              <Button
                isDisabled={creating}
                variant="flat"
                onPress={() => {
                  setIsCreateModalOpen(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button
                color="primary"
                isDisabled={!formData.sensorId || creating}
                isLoading={creating}
                startContent={
                  !creating ? <Icon icon="tabler:plus" /> : undefined
                }
                onPress={handleCreateSensor}
              >
                {creating ? "Creating..." : "Create Sensor"}
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </div>
    </DefaultLayout>
  );
}
