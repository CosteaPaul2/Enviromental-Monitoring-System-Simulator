import { useState } from "react";

import Map from "./Map";
import PanelSwitcher from "./PanelSwitcher";

import { Sensor, sensorsApi } from "@/lib/sensorsApi";

interface MapWithPanelProps {
  className?: string;
}

export default function MapWithPanel({
  className = "h-screen",
}: MapWithPanelProps) {
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [savedShapes] = useState<any[]>([]);
  const [isDrawing] = useState(false);
  const [shapesCount, setShapesCount] = useState(0);
  const [isDrawingMode, setIsDrawingMode] = useState(true);
  const [isAnalysisMode, setIsAnalysisMode] = useState(false);
  const [drawnShapesCount, setDrawnShapesCount] = useState(0);

  const [selectedSensor, setSelectedSensor] = useState<Sensor | null>(null);
  const [isPlacementMode, setIsPlacementMode] = useState(false);
  const [, setRefreshTrigger] = useState(0);

  const refreshSensors = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleShapeCreated = (shape: any) => {
    console.log("Shape created:", shape);
    setShapesCount((prev) => prev + 1);
  };

  const handleSaveShape = async () => {
    console.log("Saving shapes...");
  };

  const handleClearShapes = () => {
    console.log("Clearing shapes...");
    setShapesCount(0);
    setDrawnShapesCount(0);
  };

  const handleSensorPlaced = async (
    sensor: Sensor,
    lat: number,
    lng: number,
  ) => {
    try {
      const response = await sensorsApi.setSensorLocation(sensor.sensorId, {
        latitude: lat,
        longitude: lng,
      });

      if (response.success) {
        console.log(`Sensor ${sensor.sensorId} placed at ${lat}, ${lng}`);
        setSelectedSensor(null);
        refreshSensors();
      }
    } catch (error) {
      console.error("Failed to place sensor:", error);
    }
  };

  return (
    <div className={`${className} flex gap-4 p-4`}>
      <div className="w-96 flex-shrink-0">
        <PanelSwitcher
          drawnShapesCount={drawnShapesCount}
          isAnalysisMode={isAnalysisMode}
          isDrawing={isDrawing}
          isDrawingMode={isDrawingMode}
          isPlacementMode={isPlacementMode}
          selectedSensor={selectedSensor}
          selectedTool={selectedTool}
          shapesCount={shapesCount}
          onAnalysisModeChange={setIsAnalysisMode}
          onClearAllShapes={handleClearShapes}
          onClearShapes={handleClearShapes}
          onDrawingModeChange={setIsDrawingMode}
          onPlacementModeChange={setIsPlacementMode}
          onSaveShape={handleSaveShape}
          onSensorSelect={setSelectedSensor}
          onToolSelect={setSelectedTool}
        />
      </div>

      <div className="flex-1">
        <Map
          className="h-full w-full rounded-lg border border-divider"
          refreshSensors={refreshSensors}
          savedShapes={savedShapes}
          selectedSensor={selectedSensor}
          selectedTool={selectedTool}
          showSensors={true}
          onSensorPlaced={handleSensorPlaced}
          onShapeCreated={handleShapeCreated}
        />
      </div>
    </div>
  );
}
