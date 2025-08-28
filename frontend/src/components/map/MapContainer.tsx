import { memo } from "react";

import SimpleMap from "./SimpleMap";

import { ClientZone } from "@/types";

interface MapContainerProps {
  readonly clientZones: readonly ClientZone[];
  readonly operationResults: readonly ClientZone[];
  readonly savedShapes: readonly any[];
  readonly selectedSensor: any;
  readonly selectedTool: string | null;
  readonly sensorUpdateTrigger: number;
  readonly shapeUpdateTrigger: number;
  readonly isHistoricalMode: boolean;
  readonly onClientZoneClick: (zoneId: string) => void;
  readonly onClientZoneCreated: (zone: ClientZone) => void;
  readonly onSensorPlaced: (sensor: any, lat: number, lng: number) => void;
  readonly onShapeCreated: (shapeData: any) => void;
}

const MapContainer = memo<MapContainerProps>(
  ({
    clientZones,
    operationResults,
    savedShapes,
    selectedSensor,
    selectedTool,
    sensorUpdateTrigger,
    shapeUpdateTrigger,
    isHistoricalMode,
    onClientZoneClick,
    onClientZoneCreated,
    onSensorPlaced,
    onShapeCreated,
  }) => {
    console.log("MapContainer received:", {
      clientZones: clientZones.length,
      operationResults: operationResults.length,
      savedShapes: savedShapes.length,
      isHistoricalMode,
    });

    const allZones = [...clientZones, ...operationResults];

    console.log(
      "MapContainer allZones for SimpleMap:",
      allZones.length,
      allZones.map((z) => z.name),
    );

    return (
      <div className="flex-1 relative">
        <SimpleMap
          key={`${sensorUpdateTrigger}-${shapeUpdateTrigger}-${isHistoricalMode ? "historical" : "live"}`}
          className="h-full w-full"
          clientZones={allZones}
          isHistoricalMode={isHistoricalMode}
          savedShapes={[...savedShapes]}
          selectedSensor={selectedSensor}
          selectedTool={selectedTool}
          showSensors={true}
          onClientZoneClick={onClientZoneClick}
          onClientZoneCreated={onClientZoneCreated}
          onSensorPlaced={onSensorPlaced}
          onShapeCreated={onShapeCreated}
        />
      </div>
    );
  },
);

MapContainer.displayName = "MapContainer";

export default MapContainer;
