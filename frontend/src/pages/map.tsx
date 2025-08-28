import { useState } from "react";
import { Button } from "@heroui/button";

import { useAuth } from "@/contexts/AuthContext";
import { useAppUpdates } from "@/contexts/AppUpdateContext";
import { useHistoricalData } from "@/contexts/HistoricalDataContext";
import DefaultLayout from "@/layouts/default";
import MapContainer from "@/components/map/MapContainer";
import MapHeader from "@/components/map/MapHeader";
import MapSidebar from "@/components/map/MapSidebar";
import ShapeNamingModal from "@/components/map/ShapeNamingModal";
import { performGeometryOperation } from "@/lib/simpleTurfGeometry";
import { Sensor, sensorsApi } from "@/lib/sensorsApi";
import { useShapeManager } from "@/hooks/useShapeManager";
import { useMapData } from "@/hooks/useMapData";
import { ClientZone } from "@/types";

export default function okMapPage() {
  const { user, isAuthenticated } = useAuth();
  const { sensorUpdateTrigger, shapeUpdateTrigger, triggerShapeUpdate } =
    useAppUpdates();
  const {
    isHistoricalMode,
    selectedDateTime,
    historicalShapes,
    setHistoricalMode,
    setSelectedDateTime,
    isLoading: historicalLoading,
    error: historicalError,
  } = useHistoricalData();

  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [selectedSensor, setSelectedSensor] = useState<Sensor | null>(null);
  const [isPlacementMode, setIsPlacementMode] = useState(false);

  const [clientZones, setClientZones] = useState<ClientZone[]>([]);
  const [selectedZones, setSelectedZones] = useState<string[]>([]);
  const [operationResults, setOperationResults] = useState<ClientZone[]>([]);

  const getShapeType = (shape: any) => {
    if (shape.properties?.type) {
      switch (shape.properties.type) {
        case "rectangle":
          return "RECTANGLE";
        case "polygon":
          return "POLYGON";
        case "circle":
          return "CIRCLE";
      }
    }

    switch (shape.geometry?.type) {
      case "Polygon":
        if (shape.geometry.coordinates?.[0]?.length === 5) {
          return "RECTANGLE";
        }

        return "POLYGON";
      case "Point":
        return "CIRCLE";
      default:
        return "POLYGON";
    }
  };

  const saveShapeToDatabase = async (shapeData: any, name: string) => {
    const shapeType = getShapeType(shapeData);
    const shapePayload = {
      name: name,
      type: shapeType,
      geometry: shapeData.geometry,
    };

    const api = await import("axios").then((m) => m.default);
    const axiosInstance = api.create({
      baseURL: "http://localhost:3333",
      timeout: 10000,
      headers: {
        "Content-Type": "application/json",
      },
    });

    const token = document.cookie
      .split(";")
      .find((row) => row.trim().startsWith("access_token="))
      ?.split("=")[1];

    if (token) {
      axiosInstance.defaults.headers.Authorization = `Bearer ${token}`;
    }

    const response = await axiosInstance.post("/shapes", shapePayload);

    if (!response.data?.success) {
      throw new Error("Failed to save shape to database");
    }

    triggerShapeUpdate();
  };

  const {
    saving,
    pendingShape,
    shapeName,
    isModalOpen,
    handleShapeCreated,
    handleSaveShape,
    handleCancelShape,
    setShapeName,
    handleClientZoneCreated,
  } = useShapeManager({
    onShapeSave: saveShapeToDatabase,
  });

  const { savedShapes, loading } = useMapData({
    isAuthenticated,
    isHistoricalMode,
    selectedDateTime,
    sensorUpdateTrigger,
    shapeUpdateTrigger,
  });

  const handleSensorPlaced = async (sensor: any, lat: number, lng: number) => {
    try {
      const response = await sensorsApi.setSensorLocation(sensor.sensorId, {
        latitude: lat,
        longitude: lng,
      });

      if (response.success) {
        setSelectedSensor(null);
        triggerShapeUpdate();
      }
    } catch (error) {
      console.error("Failed to place sensor:", error);
    }
  };

  const handleClientZoneSelect = (zoneId: string) => {
    if (zoneId === "clear-all") {
      setSelectedZones([]);
      setClientZones((prev) =>
        prev.map((zone) => ({ ...zone, selected: false })),
      );

      return;
    }

    setSelectedZones((prev) => {
      const isSelected = prev.includes(zoneId);
      const newSelection = isSelected
        ? prev.filter((id) => id !== zoneId)
        : [...prev, zoneId];

      setClientZones((prevZones) =>
        prevZones.map((zone) => ({
          ...zone,
          selected: newSelection.includes(zone.id),
        })),
      );

      return newSelection;
    });
  };

  const handleClientZoneCreatedWithState = async (zone: ClientZone) => {
    setClientZones((prev) => [...prev, zone]);
    setSelectedTool(null);
    await handleClientZoneCreated(zone);
  };

  const handleClientZoneClick = (zoneId: string) => {
    handleClientZoneSelect(zoneId);
  };

  const handleClientZoneDelete = (zoneId: string) => {
    console.log("Deleting zone:", zoneId);
    setClientZones((prev) => {
      const filtered = prev.filter((zone) => zone.id !== zoneId);

      console.log("Zones after deletion:", filtered.length);

      return filtered;
    });
    setSelectedZones((prev) => prev.filter((id) => id !== zoneId));
  };

  const handleClearAllClientZones = () => {
    setClientZones([]);
    setSelectedZones([]);
    setOperationResults([]);
  };

  const handleGeometryOperation = (
    operation: string,
    zoneIds: readonly string[],
  ) => {
    const selectedZoneObjects = clientZones.filter((zone) =>
      zoneIds.includes(zone.id),
    );

    const operationRequirements = {
      union: 2,
      intersection: 2,
      contains: 2,
      "buffer-1km": 1,
    };

    const minRequired =
      operationRequirements[operation as keyof typeof operationRequirements] ||
      2;

    if (selectedZoneObjects.length < minRequired) {
      console.warn(
        `Operation ${operation} requires at least ${minRequired} zones, got ${selectedZoneObjects.length}`,
      );

      return;
    }

    const result = performGeometryOperation(operation, selectedZoneObjects);

    if (result) {
      setOperationResults((prev) => [...prev, result]);
      setSelectedZones([]);
      setClientZones((prev) =>
        prev.map((zone) => ({ ...zone, selected: false })),
      );
    }
  };

  const handleClearOperationResults = () => {
    setOperationResults([]);
  };

  const displayShapes = isHistoricalMode ? historicalShapes : savedShapes;

  if (!isAuthenticated) {
    return (
      <DefaultLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-4">Map Access Restricted</h1>
            <p className="text-foreground/60 mb-6">
              Please log in to access the environmental monitoring map.
            </p>
            <Button
              color="primary"
              onPress={() => (window.location.href = "/login")}
            >
              Go to Login
            </Button>
          </div>
        </div>
      </DefaultLayout>
    );
  }

  return (
    <DefaultLayout>
      <div className="h-full flex flex-col">
        <MapHeader
          isHistoricalMode={isHistoricalMode}
          isSaving={saving}
          selectedDateTime={selectedDateTime}
          temporaryShapesCount={0}
          userName={user?.name}
          onSaveShapes={() => {}}
          onViewSensors={() => (window.location.href = "/sensors")}
        />

        <div className="flex-1 flex min-h-0">
          <MapSidebar
            clientZones={clientZones}
            displayShapes={displayShapes}
            historicalError={historicalError}
            historicalLoading={historicalLoading}
            isDrawing={!!selectedTool}
            isHistoricalMode={isHistoricalMode}
            isPlacementMode={isPlacementMode}
            loading={loading}
            operationResults={operationResults}
            selectedDateTime={selectedDateTime}
            selectedSensor={selectedSensor}
            selectedTool={selectedTool}
            selectedZones={selectedZones}
            shapesCount={0}
            temporaryShapes={[]}
            onClearAllZones={handleClearAllClientZones}
            onClearResults={handleClearOperationResults}
            onClearShapes={() => {}}
            onDateTimeChange={setSelectedDateTime}
            onGeometryOperation={handleGeometryOperation}
            onPlacementModeChange={setIsPlacementMode}
            onSaveShape={undefined}
            onSensorSelect={setSelectedSensor}
            onToggleHistoricalMode={setHistoricalMode}
            onToolSelect={setSelectedTool}
            onZoneDelete={handleClientZoneDelete}
            onZoneSelect={handleClientZoneSelect}
          />

          <MapContainer
            clientZones={clientZones}
            isHistoricalMode={isHistoricalMode}
            operationResults={operationResults}
            savedShapes={displayShapes}
            selectedSensor={selectedSensor}
            selectedTool={selectedTool}
            sensorUpdateTrigger={sensorUpdateTrigger}
            shapeUpdateTrigger={shapeUpdateTrigger}
            onClientZoneClick={handleClientZoneClick}
            onClientZoneCreated={handleClientZoneCreatedWithState}
            onSensorPlaced={handleSensorPlaced}
            onShapeCreated={handleShapeCreated}
          />
        </div>
      </div>

      <ShapeNamingModal
        isOpen={isModalOpen}
        isSaving={saving}
        pendingShapeType={pendingShape?.properties?.type}
        shapeName={shapeName}
        onClose={handleCancelShape}
        onSaveShape={handleSaveShape}
        onShapeNameChange={setShapeName}
      />
    </DefaultLayout>
  );
}
