import { Card, CardHeader, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Divider } from "@heroui/divider";
import { Switch } from "@heroui/switch";
import { Tooltip } from "@heroui/tooltip";
import { Icon } from "@iconify/react";

interface DrawingPanelProps {
  selectedTool: string | null;
  onToolSelect: (toolId: string | null) => void;
  onSaveShape?: () => Promise<void>;
  onClearShapes: () => void;
  isDrawing: boolean;
  shapesCount: number;
  isDrawingMode?: boolean;
  onDrawingModeChange?: (enabled: boolean) => void;
  isAnalysisMode?: boolean;
  onAnalysisModeChange?: (enabled: boolean) => void;
  drawnShapesCount?: number;
  onClearAllShapes?: () => void;
}

interface DrawingTool {
  id: string;
  name: string;
  icon: string;
  color: "primary" | "secondary" | "success" | "warning" | "danger";
  description: string;
  dbType: "POLYGON" | "RECTANGLE" | "CIRCLE";
}

const drawingTools: DrawingTool[] = [
  {
    id: "polygon",
    name: "Custom Area",
    icon: "tabler:polygon",
    color: "success",
    description:
      "Draw irregular monitoring zones - click corners, double-click to finish",
    dbType: "POLYGON",
  },
  {
    id: "rectangle",
    name: "Monitoring Zone",
    icon: "tabler:square",
    color: "warning",
    description: "Create rectangular area boundaries - click and drag to draw",
    dbType: "RECTANGLE",
  },
  {
    id: "circle",
    name: "Impact Radius",
    icon: "tabler:circle",
    color: "primary",
    description:
      "Define circular impact zones - click center, drag to set radius",
    dbType: "CIRCLE",
  },
];

export default function DrawingPanel({
  selectedTool,
  onToolSelect,
  onSaveShape,
  onClearShapes,
  isDrawing: _isDrawing,
  shapesCount,
  isDrawingMode = true,
  onDrawingModeChange,
  isAnalysisMode = false,
  onAnalysisModeChange,
  drawnShapesCount,
  onClearAllShapes,
}: DrawingPanelProps) {
  const activeTool = drawingTools.find((tool) => tool.id === selectedTool);

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between w-full">
          <h3 className="text-lg font-semibold">Zone Creation</h3>
          <div className="flex gap-2">
            {(shapesCount > 0 ||
              (drawnShapesCount && drawnShapesCount > 0)) && (
              <Chip color="primary" size="sm" variant="flat">
                {shapesCount || drawnShapesCount} zones
              </Chip>
            )}
          </div>
        </div>
      </CardHeader>

      <CardBody className="space-y-4">
        {(onDrawingModeChange || onAnalysisModeChange) && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-foreground-600">
              Mode Selection
            </h4>

            <div className="space-y-2">
              {onDrawingModeChange && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Drawing Mode</span>
                    {isDrawingMode && (
                      <Chip color="primary" size="sm" variant="flat">
                        Active
                      </Chip>
                    )}
                  </div>
                  <Switch
                    color="primary"
                    isSelected={isDrawingMode}
                    size="sm"
                    onValueChange={onDrawingModeChange}
                  />
                </div>
              )}

              {onAnalysisModeChange && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Analysis Mode</span>
                    {isAnalysisMode && (
                      <Chip color="secondary" size="sm" variant="flat">
                        Active
                      </Chip>
                    )}
                  </div>
                  <Switch
                    color="secondary"
                    isSelected={isAnalysisMode}
                    size="sm"
                    onValueChange={onAnalysisModeChange}
                  />
                </div>
              )}
            </div>

            {isAnalysisMode && (
              <div className="p-3 rounded-lg bg-warning-50 border border-warning-200">
                <div className="flex items-center gap-2 mb-2">
                  <Icon
                    className="text-warning-600 text-lg"
                    icon="tabler:alert-triangle"
                  />
                  <span className="text-sm font-medium text-warning-700">
                    Analysis Mode Active
                  </span>
                </div>
                <p className="text-xs text-warning-600">
                  Shapes created in this mode are temporary and won't be saved
                  to the database.
                </p>
              </div>
            )}
          </div>
        )}

        {!isDrawingMode && onDrawingModeChange && (
          <div className="text-center py-6">
            <Icon className="text-4xl text-gray-400 mb-2" icon="tabler:edit" />
            <p className="text-gray-500 text-sm">
              Enable Drawing Mode to start drawing
            </p>
          </div>
        )}

        {(isDrawingMode || !onDrawingModeChange) && (
          <>
            <Divider />

            <div className="space-y-3">
              <h4 className="text-sm font-medium text-foreground-600">
                Select Monitoring Zone Type
              </h4>

              <div className="grid grid-cols-2 gap-2">
                {drawingTools.map((tool) => (
                  <Tooltip
                    key={tool.id}
                    content={tool.description}
                    placement="top"
                  >
                    <Button
                      className={`h-16 flex-col gap-1 transition-all duration-200 ${
                        selectedTool === tool.id
                          ? "shadow-lg scale-105"
                          : "hover:scale-102"
                      }`}
                      color={selectedTool === tool.id ? tool.color : "default"}
                      size="lg"
                      variant={selectedTool === tool.id ? "solid" : "flat"}
                      onPress={() => {
                        if (selectedTool === tool.id) {
                          onToolSelect(null);
                        } else {
                          onToolSelect(tool.id);
                        }
                      }}
                    >
                      <Icon className="text-xl" icon={tool.icon} />
                      <span className="text-xs">{tool.name}</span>
                      {selectedTool === tool.id && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                      )}
                    </Button>
                  </Tooltip>
                ))}
              </div>
            </div>

            {selectedTool && (
              <div className="p-3 rounded-lg bg-green-50 border border-green-200">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <Icon
                    className="text-sm"
                    icon={activeTool?.icon || "tabler:polygon"}
                  />
                  <span className="text-sm font-medium text-green-700">
                    {activeTool?.name} Tool Active
                  </span>
                </div>
                <p className="text-xs text-green-600 mb-3">
                  {activeTool?.description}
                </p>

                <div className="space-y-2">
                  <div className="p-2 bg-green-100 rounded-md">
                    <div className="flex items-center gap-2 text-xs text-green-700">
                      <Icon className="text-sm" icon="tabler:cursor-arrow" />
                      <span>Map cursor changed to crosshair</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-green-700 mt-1">
                      <Icon className="text-sm" icon="tabler:hand-grab" />
                      <span>Map dragging is disabled while drawing</span>
                    </div>
                  </div>

                  <div className="p-2 bg-blue-100 rounded-md">
                    <div className="text-xs text-blue-700">
                      <strong>Ready to draw!</strong> The map cursor is now a
                      crosshair.
                      {selectedTool === "rectangle" && (
                        <div className="mt-1">
                          <strong>Monitoring Zone:</strong> Click and drag to
                          create rectangular area boundaries
                        </div>
                      )}
                      {selectedTool === "polygon" && (
                        <div className="mt-1">
                          <strong>Custom Area:</strong> Click to add boundary
                          points, double-click to finish zone
                        </div>
                      )}
                      {selectedTool === "circle" && (
                        <div className="mt-1">
                          <strong>Impact Radius:</strong> Click center point,
                          drag to set radius for circular impact zone
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="text-center">
                    <p className="text-xs text-green-600">
                      💡 Click the tool again to deactivate
                    </p>
                  </div>
                </div>
              </div>
            )}

            {(shapesCount > 0 ||
              (drawnShapesCount && drawnShapesCount > 0)) && (
              <>
                <Divider />
                <Button
                  className="w-full"
                  color="danger"
                  size="sm"
                  startContent={<Icon icon="tabler:trash" />}
                  variant="flat"
                  onPress={onClearShapes || onClearAllShapes}
                >
                  Clear All Zones ({shapesCount || drawnShapesCount})
                </Button>
              </>
            )}

            {onSaveShape && shapesCount > 0 && (
              <Button
                className="w-full"
                color="success"
                size="sm"
                startContent={<Icon icon="tabler:device-floppy" />}
                variant="solid"
                onPress={onSaveShape}
              >
                Save Monitoring Zones ({shapesCount})
              </Button>
            )}
          </>
        )}
      </CardBody>
    </Card>
  );
}
