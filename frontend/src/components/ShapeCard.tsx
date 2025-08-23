import { useState, useEffect } from "react";
import { Card, CardHeader, CardBody, CardFooter } from "@heroui/card";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Divider } from "@heroui/divider";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/modal";
import { Icon } from "@iconify/react";

import {
  getSensorTypeInfo,
  formatSensorValue,
  getPollutionColor,
  type Sensor,
} from "@/lib/sensorsApi";

interface PollutionLevel {
  level: "good" | "moderate" | "unhealthy" | "dangerous" | "no-data";
  color: string;
  icon: string;
  label: string;
}

interface SensorPollutionData {
  sensorId: number;
  sensorName: string;
  type: Sensor["type"];
  latestValue?: number;
  unit?: string;
  pollutionLevel: "good" | "moderate" | "unhealthy" | "dangerous" | "no-data";
  timestamp?: string;
  active: boolean;
}

interface ShapePollutionAnalysis {
  shapeId: number;
  shapeName: string;
  overallPollutionLevel:
    | "good"
    | "moderate"
    | "unhealthy"
    | "dangerous"
    | "no-data";
  sensors: SensorPollutionData[];
  pollutionFactors: string[];
  riskScore: number;
  recommendations: string[];
  alertLevel: "none" | "low" | "medium" | "high" | "critical";
}

interface ShapeCardProps {
  shapeData: {
    shape: {
      id: number;
      name: string;
      type: string;
      createdAt: string;
      updatedAt: string;
    };
    sensors: any[];
    pollutionAnalysis: ShapePollutionAnalysis;
    summary: {
      totalSensors: number;
      activeSensors: number;
      pollutionLevel: string;
      riskScore: number;
      alertLevel: string;
    };
  };
  onClose: () => void;
  className?: string;
}

const getPollutionLevelInfo = (level: string): PollutionLevel => {
  const color = getPollutionColor(level);

  switch (level) {
    case "good":
      return {
        level: "good",
        color,
        icon: "tabler:shield-check",
        label: "Good Environmental Conditions",
      };
    case "moderate":
      return {
        level: "moderate",
        color,
        icon: "tabler:shield-exclamation",
        label: "Moderate Environmental Issues",
      };
    case "unhealthy":
      return {
        level: "unhealthy",
        color,
        icon: "tabler:shield-x",
        label: "Unhealthy Environmental Levels",
      };
    case "dangerous":
      return {
        level: "dangerous",
        color,
        icon: "tabler:alert-triangle",
        label: "Dangerous Environmental Zone",
      };
    default:
      return {
        level: "no-data",
        color,
        icon: "tabler:question-mark",
        label: "No Environmental Data",
      };
  }
};

const getAlertLevelInfo = (alertLevel: string, pollutionColor: string) => {
  const baseColor = pollutionColor;
  const bgColor = `${pollutionColor}20`;

  switch (alertLevel) {
    case "critical":
      return {
        color: baseColor,
        bgColor,
        label: "CRITICAL ALERT",
        icon: "tabler:alert-triangle",
      };
    case "high":
      return {
        color: baseColor,
        bgColor,
        label: "HIGH ALERT",
        icon: "tabler:shield-x",
      };
    case "medium":
      return {
        color: baseColor,
        bgColor,
        label: "MEDIUM ALERT",
        icon: "tabler:shield-exclamation",
      };
    case "low":
      return {
        color: baseColor,
        bgColor,
        label: "LOW ALERT",
        icon: "tabler:shield-exclamation",
      };
    default:
      return {
        color: "#22c55e",
        bgColor: "#22c55e20",
        label: "ALL CLEAR",
        icon: "tabler:shield-check",
      };
  }
};

export default function ShapeCard({
  shapeData,
  onClose,
  className = "",
}: ShapeCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [liveShapeData, setLiveShapeData] = useState(shapeData);
  const [isRefreshing] = useState(false);

  const pollutionInfo = getPollutionLevelInfo(
    liveShapeData.summary.pollutionLevel,
  );
  const alertInfo = getAlertLevelInfo(
    liveShapeData.summary.alertLevel,
    pollutionInfo.color,
  );

  useEffect(() => {
    setLiveShapeData(shapeData);
  }, [shapeData]);

  const sensorsByType = liveShapeData.pollutionAnalysis.sensors.reduce(
    (acc, sensor) => {
      if (!acc[sensor.type]) {
        acc[sensor.type] = [];
      }
      acc[sensor.type].push(sensor);

      return acc;
    },
    {} as Record<string, SensorPollutionData[]>,
  );

  return (
    <>
      <Card
        className={`border-2 shadow-lg backdrop-blur-md bg-background/95 ${className}`}
        style={{
          borderColor: pollutionInfo.color,
          boxShadow: `0 10px 25px ${pollutionInfo.color}30`,
        }}
      >
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3">
              <div
                className="p-3 rounded-xl"
                style={{ backgroundColor: `${pollutionInfo.color}20` }}
              >
                <Icon
                  className="text-2xl"
                  icon={pollutionInfo.icon}
                  style={{ color: pollutionInfo.color }}
                />
              </div>
              <div>
                <h3 className="text-xl font-bold text-foreground">
                  {liveShapeData.shape.name}
                </h3>
                <p className="text-sm text-foreground/60 capitalize">
                  {liveShapeData.shape.type.toLowerCase()} •{" "}
                  {liveShapeData.summary.totalSensors} sensors
                </p>
              </div>
            </div>
            <Button
              isIconOnly
              className="text-foreground/60 hover:text-foreground"
              size="sm"
              variant="light"
              onPress={onClose}
            >
              <Icon className="text-lg" icon="tabler:x" />
            </Button>
          </div>
        </CardHeader>

        <CardBody className="pt-0">
          {liveShapeData.summary.alertLevel !== "none" && (
            <div
              className="p-3 rounded-lg mb-4 border"
              style={{
                backgroundColor: alertInfo.bgColor,
                borderColor: alertInfo.color,
                color: alertInfo.color,
              }}
            >
              <div className="flex items-center gap-2">
                <Icon className="text-lg" icon={alertInfo.icon} />
                <span className="font-bold text-sm">{alertInfo.label}</span>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-foreground mb-1">
                  Environmental Status
                </h4>
                <Chip
                  startContent={
                    <Icon className="text-sm" icon={pollutionInfo.icon} />
                  }
                  style={{
                    backgroundColor: `${pollutionInfo.color}20`,
                    color: pollutionInfo.color,
                  }}
                  variant="flat"
                >
                  {pollutionInfo.label}
                </Chip>
              </div>
              <div className="text-right">
                <div
                  className="text-2xl font-bold"
                  style={{ color: pollutionInfo.color }}
                >
                  {liveShapeData.summary.riskScore}
                  {isRefreshing && (
                    <span className="ml-1 animate-pulse text-xs">●</span>
                  )}
                </div>
                <div className="text-xs text-foreground/60">Risk Score</div>
              </div>
            </div>

            {/* Risk Score Bar */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-foreground/70">
                  Environmental Risk
                </span>
                <span
                  className="text-sm font-medium"
                  style={{ color: pollutionInfo.color }}
                >
                  {liveShapeData.summary.riskScore}/100
                </span>
              </div>
              <div className="w-full bg-content3 rounded-full h-2">
                <div
                  className="h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${liveShapeData.summary.riskScore}%`,
                    backgroundColor: pollutionInfo.color,
                  }}
                />
              </div>
            </div>

            <Divider />

            {/* Sensor Summary */}
            <div>
              <h4 className="font-semibold text-foreground mb-3">
                Sensor Overview
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-content2 rounded-lg">
                  <div className="text-2xl font-bold text-success">
                    {liveShapeData.summary.activeSensors}
                  </div>
                  <div className="text-xs text-foreground/60">
                    Active Sensors
                  </div>
                </div>
                <div className="text-center p-3 bg-content2 rounded-lg">
                  <div className="text-2xl font-bold text-foreground">
                    {liveShapeData.summary.totalSensors}
                  </div>
                  <div className="text-xs text-foreground/60">
                    Total Sensors
                  </div>
                </div>
              </div>
            </div>

            {Object.keys(sensorsByType).length > 0 && (
              <div>
                <h4 className="font-semibold text-foreground mb-3">
                  Sensor Analysis by Type
                  <span className="text-xs font-normal text-foreground/60 ml-2">
                    ({Object.keys(sensorsByType).length} type
                    {Object.keys(sensorsByType).length > 1 ? "s" : ""}{" "}
                    monitored)
                  </span>
                </h4>
                <div className="grid grid-cols-1 gap-3">
                  {Object.entries(sensorsByType).map(([type, sensors]) => {
                    const sensorInfo = getSensorTypeInfo(
                      type as Sensor["type"],
                    );

                    // Count sensors by pollution level
                    const levelCounts = {
                      good: sensors.filter((s) => s.pollutionLevel === "good")
                        .length,
                      moderate: sensors.filter(
                        (s) => s.pollutionLevel === "moderate",
                      ).length,
                      unhealthy: sensors.filter(
                        (s) => s.pollutionLevel === "unhealthy",
                      ).length,
                      dangerous: sensors.filter(
                        (s) => s.pollutionLevel === "dangerous",
                      ).length,
                      inactive: sensors.filter(
                        (s) => !s.active || s.pollutionLevel === "no-data",
                      ).length,
                    };

                    let statusColor:
                      | "success"
                      | "warning"
                      | "danger"
                      | "default" = "success";
                    let statusText = "All Good";
                    let statusDetail = "";

                    if (levelCounts.dangerous > 0) {
                      statusColor = "danger";
                      statusText = "Critical";
                      statusDetail = `${levelCounts.dangerous} critical`;
                    } else if (levelCounts.unhealthy > 0) {
                      statusColor = "danger";
                      statusText = "Unhealthy";
                      statusDetail = `${levelCounts.unhealthy} unhealthy`;
                    } else if (levelCounts.moderate > 0) {
                      statusColor = "warning";
                      statusText = "Moderate";
                      statusDetail = `${levelCounts.moderate} moderate`;
                    } else if (levelCounts.good > 0) {
                      statusColor = "success";
                      statusText = "Good";
                      statusDetail = `${levelCounts.good} good`;
                    } else {
                      statusColor = "default";
                      statusText = "No Data";
                      statusDetail = "inactive";
                    }

                    const activeCount = sensors.length - levelCounts.inactive;
                    const coverageRatio = activeCount / sensors.length;

                    return (
                      <div
                        key={type}
                        className="p-3 bg-content2 rounded-lg border border-divider"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Icon
                              className="text-lg"
                              icon={sensorInfo?.icon || "tabler:cpu"}
                              style={{ color: sensorInfo?.color }}
                            />
                            <div>
                              <span className="text-sm font-medium text-foreground">
                                {sensorInfo?.label}
                              </span>
                              <div className="text-xs text-foreground/60">
                                {sensors.length} sensor
                                {sensors.length > 1 ? "s" : ""} •{" "}
                                {Math.round(coverageRatio * 100)}% active
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <Chip color={statusColor} size="sm" variant="flat">
                              {statusText}
                            </Chip>
                            <div className="text-xs text-foreground/60 mt-1">
                              {statusDetail}
                            </div>
                          </div>
                        </div>

                        {/* Mini breakdown bar for multiple sensors of same type */}
                        {sensors.length > 1 && activeCount > 0 && (
                          <div className="flex gap-1 h-2 bg-content3 rounded-full overflow-hidden">
                            {levelCounts.good > 0 && (
                              <div
                                className="bg-success h-full"
                                style={{
                                  width: `${(levelCounts.good / activeCount) * 100}%`,
                                }}
                                title={`${levelCounts.good} good sensors`}
                              />
                            )}
                            {levelCounts.moderate > 0 && (
                              <div
                                className="bg-warning h-full"
                                style={{
                                  width: `${(levelCounts.moderate / activeCount) * 100}%`,
                                }}
                                title={`${levelCounts.moderate} moderate sensors`}
                              />
                            )}
                            {levelCounts.unhealthy > 0 && (
                              <div
                                className="bg-danger h-full"
                                style={{
                                  width: `${(levelCounts.unhealthy / activeCount) * 100}%`,
                                }}
                                title={`${levelCounts.unhealthy} unhealthy sensors`}
                              />
                            )}
                            {levelCounts.dangerous > 0 && (
                              <div
                                className="h-full"
                                style={{
                                  backgroundColor: "#7c2d12",
                                  width: `${(levelCounts.dangerous / activeCount) * 100}%`,
                                }}
                                title={`${levelCounts.dangerous} dangerous sensors`}
                              />
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Zone Coverage Analysis */}
                <div className="mt-3 p-3 bg-content3/50 rounded-lg border border-divider/50">
                  <div className="text-xs text-foreground/70 mb-1">
                    Zone Coverage Analysis
                  </div>
                  <div className="text-sm text-foreground">
                    <span className="font-medium">
                      {Object.keys(sensorsByType).length} sensor type
                      {Object.keys(sensorsByType).length > 1 ? "s" : ""}{" "}
                      deployed
                    </span>
                    {Object.keys(sensorsByType).length >= 4 && (
                      <span className="text-success ml-2">
                        • Excellent diversity
                      </span>
                    )}
                    {Object.keys(sensorsByType).length === 3 && (
                      <span className="text-warning ml-2">
                        • Good diversity
                      </span>
                    )}
                    {Object.keys(sensorsByType).length <= 2 && (
                      <span className="text-danger ml-2">
                        • Limited diversity
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Quick Recommendations */}
            {liveShapeData.pollutionAnalysis.recommendations.length > 0 && (
              <div>
                <h4 className="font-semibold text-foreground mb-2">
                  Quick Actions
                </h4>
                <div className="space-y-1">
                  {liveShapeData.pollutionAnalysis.recommendations
                    .slice(0, 2)
                    .map((recommendation, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-2 text-sm text-foreground/80"
                      >
                        <Icon
                          className="text-primary mt-0.5 flex-shrink-0"
                          icon="tabler:arrow-right"
                        />
                        <span>{recommendation}</span>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </CardBody>

        <CardFooter className="pt-0 flex gap-2">
          <Button
            className="flex-1"
            color="primary"
            startContent={<Icon icon="tabler:chart-line" />}
            variant="flat"
            onPress={() => setShowDetails(true)}
          >
            Detailed Analysis
          </Button>
          <Button className="px-6" variant="bordered" onPress={onClose}>
            Close
          </Button>
        </CardFooter>
      </Card>

      {/* Detailed Analysis Modal */}
      <Modal
        backdrop="blur"
        classNames={{
          wrapper: "z-[1100]",
          backdrop: "z-[1099]",
          base: "z-[1101]",
        }}
        isOpen={showDetails}
        scrollBehavior="inside"
        size="3xl"
        onClose={() => setShowDetails(false)}
      >
        <ModalContent>
          <ModalHeader>
            <div className="flex items-center gap-3">
              <Icon
                className="text-2xl"
                icon={pollutionInfo.icon}
                style={{ color: pollutionInfo.color }}
              />
              <div>
                <h3 className="text-xl font-bold">
                  Detailed Analysis: {liveShapeData.shape.name}
                </h3>
                <p className="text-sm text-foreground/60 font-normal">
                  Environmental monitoring report
                </p>
              </div>
            </div>
          </ModalHeader>
          <ModalBody>
            <div className="space-y-6">
              {/* Individual Sensor Analysis */}
              <div>
                <h4 className="font-semibold text-lg mb-4">Sensor Readings</h4>
                <div className="space-y-3">
                  {liveShapeData.pollutionAnalysis.sensors.map((sensor) => {
                    const sensorInfo = getSensorTypeInfo(sensor.type);
                    const sensorPollutionInfo = getPollutionLevelInfo(
                      sensor.pollutionLevel,
                    );

                    return (
                      <Card
                        key={sensor.sensorId}
                        className="border border-divider"
                      >
                        <CardBody className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div
                                className="p-2 rounded-lg"
                                style={{
                                  backgroundColor: `${sensorInfo?.color}20`,
                                }}
                              >
                                <Icon
                                  className="text-lg"
                                  icon={sensorInfo?.icon || "tabler:cpu"}
                                  style={{ color: sensorInfo?.color }}
                                />
                              </div>
                              <div>
                                <div className="font-semibold text-foreground">
                                  {sensor.sensorName}
                                </div>
                                <div className="text-sm text-foreground/60">
                                  {sensorInfo?.label}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div
                                className="text-lg font-bold"
                                style={{ color: sensorInfo?.color }}
                              >
                                {sensor.latestValue !== undefined
                                  ? formatSensorValue(
                                      sensor.latestValue,
                                      sensor.type,
                                    )
                                  : "---"}
                              </div>
                              <Chip
                                size="sm"
                                style={{
                                  backgroundColor: `${sensorPollutionInfo.color}20`,
                                  color: sensorPollutionInfo.color,
                                }}
                                variant="flat"
                              >
                                {sensorPollutionInfo.label}
                              </Chip>
                            </div>
                          </div>
                          {sensor.timestamp && (
                            <div className="mt-2 text-xs text-foreground/60">
                              Last reading:{" "}
                              {new Date(sensor.timestamp).toLocaleString()}
                            </div>
                          )}
                        </CardBody>
                      </Card>
                    );
                  })}
                </div>
              </div>

              {/* Pollution Factors */}
              {liveShapeData.pollutionAnalysis.pollutionFactors.length > 0 && (
                <div>
                  <h4 className="font-semibold text-lg mb-3">
                    Identified Issues
                  </h4>
                  <div className="space-y-2">
                    {liveShapeData.pollutionAnalysis.pollutionFactors.map(
                      (factor, index) => (
                        <div
                          key={index}
                          className="flex items-start gap-2 p-3 bg-danger-50 border border-danger-200 rounded-lg"
                        >
                          <Icon
                            className="text-danger-600 mt-0.5 flex-shrink-0"
                            icon="tabler:alert-triangle"
                          />
                          <span className="text-sm text-danger-700">
                            {factor}
                          </span>
                        </div>
                      ),
                    )}
                  </div>
                </div>
              )}

              {/* All Recommendations */}
              {liveShapeData.pollutionAnalysis.recommendations.length > 0 && (
                <div>
                  <h4 className="font-semibold text-lg mb-3">
                    Recommendations
                  </h4>
                  <div className="space-y-2">
                    {liveShapeData.pollutionAnalysis.recommendations.map(
                      (recommendation, index) => (
                        <div
                          key={index}
                          className="flex items-start gap-2 p-3 bg-primary-50 border border-primary-200 rounded-lg"
                        >
                          <Icon
                            className="text-primary-600 mt-0.5 flex-shrink-0"
                            icon="tabler:bulb"
                          />
                          <span className="text-sm text-primary-700">
                            {recommendation}
                          </span>
                        </div>
                      ),
                    )}
                  </div>
                </div>
              )}
            </div>
          </ModalBody>
          <ModalFooter>
            <Button onPress={() => setShowDetails(false)}>Close</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
