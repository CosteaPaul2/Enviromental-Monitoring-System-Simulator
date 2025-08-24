import { useState } from "react";
import { Card, CardHeader, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Icon } from "@iconify/react";
import { Tooltip } from "@heroui/tooltip";

import { ClientZone } from "../types/geometry";
import { 
  spatialAnalysisApi, 
  ClientZoneAnalysis,
  formatPopulation,
  formatArea,
  getRiskColor,
  getRiskIcon,
  generateAnalysisSummary,
  isHighPriorityArea,
  getPriorityAlertMessage
} from "@/lib/spatialAnalysisApi";
import {
  useSuccessNotification,
  useErrorNotification,
  useWarningNotification,
} from "@/contexts/NotificationContext";

export type { ClientZone };

interface GeometryOperationsPanelProps {
  selectedTool: string | null;
  onToolSelect: (toolId: string | null) => void;
  clientZones: ClientZone[];
  selectedZones: string[];
  onZoneSelect: (zoneId: string) => void;
  onZoneDelete: (zoneId: string) => void;
  onClearAllZones: () => void;
  onGeometryOperation: (operation: string, zoneIds: string[]) => void;
  operationResults?: ClientZone[];
  onClearResults?: () => void;
}

const drawingTools = [
  {
    id: "geo-rectangle",
    name: "Analysis Area",
    icon: "tabler:square",
    description: "Draw rectangular analysis zones to assess population impact",
  },
  {
    id: "geo-polygon",
    name: "Custom Analysis",
    icon: "tabler:polygon",
    description: "Draw custom shapes to analyze irregular areas",
  },
  {
    id: "geo-circle",
    name: "Impact Zone",
    icon: "tabler:circle",
    description: "Draw circular zones to assess radial impact areas",
  },
];

const geometryOperations = [
  {
    id: "union",
    name: "Combine Pollution Zones",
    icon: "tabler:circle-plus",
    description:
      "Merge multiple pollution sources into one combined impact area",
    useCase:
      "Use when: Multiple factories/highways near each other - need to see total affected area",
    example: "Factory + Highway + Construction → Combined pollution zone",
    minSelection: 2,
    color: "warning",
  },
  {
    id: "intersection",
    name: "Population at Risk",
    icon: "tabler:alert-triangle",
    description: "Find where pollution zones overlap with residential areas",
    useCase:
      "Use when: Need to identify people exposed to pollution for health advisories",
    example: "Industrial Zone ∩ Residential Area → People needing evacuation",
    minSelection: 2,
    color: "danger",
  },
  {
    id: "buffer-1km",
    name: "Safety Protection Buffer",
    icon: "tabler:shield",
    description:
      "Create 1km regulatory protection zone around pollution source",
    useCase:
      "Use when: Legal requirement to protect schools/hospitals from pollution",
    example: "Factory → 1km safety buffer → Regulatory compliance check",
    minSelection: 1,
    color: "primary",
  },
  {
    id: "contains",
    name: "Coverage Verification",
    icon: "tabler:shield-check",
    description: "Check if safety buffer completely covers all sensitive areas",
    useCase:
      "Use when: Verify all schools/hospitals are within protective buffer zone",
    example: "Safety Buffer contains School + Hospital → Compliance verified",
    minSelection: 2,
    color: "success",
  },
];

export default function GeometryOperationsPanel({
  selectedTool,
  onToolSelect,
  clientZones,
  selectedZones,
  onZoneSelect,
  onZoneDelete,
  onClearAllZones,
  onGeometryOperation,
  operationResults = [],
  onClearResults,
}: GeometryOperationsPanelProps) {
  const [zoneAnalysis, setZoneAnalysis] = useState<Map<string, ClientZoneAnalysis>>(new Map());
  const [analyzingZones, setAnalyzingZones] = useState<Set<string>>(new Set());
  
  const addSuccessNotification = useSuccessNotification();
  const addErrorNotification = useErrorNotification();
  const addWarningNotification = useWarningNotification();

  const selectedZoneCount = selectedZones.length;
  const totalZones = clientZones.length;

  const analyzeZone = async (zone: ClientZone) => {
    if (analyzingZones.has(zone.id)) return;

    setAnalyzingZones(prev => new Set(prev).add(zone.id));

    try {
      const response = await spatialAnalysisApi.analyzeClientZone({
        geometry: zone.geometry,
        name: zone.name
      });

      if (response.success && response.data) {
        setZoneAnalysis(prev => new Map(prev).set(zone.id, response.data!));
        
        // Show notification for high-priority areas
        if (isHighPriorityArea(response.data.analysis)) {
          const alertMessage = getPriorityAlertMessage(response.data.analysis);
          if (alertMessage) {
            if (response.data.analysis.riskAssessment.level === 'critical') {
              addWarningNotification("Critical Area Detected", alertMessage, {
                persistent: true,
                icon: "tabler:alert-triangle"
              });
            } else {
              addSuccessNotification("Analysis Complete", `${zone.name}: ${generateAnalysisSummary(response.data.analysis)}`, {
                duration: 8000,
                icon: "tabler:chart-area"
              });
            }
          }
        }
      } else {
        addErrorNotification("Analysis Failed", response.message || "Could not analyze zone");
      }
    } catch (error) {
      console.error("Failed to analyze zone:", error);
      addErrorNotification("Analysis Error", "Failed to perform spatial analysis");
    } finally {
      setAnalyzingZones(prev => {
        const next = new Set(prev);
        next.delete(zone.id);
        return next;
      });
    }
  };

  const getZoneAnalysis = (zoneId: string): ClientZoneAnalysis | undefined => {
    return zoneAnalysis.get(zoneId);
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      <Card className="border-none shadow-sm bg-gradient-to-br from-success/10 via-primary/10 to-warning/10 border-success/20">
        <CardBody className="py-3">
          <div className="text-center">
            <Icon
              className="text-2xl text-success mb-1 mx-auto"
              icon="tabler:world-question"
            />
            <h3 className="font-semibold text-success mb-1">
              Environmental Impact Analysis
            </h3>
            <p className="text-xs text-success/80 leading-relaxed">
              Professional-grade spatial analysis for pollution monitoring,
              regulatory compliance, and emergency response planning
            </p>
            <div className="flex justify-center gap-4 mt-2 text-xs text-success/60">
              <span>🏭 Pollution Sources</span>
              <span>🏘️ Population Risk</span>
              <span>🏫 Regulatory Buffers</span>
            </div>
          </div>
        </CardBody>
      </Card>

      <Card className="border-none shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <Icon className="text-primary" icon="tabler:pencil" />
              <h3 className="text-base font-semibold">Drawing Tools</h3>
            </div>
            <Chip color="primary" size="sm" variant="flat">
              {totalZones} zone{totalZones !== 1 ? "s" : ""}
            </Chip>
          </div>
        </CardHeader>
        <CardBody className="pt-0">
          <div className="grid grid-cols-3 gap-2 mb-3">
            {drawingTools.map((tool) => (
              <Button
                key={tool.id}
                className="h-12 flex-col gap-1"
                color={selectedTool === tool.id ? "primary" : "default"}
                size="sm"
                variant={selectedTool === tool.id ? "solid" : "flat"}
                onPress={() =>
                  onToolSelect(selectedTool === tool.id ? null : tool.id)
                }
              >
                <Icon
                  className={
                    selectedTool === tool.id
                      ? "text-white text-sm"
                      : "text-primary text-sm"
                  }
                  icon={tool.icon}
                />
                <span className="text-xs font-medium">{tool.name}</span>
              </Button>
            ))}
          </div>

          {selectedTool && (
            <div className="p-2 bg-primary/10 rounded-lg border border-primary/20">
              <div className="flex items-center gap-2">
                <Icon
                  className="text-primary text-sm"
                  icon="tabler:info-circle"
                />
                <span className="text-xs text-primary font-medium">
                  {drawingTools.find((t) => t.id === selectedTool)?.description}
                </span>
              </div>
            </div>
          )}
        </CardBody>
      </Card>

      {totalZones > 0 && (
        <Card className="border-none shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <Icon className="text-secondary" icon="tabler:cursor-finger" />
                <h3 className="text-base font-semibold">Select Zones</h3>
              </div>
              {selectedZoneCount > 0 && (
                <Chip color="success" size="sm" variant="flat">
                  {selectedZoneCount} selected
                </Chip>
              )}
            </div>
          </CardHeader>
          <CardBody className="pt-0">
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {clientZones.map((zone) => (
                <div
                  key={zone.id}
                  className={`p-2 rounded-lg border transition-all ${
                    zone.selected
                      ? "bg-success/10 border-success/30 shadow-sm"
                      : "bg-content2 border-divider hover:bg-content3"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div
                      className="flex items-center gap-2 flex-1 cursor-pointer"
                      onClick={() => onZoneSelect(zone.id)}
                    >
                      <div
                        className="w-3 h-3 rounded border-2 flex-shrink-0"
                        style={{
                          backgroundColor: zone.selected
                            ? zone.color
                            : "transparent",
                          borderColor: zone.color,
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">
                          {zone.name}
                        </div>
                        <div className="text-xs text-default-500 capitalize">
                          {zone.type}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                      {/* Analysis button */}
                      <Tooltip content="Analyze population impact">
                        <Button
                          isIconOnly
                          className="opacity-60 hover:opacity-100 w-6 h-6 flex-shrink-0"
                          color={getZoneAnalysis(zone.id) ? "success" : "primary"}
                          isLoading={analyzingZones.has(zone.id)}
                          size="sm"
                          variant="flat"
                          onPress={() => analyzeZone(zone)}
                        >
                          {!analyzingZones.has(zone.id) && (
                            <Icon 
                              icon={getZoneAnalysis(zone.id) ? "tabler:chart-area-filled" : "tabler:chart-area"}
                              className="text-xs"
                            />
                          )}
                        </Button>
                      </Tooltip>
                      
                      {/* Delete button */}
                      <Tooltip content="Delete zone">
                        <Button
                          isIconOnly
                          className="opacity-60 hover:opacity-100 w-6 h-6 flex-shrink-0"
                          color="danger"
                          size="sm"
                          variant="light"
                          onPress={() => onZoneDelete(zone.id)}
                        >
                          <Icon className="text-xs" icon="tabler:trash" />
                        </Button>
                      </Tooltip>
                    </div>
                  </div>
                  
                  {/* Analysis results */}
                  {getZoneAnalysis(zone.id) && (
                    <div className="mt-2 p-2 bg-content1 rounded border border-divider">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Icon 
                            icon={getRiskIcon(getZoneAnalysis(zone.id)!.analysis.riskAssessment.level)}
                            className="text-sm"
                            style={{ color: getRiskColor(getZoneAnalysis(zone.id)!.analysis.riskAssessment.level) }}
                          />
                          <span className="text-xs font-medium">Impact Analysis</span>
                        </div>
                        <Chip 
                          size="sm" 
                          variant="flat"
                          style={{ 
                            backgroundColor: `${getRiskColor(getZoneAnalysis(zone.id)!.analysis.riskAssessment.level)}20`,
                            color: getRiskColor(getZoneAnalysis(zone.id)!.analysis.riskAssessment.level)
                          }}
                        >
                          {getZoneAnalysis(zone.id)!.analysis.riskAssessment.level.toUpperCase()} RISK
                        </Chip>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-default-500">Population:</span>
                          <br />
                          <span className="font-medium">
                            {formatPopulation(getZoneAnalysis(zone.id)!.analysis.population)}
                          </span>
                        </div>
                        <div>
                          <span className="text-default-500">Area:</span>
                          <br />
                          <span className="font-medium">
                            {formatArea(getZoneAnalysis(zone.id)!.analysis.population.area)}
                          </span>
                        </div>
                        <div>
                          <span className="text-default-500">Hospitals:</span>
                          <br />
                          <span className="font-medium">
                            {getZoneAnalysis(zone.id)!.analysis.infrastructure.healthcare.hospitals}
                          </span>
                        </div>
                        <div>
                          <span className="text-default-500">Schools:</span>
                          <br />
                          <span className="font-medium">
                            {getZoneAnalysis(zone.id)!.analysis.infrastructure.education.schools}
                          </span>
                        </div>
                      </div>
                      
                      {getZoneAnalysis(zone.id)!.analysis.sensors.total > 0 && (
                        <div className="mt-2 p-1 bg-primary/10 rounded text-xs">
                          <Icon icon="tabler:device-analytics" className="inline mr-1 text-primary" />
                          <span className="text-primary font-medium">
                            {getZoneAnalysis(zone.id)!.analysis.sensors.active}/
                            {getZoneAnalysis(zone.id)!.analysis.sensors.total} sensors active
                          </span>
                        </div>
                      )}
                      
                      {getZoneAnalysis(zone.id)!.analysis.riskAssessment.factors.length > 0 && (
                        <div className="mt-2">
                          <div className="text-xs text-default-500 mb-1">Risk Factors:</div>
                          <div className="text-xs space-y-1">
                            {getZoneAnalysis(zone.id)!.analysis.riskAssessment.factors.slice(0, 2).map((factor, idx) => (
                              <div key={idx} className="flex items-start gap-1">
                                <Icon icon="tabler:alert-circle" className="text-warning mt-0.5 text-xs flex-shrink-0" />
                                <span className="text-warning">{factor}</span>
                              </div>
                            ))}
                            {getZoneAnalysis(zone.id)!.analysis.riskAssessment.factors.length > 2 && (
                              <div className="text-xs text-default-400">
                                +{getZoneAnalysis(zone.id)!.analysis.riskAssessment.factors.length - 2} more factors
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-3">
              <Button
                className="flex-1"
                color="warning"
                size="sm"
                startContent={<Icon icon="tabler:square-off" />}
                variant="flat"
                onPress={() => onZoneSelect("clear-all")}
              >
                Clear Selection
              </Button>
              <Button
                className="flex-1"
                color="danger"
                size="sm"
                startContent={<Icon icon="tabler:trash" />}
                variant="flat"
                onPress={onClearAllZones}
              >
                Clear All
              </Button>
            </div>
          </CardBody>
        </Card>
      )}

      {totalZones === 0 && (
        <Card className="border-none shadow-sm border-dashed border-default-300">
          <CardBody className="py-6">
            <div className="text-center text-default-500">
              <Icon className="text-3xl mb-2 mx-auto" icon="tabler:map-2" />
              <p className="text-sm font-medium mb-1">No analysis zones</p>
              <p className="text-xs mb-3">
                Draw zones using the tools above to start environmental analysis
              </p>

              <div className="text-left space-y-2 max-w-sm mx-auto">
                <div className="text-xs bg-content2 rounded p-2">
                  <span className="font-medium">💡 Pro Tip:</span> Draw multiple
                  zones to:
                </div>
                <div className="text-xs space-y-1 ml-2">
                  <div>🏭 Find pollution source overlaps</div>
                  <div>🏘️ Assess population risk exposure</div>
                  <div>🏫 Verify regulatory buffer compliance</div>
                  <div>🚧 Create safety protection zones</div>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      <Card className="border-none shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <Icon className="text-success" icon="tabler:world" />
              <h3 className="text-base font-semibold">
                Environmental Analysis
              </h3>
            </div>
            {selectedZoneCount >= 1 && (
              <Chip color="success" size="sm" variant="flat">
                Ready
              </Chip>
            )}
          </div>
        </CardHeader>
        <CardBody className="pt-0">
          {selectedZoneCount === 0 ? (
            <div className="text-center py-4 text-default-500">
              <Icon className="text-2xl mb-2 mx-auto" icon="tabler:click" />
              <p className="text-sm font-medium mb-1">
                Select zones for environmental analysis
              </p>
              <p className="text-xs">Different operations require 1-2 zones</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="p-2 bg-success/10 rounded-lg border border-success/20">
                <p className="text-xs text-success font-medium text-center">
                  {selectedZoneCount} zones selected • Professional
                  environmental analysis
                </p>
              </div>

              <div className="space-y-3">
                {geometryOperations.map((operation) => {
                  const canPerform =
                    selectedZoneCount >= operation.minSelection;

                  return (
                    <Button
                      key={operation.id}
                      className="w-full h-auto py-4 px-4 justify-start"
                      color={canPerform ? (operation.color as any) : "default"}
                      isDisabled={!canPerform}
                      size="sm"
                      variant={canPerform ? "flat" : "light"}
                      onPress={() =>
                        onGeometryOperation(operation.id, selectedZones)
                      }
                    >
                      <div className="flex items-start gap-3 w-full">
                        <Icon
                          className="text-lg mt-1 flex-shrink-0"
                          icon={operation.icon}
                        />
                        <div className="text-left flex-1">
                          <div className="font-semibold text-sm mb-1">
                            {operation.name}
                          </div>
                          <div className="text-xs opacity-80 mb-1">
                            {operation.description}
                          </div>
                          <div className="text-xs opacity-70 font-medium mb-1 text-left">
                            {operation.useCase}
                          </div>
                          <div className="text-xs opacity-60 italic text-left">
                            {operation.example}
                          </div>
                          <div className="text-xs opacity-50 mt-1">
                            Requires:{" "}
                            {operation.minSelection === 1
                              ? "1 zone"
                              : `${operation.minSelection} zones`}
                          </div>
                        </div>
                      </div>
                    </Button>
                  );
                })}
              </div>
            </div>
          )}
        </CardBody>
      </Card>

      {operationResults.length > 0 && (
        <Card className="border-none shadow-sm border-success/30 bg-success/5">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <Icon className="text-success" icon="tabler:chart-bar" />
                <h3 className="text-base font-semibold text-success">
                  Environmental Impact Analysis
                </h3>
              </div>
              <Chip color="success" size="sm" variant="flat">
                {operationResults.length} result
                {operationResults.length !== 1 ? "s" : ""}
              </Chip>
            </div>
          </CardHeader>
          <CardBody className="pt-0">
            <div className="space-y-3 max-h-40 overflow-y-auto">
              {operationResults.map((result) => {
                const analysis = result.environmentalAnalysis;
                const riskColors = {
                  low: "success",
                  moderate: "warning",
                  high: "danger",
                  critical: "danger",
                } as const;

                return (
                  <div
                    key={result.id}
                    className="p-3 rounded-lg bg-content2 border border-divider"
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0 mt-0.5"
                        style={{ backgroundColor: result.color }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold text-foreground truncate mb-1">
                          {result.name}
                        </div>

                        {analysis && (
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Chip
                                className="text-xs"
                                color={riskColors[analysis.riskLevel]}
                                size="sm"
                                variant="flat"
                              >
                                {analysis.riskLevel.toUpperCase()} RISK
                              </Chip>
                              <span className="text-xs text-default-500">
                                {analysis.totalArea.toFixed(1)} km²
                              </span>
                            </div>

                            {analysis.affectedPopulation > 0 && (
                              <div className="text-xs text-default-600">
                                🏘️ ~
                                {analysis.affectedPopulation.toLocaleString()}{" "}
                                people affected
                              </div>
                            )}

                            {analysis.complianceStatus !== "compliant" && (
                              <div className="flex items-center gap-1">
                                <Icon
                                  className={`text-xs ${analysis.complianceStatus === "violation" ? "text-danger" : "text-warning"}`}
                                  icon={
                                    analysis.complianceStatus === "violation"
                                      ? "tabler:alert-triangle"
                                      : "tabler:info-circle"
                                  }
                                />
                                <span
                                  className={`text-xs font-medium ${analysis.complianceStatus === "violation" ? "text-danger" : "text-warning"}`}
                                >
                                  {analysis.complianceStatus === "violation"
                                    ? "REGULATORY VIOLATION"
                                    : "COMPLIANCE WARNING"}
                                </span>
                              </div>
                            )}

                            {analysis.recommendations.length > 0 && (
                              <div className="text-xs text-default-500 mt-1">
                                💡 {analysis.recommendations[0]}
                              </div>
                            )}
                          </div>
                        )}

                        <div className="text-xs text-default-400 mt-1">
                          Visible on map • Click to select
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {onClearResults && (
              <div className="flex gap-2 mt-3">
                <Button
                  className="flex-1"
                  color="primary"
                  size="sm"
                  startContent={<Icon icon="tabler:download" />}
                  variant="flat"
                  onPress={() => {
                    // TODO: Export environmental analysis report
                    console.log(
                      "Export environmental report:",
                      operationResults,
                    );
                  }}
                >
                  Export Report
                </Button>
                <Button
                  className="flex-1"
                  color="danger"
                  size="sm"
                  startContent={<Icon icon="tabler:trash" />}
                  variant="flat"
                  onPress={onClearResults}
                >
                  Clear Results
                </Button>
              </div>
            )}
          </CardBody>
        </Card>
      )}
    </div>
  );
}
