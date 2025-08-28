import { useState } from "react";
import { Card, CardHeader, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Icon } from "@iconify/react";

import DrawingPanel from "./DrawingPanel";
import SensorPanel from "./SensorPanel";
import GeometryOperationsPanel, { ClientZone } from "./GeometryOperationsPanel";

import { Sensor } from "@/lib/sensorsApi";

interface PanelSwitcherProps {
  // Drawing panel props
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

  // Sensor panel props
  onSensorSelect?: (sensor: Sensor | null) => void;
  selectedSensor?: Sensor | null;
  isPlacementMode?: boolean;
  onPlacementModeChange?: (enabled: boolean) => void;

  // Geometry operations panel props
  clientZones?: ClientZone[];
  selectedZones?: string[];
  onZoneSelect?: (zoneId: string) => void;
  onZoneDelete?: (zoneId: string) => void;
  onClearAllZones?: () => void;
  onGeometryOperation?: (operation: string, zoneIds: string[]) => void;
  operationResults?: ClientZone[];
  onClearResults?: () => void;
}

type PanelType = "drawing" | "sensors" | "geometry";

export default function PanelSwitcher(props: PanelSwitcherProps) {
  const [activePanel, setActivePanel] = useState<PanelType>("drawing");

  return (
    <div className="w-full max-w-md">
      <Card className="mb-4">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between w-full">
            <h2 className="text-xl font-bold">Controls</h2>
            <Chip color="primary" size="sm" variant="flat">
              {activePanel === "drawing"
                ? "Drawing Mode"
                : activePanel === "sensors"
                  ? "Sensor Mode"
                  : "Geometry Mode"}
            </Chip>
          </div>
        </CardHeader>
        <CardBody className="pt-0">
          <div className="grid grid-cols-3 gap-2">
            <Button
              className="flex-1"
              color={activePanel === "drawing" ? "primary" : "default"}
              size="sm"
              startContent={<Icon icon="tabler:edit" />}
              variant={activePanel === "drawing" ? "solid" : "flat"}
              onPress={() => setActivePanel("drawing")}
            >
              Drawing
            </Button>
            <Button
              className="flex-1"
              color={activePanel === "sensors" ? "warning" : "default"}
              size="sm"
              startContent={<Icon icon="tabler:cpu" />}
              variant={activePanel === "sensors" ? "solid" : "flat"}
              onPress={() => setActivePanel("sensors")}
            >
              Sensors
            </Button>
            <Button
              className="flex-1"
              color={activePanel === "geometry" ? "success" : "default"}
              size="sm"
              startContent={<Icon icon="tabler:vector" />}
              variant={activePanel === "geometry" ? "solid" : "flat"}
              onPress={() => setActivePanel("geometry")}
            >
              Geometry
            </Button>
          </div>
        </CardBody>
      </Card>

      {activePanel === "drawing" ? (
        <DrawingPanel
          drawnShapesCount={props.drawnShapesCount}
          isAnalysisMode={props.isAnalysisMode}
          isDrawing={props.isDrawing}
          isDrawingMode={props.isDrawingMode}
          selectedTool={props.selectedTool}
          shapesCount={props.shapesCount}
          onAnalysisModeChange={props.onAnalysisModeChange}
          onClearAllShapes={props.onClearAllShapes}
          onClearShapes={props.onClearShapes}
          onDrawingModeChange={props.onDrawingModeChange}
          onSaveShape={props.onSaveShape}
          onToolSelect={props.onToolSelect}
        />
      ) : activePanel === "sensors" ? (
        <SensorPanel
          isPlacementMode={props.isPlacementMode}
          selectedSensor={props.selectedSensor}
          onPlacementModeChange={props.onPlacementModeChange}
          onSensorSelect={props.onSensorSelect}
        />
      ) : (
        <GeometryOperationsPanel
          clientZones={props.clientZones || []}
          operationResults={props.operationResults || []}
          selectedTool={props.selectedTool}
          selectedZones={props.selectedZones || []}
          onClearAllZones={props.onClearAllZones || (() => {})}
          onClearResults={props.onClearResults}
          onGeometryOperation={props.onGeometryOperation || (() => {})}
          onToolSelect={props.onToolSelect}
          onZoneDelete={props.onZoneDelete || (() => {})}
          onZoneSelect={props.onZoneSelect || (() => {})}
        />
      )}
    </div>
  );
}
