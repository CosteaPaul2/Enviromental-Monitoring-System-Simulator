import { useEffect, useState, useCallback } from "react";
import { MapContainer, TileLayer } from "react-leaflet";
import L from "leaflet";
import { Icon } from "@iconify/react";

import "leaflet/dist/leaflet.css";

import ShapeCard from "../ShapeCard";

import DrawingControls from "./DrawingControls";
import SensorControls from "./SensorControls";
import SensorPlacementControls from "./SensorPlacementControls";

import { ClientZone } from "@/types/geometry";
import { Sensor, sensorsApi, shapesApi } from "@/lib/sensorsApi";
import {
  useSuccessNotification,
  useErrorNotification,
} from "@/contexts/NotificationContext";

// Fix Leaflet default icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

interface SimpleMapProps {
  selectedTool: string | null;
  onShapeCreated: (shape: any) => void;
  savedShapes: any[];
  className?: string;
  showSensors?: boolean;
  selectedSensor?: Sensor | null;
  onSensorPlaced?: (sensor: Sensor, lat: number, lng: number) => void;
  refreshSensors?: () => void;
  clientZones?: ClientZone[];
  onClientZoneCreated?: (zone: ClientZone) => void;
  onClientZoneClick?: (zoneId: string) => void;
  isHistoricalMode?: boolean;
}

export default function SimpleMap({
  selectedTool,
  onShapeCreated,
  savedShapes = [],
  className = "h-full w-full",
  showSensors = true,
  selectedSensor,
  onSensorPlaced,
  refreshSensors,
  clientZones = [],
  onClientZoneCreated,
  onClientZoneClick,
  isHistoricalMode = false,
}: SimpleMapProps) {
  console.log(
    "SimpleMap received clientZones:",
    clientZones?.length || 0,
    clientZones?.map((z) => z.name) || [],
  );
  console.log("SimpleMap isHistoricalMode:", isHistoricalMode);
  const [isLoading, setIsLoading] = useState(true);
  const [sensors, setSensors] = useState<Sensor[]>([]);
  const [selectedShapeData, setSelectedShapeData] = useState<any>(null);
  const [loadingShapeDetails, setLoadingShapeDetails] = useState(false);

  const addSuccessNotification = useSuccessNotification();
  const addErrorNotification = useErrorNotification();

  const handleMapReady = useCallback(() => {
    setIsLoading(false);
  }, []);

  const loadSensors = useCallback(async () => {
    if (!showSensors) return;

    try {
      const response = await sensorsApi.getSensors();

      if (response.success && response.data) {
        setSensors(response.data.sensors);
      }
    } catch (error) {
      console.error("Failed to load sensors:", error);
    }
  }, [showSensors]);

  useEffect(() => {
    loadSensors();
  }, [loadSensors]);

  useEffect(() => {
    if (refreshSensors) {
      loadSensors();
    }
  }, [refreshSensors, loadSensors]);

  const handleSensorPlaced = (sensor: Sensor, lat: number, lng: number) => {
    if (onSensorPlaced) {
      onSensorPlaced(sensor, lat, lng);
      addSuccessNotification(
        "Sensor Placed",
        `${sensor.sensorId} positioned successfully`,
        { icon: "tabler:map-pin-plus", duration: 3000 },
      );
    }
  };

  const handleShapeClick = async (shapeId: number) => {
    if (selectedTool || selectedSensor) {
      console.log("🚫 Shape click blocked - in drawing/placement mode:", {
        selectedTool,
        selectedSensor: selectedSensor?.sensorId,
      });

      return;
    }

    try {
      setLoadingShapeDetails(true);
      console.log("Fetching fresh details for shape:", shapeId);

      const response = await shapesApi.getShapeDetails(shapeId);

      if (response.success && response.data) {
        setSelectedShapeData(response.data);
        if (refreshSensors) {
          refreshSensors();
        }
      } else {
        console.error("Failed to load shape details:", response);
        addErrorNotification(
          "Error Loading Shape",
          "Failed to load detailed pollution analysis for this area",
        );
      }
    } catch (error) {
      console.error("Error loading shape details:", error);
    } finally {
      setLoadingShapeDetails(false);
    }
  };

  const effectiveSelectedTool = isHistoricalMode ? null : selectedTool;
  const effectiveSelectedSensor = isHistoricalMode ? null : selectedSensor;
  const effectiveClientZones = isHistoricalMode ? [] : clientZones;

  console.log(
    "SimpleMap effectiveClientZones (after historical filter):",
    effectiveClientZones?.length || 0,
    effectiveClientZones?.map((z) => z.name) || [],
  );

  if (typeof window === "undefined") {
    return (
      <div
        className={`${className} flex items-center justify-center bg-content1`}
      >
        <div className="text-center">
          <p className="text-foreground/60">Loading map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 bg-content1 flex items-center justify-center z-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
            <p className="text-foreground/60">Loading map...</p>
          </div>
        </div>
      )}

      {effectiveSelectedSensor && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-[1000] bg-warning/90 backdrop-blur-md text-white px-6 py-3 rounded-lg border border-warning-600 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-white animate-pulse" />
            <div className="flex items-center gap-2">
              <Icon className="text-lg" icon="tabler:map-pin-plus" />
              <span className="text-sm font-medium">
                Placing Sensor: {effectiveSelectedSensor.sensorId}
              </span>
            </div>
            <div className="text-xs opacity-75">
              Click anywhere on the map to place
            </div>
          </div>
        </div>
      )}

      {effectiveSelectedTool && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-[1000] bg-primary/90 backdrop-blur-md text-white px-4 py-2 rounded-lg border border-primary-600 shadow-lg">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
            <span className="text-sm font-medium">
              {effectiveSelectedTool.charAt(0).toUpperCase() +
                effectiveSelectedTool.slice(1)}{" "}
              Drawing Mode Active
            </span>
          </div>
        </div>
      )}

      <MapContainer
        center={[51.505, -0.09]}
        className="rounded-lg"
        style={{ height: "100%", width: "100%" }}
        whenReady={handleMapReady}
        zoom={13}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <DrawingControls
          clientZones={effectiveClientZones}
          savedShapes={savedShapes}
          selectedSensor={effectiveSelectedSensor}
          selectedTool={effectiveSelectedTool}
          onClientZoneClick={isHistoricalMode ? () => {} : onClientZoneClick}
          onClientZoneCreated={
            isHistoricalMode ? () => {} : onClientZoneCreated
          }
          onShapeClick={handleShapeClick}
          onShapeCreated={isHistoricalMode ? () => {} : onShapeCreated}
        />

        {showSensors && <SensorControls sensors={sensors} />}

        {effectiveSelectedSensor && (
          <SensorPlacementControls
            selectedSensor={effectiveSelectedSensor}
            sensors={sensors}
            onSensorPlaced={handleSensorPlaced}
          />
        )}
      </MapContainer>

      {selectedShapeData && (
        <div className="absolute top-4 right-4 w-96 max-h-[calc(100%-2rem)] overflow-y-auto z-[1000]">
          <ShapeCard
            shapeData={selectedShapeData}
            onClose={() => setSelectedShapeData(null)}
          />
        </div>
      )}

      {loadingShapeDetails && (
        <div className="absolute top-4 right-4 w-96 z-[1000]">
          <div className="bg-background/95 backdrop-blur-md border border-divider rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mr-3" />
              <span className="text-foreground">Loading shape details...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
