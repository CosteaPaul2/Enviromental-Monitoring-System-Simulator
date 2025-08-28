import { Card, CardHeader, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Icon } from "@iconify/react";
import { Tooltip } from "@heroui/tooltip";

import { ClientZone } from "../types/geometry";

import {
  useSuccessNotification,
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
    name: "Rectangle",
    icon: "tabler:square",
    description: "Draw rectangular shapes",
  },
  {
    id: "geo-polygon",
    name: "Polygon",
    icon: "tabler:polygon",
    description: "Draw custom polygon shapes",
  },
  {
    id: "geo-circle",
    name: "Circle",
    icon: "tabler:circle",
    description: "Draw circular shapes",
  },
];

const geometryOperations = [
  {
    id: "union",
    name: "Union",
    icon: "tabler:circle-plus",
    description: "Combine multiple shapes into one",
    minSelection: 2,
    color: "primary",
  },
  {
    id: "intersection",
    name: "Intersection",
    icon: "tabler:circles-relation",
    description: "Find overlapping areas between shapes",
    minSelection: 2,
    color: "secondary",
  },
  {
    id: "buffer-1km",
    name: "Buffer (1km)",
    icon: "tabler:circle-dotted",
    description: "Create 1km buffer around shape",
    minSelection: 1,
    color: "warning",
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
  const addSuccessNotification = useSuccessNotification();

  const selectedZoneCount = selectedZones.length;
  const totalZones = clientZones.length;

  // Removed complex zone analysis function

  return (
    <div className="flex flex-col h-full space-y-4">
      <Card className="border-none shadow-sm bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/20">
        <CardBody className="py-3">
          <div className="text-center">
            <Icon
              className="text-2xl text-primary mb-1 mx-auto"
              icon="tabler:map-2"
            />
            <h3 className="font-semibold text-primary mb-1">
              Shape Drawing Tools
            </h3>
            <p className="text-xs text-primary/80 leading-relaxed">
              Draw shapes on the map for monitoring zones and geometry operations
            </p>
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
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          onZoneSelect(zone.id);
                        }
                      }}
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
                    <div
                      className="flex gap-1"
                      role="button"
                      tabIndex={0}
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.stopPropagation();
                        }
                      }}
                    >

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
              <p className="text-sm font-medium mb-1">No shapes drawn</p>
              <p className="text-xs mb-3">
                Draw shapes using the tools above for geometry operations
              </p>
            </div>
          </CardBody>
        </Card>
      )}

      <Card className="border-none shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <Icon className="text-primary" icon="tabler:geometry" />
              <h3 className="text-base font-semibold">
                Geometry Operations
              </h3>
            </div>
            {selectedZoneCount >= 1 && (
              <Chip color="primary" size="sm" variant="flat">
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
                Select shapes for geometry operations
              </p>
              <p className="text-xs">Different operations require 1-2 shapes</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="p-2 bg-primary/10 rounded-lg border border-primary/20">
                <p className="text-xs text-primary font-medium text-center">
                  {selectedZoneCount} shapes selected • Geometry operations
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
                          <div className="text-xs opacity-50 mt-1">
                            Requires:{" "}
                            {operation.minSelection === 1
                              ? "1 shape"
                              : `${operation.minSelection} shapes`}
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
        <Card className="border-none shadow-sm border-success/30 bg-gradient-to-br from-success/5 via-primary/5 to-warning/5">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <Icon
                  className="text-success"
                  icon="tabler:chart-area-filled"
                />
                <h3 className="text-base font-semibold text-success">
                  Operation Results
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <Chip color="success" size="sm" variant="flat">
                  {operationResults.length} result
                  {operationResults.length !== 1 ? "s" : ""}
                </Chip>
              </div>
            </div>
          </CardHeader>
          <CardBody className="pt-0">
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {operationResults.map((result) => {
                // Simple result display

                return (
                  <div
                    key={result.id}
                    className="p-3 rounded-lg bg-content1 border border-divider hover:border-primary/30 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-start gap-3">
                        <div
                          className="w-4 h-4 rounded-full flex-shrink-0 mt-0.5 border-2 border-white shadow-sm"
                          style={{ backgroundColor: result.color }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-semibold text-foreground truncate">
                              {result.name}
                            </span>
                            <span className="text-xs text-default-400 capitalize">
                              {result.type}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs text-default-500">
                              Geometry operation result
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-1">
                      </div>
                    </div>



                    <div className="text-xs text-default-400 mt-2 pt-2 border-t border-divider">
                      <Icon className="inline mr-1" icon="tabler:eye" />
                      Visible on map • Click zone to interact
                    </div>
                  </div>
                );
              })}
            </div>

            {onClearResults && (
              <div className="flex gap-2 mt-4">
                <Button
                  className="flex-1"
                  color="primary"
                  size="sm"
                  startContent={<Icon icon="tabler:download" />}
                  variant="flat"
                  onPress={() => {
                    const exportData = {
                      operations: operationResults,
                      exportedAt: new Date().toISOString(),
                      totalResults: operationResults.length,
                    };

                    const blob = new Blob(
                      [JSON.stringify(exportData, null, 2)],
                      {
                        type: "application/json",
                      },
                    );
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement("a");

                    link.href = url;
                    link.download = `geometry-operations-${new Date().toISOString().split("T")[0]}.json`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    URL.revokeObjectURL(url);

                    addSuccessNotification(
                      "Export Complete",
                      `${operationResults.length} operation results exported`,
                    );
                  }}
                >
                  Export Results
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
