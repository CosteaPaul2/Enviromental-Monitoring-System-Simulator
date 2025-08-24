import { useState, useEffect } from "react";
import { Button } from "@heroui/button";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/modal";
import { Input } from "@heroui/input";
import axios from "axios";

import { useAuth } from "@/contexts/AuthContext";
import { useAppUpdates } from "@/contexts/AppUpdateContext";
import { useHistoricalData } from "@/contexts/HistoricalDataContext";
import DefaultLayout from "@/layouts/default";
import Map from "@/components/Map";
import PanelSwitcher from "@/components/PanelSwitcher";
import HistoricalTimePicker from "@/components/monitoring/HistoricalTimePicker";
import { ClientZone } from "@/components/GeometryOperationsPanel";
import { performGeometryOperation } from "@/lib/simpleTurfGeometry";
import { Sensor, sensorsApi } from "@/lib/sensorsApi";
import { spatialAnalysisApi, generateAnalysisSummary, isHighPriorityArea, getPriorityAlertMessage } from "@/lib/spatialAnalysisApi";
import { useSuccessNotification, useWarningNotification, useErrorNotification } from "@/contexts/NotificationContext";

const api = axios.create({
  baseURL: "http://localhost:3333",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = document.cookie
    .split(";")
    .find((row) => row.trim().startsWith("access_token="))
    ?.split("=")[1];

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default function MapPage() {
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
  const [savedShapes, setSavedShapes] = useState<any[]>([]);
  const [temporaryShapes, setTemporaryShapes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Modal state for shape naming
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pendingShape, setPendingShape] = useState<any>(null);
  const [shapeName, setShapeName] = useState("");

  // Sensor management state
  const [selectedSensor, setSelectedSensor] = useState<Sensor | null>(null);
  const [isPlacementMode, setIsPlacementMode] = useState(false);

  // Client zone management state
  const [clientZones, setClientZones] = useState<ClientZone[]>([]);
  const [selectedZones, setSelectedZones] = useState<string[]>([]);
  const [operationResults, setOperationResults] = useState<ClientZone[]>([]);

  // Notification hooks
  const addSuccessNotification = useSuccessNotification();
  const addWarningNotification = useWarningNotification();
  const addErrorNotification = useErrorNotification();

  // Load user's saved shapes on component mount and when refresh triggered
  useEffect(() => {
    if (isAuthenticated) {
      loadSavedShapes();
    }
  }, [isAuthenticated, shapeUpdateTrigger]);

  // Set up automatic polling for live pollution updates
  useEffect(() => {
    if (!isAuthenticated) return;

    console.log("🔄 Setting up live shape pollution updates...");

    // Initial load
    loadSavedShapes();

    // Set up polling every 20 seconds for pollution data updates (reduced frequency)
    const pollInterval = setInterval(() => {
      console.log("🔄 Auto-refreshing shape pollution data...");
      loadSavedShapes();
    }, 20000); // 20 seconds - reduced from 15

    return () => {
      console.log("🛑 Cleaning up shape pollution polling");
      clearInterval(pollInterval);
    };
  }, [isAuthenticated]);

  // Also refresh when sensors change (placement, toggle, etc.)
  useEffect(() => {
    if (isAuthenticated && sensorUpdateTrigger > 0) {
      console.log(
        "🔄 Sensor change detected, updating shape pollution data...",
      );
      // Small delay to allow sensor data to be processed
      setTimeout(() => {
        loadSavedShapes();
        // Also trigger shape update to ensure all components refresh
        triggerShapeUpdate();
      }, 2000);
    }
  }, [sensorUpdateTrigger, isAuthenticated]);

  // Ensure shapes are redrawn when pollution data changes
  useEffect(() => {
    if (savedShapes.length > 0) {
      console.log(
        "🎨 Shape data changed, triggering redraw:",
        savedShapes.length,
        "shapes",
      );
      // Force map to redraw shapes
      const map = document.querySelector(".leaflet-map-pane");

      if (map) {
        // Trigger a resize event to force Leaflet to redraw
        window.dispatchEvent(new Event("resize"));
      }
    }
  }, [savedShapes]);

  const loadSavedShapes = async () => {
    try {
      // Use historical data if in historical mode, otherwise use live data
      const endpoint = isHistoricalMode
        ? "/shapes/historical"
        : "/shapes/geometry";
      const params = isHistoricalMode
        ? { timestamp: selectedDateTime.toISOString() }
        : {};

      const response = await api.get(endpoint, { params });

      if (response.data.success && response.data.data) {
        console.log(
          "📊 Loading shapes with pollution data:",
          response.data.data.shapes.length,
        );

        // Process shapes to ensure proper GeoJSON format
        const processedShapes = response.data.data.shapes
          .map((shape: any) => {
            try {
              // If geometry is a string, parse it
              let geometry = shape.geometry;

              if (typeof geometry === "string") {
                geometry = JSON.parse(geometry);
              }

              console.log("🎨 Processing shape with pollution data:", {
                id: shape.id,
                name: shape.name,
                pollutionLevel: shape.pollutionLevel,
                alertLevel: shape.alertLevel,
                riskScore: shape.riskScore,
              });

              return {
                type: "Feature",
                geometry: geometry,
                properties: {
                  id: shape.id,
                  name: shape.name,
                  type: shape.type,
                  createdAt: shape.createdAt,
                  updatedAt: shape.updatedAt,
                  // Preserve pollution data from backend
                  pollutionLevel: shape.pollutionLevel,
                  alertLevel: shape.alertLevel,
                  riskScore: shape.riskScore,
                  sensorCount: shape.sensorCount,
                  activeSensorCount: shape.activeSensorCount,
                },
                // These will be passed directly to the shape for coloring at the top level
                pollutionLevel: shape.pollutionLevel,
                alertLevel: shape.alertLevel,
                riskScore: shape.riskScore,
                // Include shape metadata
                id: shape.id,
                name: shape.name,
              };
            } catch (err) {
              console.error("Error processing shape:", shape, err);

              return null;
            }
          })
          .filter(Boolean);

        setSavedShapes(processedShapes);
      }
    } catch (error) {
      console.error("Failed to load shapes:", error);
      // Fallback to regular shapes endpoint without geometry
      try {
        const fallbackResponse = await api.get("/shapes");

        if (fallbackResponse.data.success && fallbackResponse.data.data) {
          console.log(
            "Fallback: Loaded shapes without geometry:",
            fallbackResponse.data.data.shapes,
          );
          setSavedShapes([]); // No geometry data, so empty array
        }
      } catch (fallbackError) {
        console.error("Fallback also failed:", fallbackError);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleShapeCreated = (shapeData: any) => {
    console.log("New shape created:", shapeData);

    // Store the shape temporarily and open naming modal
    setPendingShape(shapeData);
    setIsModalOpen(true);
    setShapeName(""); // Reset name input

    // Clear the selected tool to stop drawing mode
    setSelectedTool(null);
  };

  const handleSaveShapes = async () => {
    if (temporaryShapes.length === 0) return;

    try {
      setSaving(true);

      // Save each temporary shape
      for (const shape of temporaryShapes) {
        const shapePayload = {
          name:
            shape.properties?.name ||
            `Shape ${new Date().toLocaleTimeString()}`,
          type: getShapeType(shape),
          geometry: shape.geometry,
        };

        console.log("Saving shape:", shapePayload);

        const response = await api.post("/shapes", shapePayload);

        if (response.data.success) {
          console.log("Shape saved successfully:", response.data.data.shape);
        }
      }

      // Clear temporary shapes and reload saved shapes
      setTemporaryShapes([]);
      await loadSavedShapes();
    } catch (error) {
      console.error("Failed to save shapes:", error);
      alert("Failed to save shapes. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleClearShapes = () => {
    setTemporaryShapes([]);
    setSelectedTool(null);
  };

  const handleSaveShape = async () => {
    if (!pendingShape || !shapeName.trim()) return;

    try {
      setSaving(true);

      const shapePayload = {
        name: shapeName.trim(),
        type: getShapeType(pendingShape),
        geometry: pendingShape.geometry,
      };

      console.log("Saving shape:", shapePayload);

      const response = await api.post("/shapes", shapePayload);

      if (response.data.success) {
        console.log("Shape saved successfully:", response.data.data.shape);
        // Reload saved shapes to show the new one
        await loadSavedShapes();
        // Close modal and clear state
        setIsModalOpen(false);
        setPendingShape(null);
        setShapeName("");
      }
    } catch (error) {
      console.error("Failed to save shape:", error);
      alert("Failed to save shape. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancelShape = () => {
    setIsModalOpen(false);
    setPendingShape(null);
    setShapeName("");
  };

  const handleAddToTemporary = () => {
    if (!pendingShape) return;

    // Add shape with name to temporary shapes
    const namedShape = {
      ...pendingShape,
      properties: {
        ...pendingShape.properties,
        name: shapeName.trim() || `Shape ${new Date().toLocaleTimeString()}`,
      },
    };

    setTemporaryShapes((prev) => [...prev, namedShape]);
    setIsModalOpen(false);
    setPendingShape(null);
    setShapeName("");
  };

  const getShapeType = (shape: any) => {
    // Map GeoJSON types to backend ShapeType enum
    // First check if we have the layerType from Leaflet Draw
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

    // Fallback to geometry type mapping
    switch (shape.geometry?.type) {
      case "Polygon":
        // Check if it's a rectangle by looking at coordinates
        // Rectangles have 5 coordinates (4 corners + closing point)
        if (shape.geometry.coordinates?.[0]?.length === 5) {
          return "RECTANGLE";
        }

        return "POLYGON";
      case "Point":
        return "CIRCLE"; // Leaflet circles are stored as points with radius
      default:
        return "POLYGON";
    }
  };

  // Handle sensor placement
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
        // Clear selection after successful placement
        setSelectedSensor(null);
        // Trigger shape refresh since sensor placement affects pollution analysis
        triggerShapeUpdate();
      }
    } catch (error) {
      console.error("Failed to place sensor:", error);
    }
  };

  // Client zone handlers
  const handleClientZoneCreated = async (zone: ClientZone) => {
    setClientZones((prev) => [...prev, zone]);
    setSelectedTool(null); // Clear drawing tool after creation
    
    // Automatically analyze the new zone for population impact
    try {
      addSuccessNotification(
        "Analysis Zone Created", 
        `${zone.name} ready for analysis - fetching population data...`,
        { duration: 3000, icon: "tabler:map-pin-plus" }
      );
      
      const response = await spatialAnalysisApi.analyzeClientZone({
        geometry: zone.geometry,
        name: zone.name
      });

      if (response.success && response.data) {
        const analysis = response.data.analysis;
        
        // Show detailed notification with analysis results
        if (isHighPriorityArea(analysis)) {
          const alertMessage = getPriorityAlertMessage(analysis);
          if (analysis.riskAssessment.level === 'critical') {
            addWarningNotification("Critical Area Detected", alertMessage!, {
              persistent: true,
              icon: "tabler:alert-triangle"
            });
          } else {
            addWarningNotification("High-Risk Area", alertMessage!, {
              duration: 10000,
              icon: "tabler:shield-x"
            });
          }
        } else {
          addSuccessNotification(
            "Analysis Complete", 
            `${zone.name}: ${generateAnalysisSummary(analysis)}`,
            { duration: 6000, icon: "tabler:chart-area" }
          );
        }
      }
    } catch (error) {
      console.warn("Failed to auto-analyze client zone:", error);
      addErrorNotification(
        "Analysis Error", 
        "Could not analyze zone automatically - you can analyze it manually from the panel"
      );
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

      // Update zone selected state
      setClientZones((prevZones) =>
        prevZones.map((zone) => ({
          ...zone,
          selected: newSelection.includes(zone.id),
        })),
      );

      return newSelection;
    });
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

  const handleGeometryOperation = (operation: string, zoneIds: string[]) => {
    const selectedZoneObjects = clientZones.filter((zone) =>
      zoneIds.includes(zone.id),
    );

    // Different operations require different minimum zones
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
      // Clear selection after operation
      setSelectedZones([]);
      setClientZones((prev) =>
        prev.map((zone) => ({ ...zone, selected: false })),
      );
    }
  };

  const handleClearOperationResults = () => {
    setOperationResults([]);
  };

  // Use historical shapes when in historical mode, otherwise use live shapes
  const displayShapes = isHistoricalMode ? historicalShapes : savedShapes;
  const allShapes = [...displayShapes, ...temporaryShapes];

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
        {/* Header */}
        <div className="bg-background border-b border-divider px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Environmental Monitoring Map
                {isHistoricalMode && (
                  <span className="ml-2 text-lg text-warning">
                    (Historical View)
                  </span>
                )}
              </h1>
              <p className="text-foreground/60">
                Welcome, {user?.name} •{" "}
                {isHistoricalMode
                  ? `Viewing data from ${selectedDateTime.toLocaleDateString()} at ${selectedDateTime.toLocaleTimeString()}`
                  : "Draw zones to monitor pollution levels"}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {temporaryShapes.length > 0 && (
                <Button
                  color="success"
                  isDisabled={saving}
                  isLoading={saving}
                  onPress={handleSaveShapes}
                >
                  {saving
                    ? "Saving..."
                    : `Save ${temporaryShapes.length} Shape${temporaryShapes.length > 1 ? "s" : ""}`}
                </Button>
              )}
              <Button
                variant="bordered"
                onPress={() => (window.location.href = "/sensors")}
              >
                View Sensors
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex min-h-0">
          {/* Panel Switcher Sidebar */}
          <div className="w-80 bg-content1 border-r border-divider p-4 overflow-y-auto">
            {/* Historical Time Picker */}
            <div className="mb-4">
              <HistoricalTimePicker
                isHistoricalMode={isHistoricalMode}
                selectedDateTime={selectedDateTime}
                onDateTimeChange={setSelectedDateTime}
                onToggleHistoricalMode={setHistoricalMode}
              />
            </div>

            <PanelSwitcher
              clientZones={isHistoricalMode ? [] : clientZones}
              isDrawing={!isHistoricalMode && !!selectedTool}
              isPlacementMode={isHistoricalMode ? false : isPlacementMode}
              operationResults={isHistoricalMode ? [] : operationResults}
              selectedSensor={isHistoricalMode ? null : selectedSensor}
              selectedTool={isHistoricalMode ? null : selectedTool}
              selectedZones={isHistoricalMode ? [] : selectedZones}
              shapesCount={temporaryShapes.length}
              onClearAllZones={
                isHistoricalMode ? () => {} : handleClearAllClientZones
              }
              onClearResults={
                isHistoricalMode ? () => {} : handleClearOperationResults
              }
              onClearShapes={isHistoricalMode ? () => {} : handleClearShapes}
              onGeometryOperation={
                isHistoricalMode ? () => {} : handleGeometryOperation
              }
              onPlacementModeChange={
                isHistoricalMode ? () => {} : setIsPlacementMode
              }
              onSaveShape={isHistoricalMode ? undefined : handleSaveShapes}
              onSensorSelect={isHistoricalMode ? () => {} : setSelectedSensor}
              onToolSelect={isHistoricalMode ? () => {} : setSelectedTool}
              onZoneDelete={
                isHistoricalMode ? () => {} : handleClientZoneDelete
              }
              onZoneSelect={
                isHistoricalMode ? () => {} : handleClientZoneSelect
              }
            />

            {/* Shape Info */}
            {(displayShapes.length > 0 || temporaryShapes.length > 0) && (
              <div className="mt-6 p-4 bg-content2 rounded-lg">
                <h4 className="font-semibold text-foreground mb-3">
                  {isHistoricalMode
                    ? "Historical Shape Summary"
                    : "Shape Summary"}
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-foreground/70">
                      {isHistoricalMode
                        ? "Historical Shapes:"
                        : "Saved Shapes:"}
                    </span>
                    <span className="font-medium text-success">
                      {displayShapes.length}
                    </span>
                  </div>
                  {!isHistoricalMode && (
                    <div className="flex justify-between">
                      <span className="text-foreground/70">
                        Temporary Shapes:
                      </span>
                      <span className="font-medium text-warning">
                        {temporaryShapes.length}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between font-semibold pt-2 border-t border-divider">
                    <span className="text-foreground/70">Total Shapes:</span>
                    <span className="text-foreground">{allShapes.length}</span>
                  </div>
                  {isHistoricalMode && (
                    <div className="pt-2 border-t border-divider text-xs text-foreground/50">
                      Data from {selectedDateTime.toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>
            )}

            {(loading || historicalLoading) && (
              <div className="mt-6 p-4 bg-content2 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
                  <span className="text-sm text-foreground/70">
                    {historicalLoading
                      ? "Loading historical data..."
                      : "Loading saved shapes..."}
                  </span>
                </div>
              </div>
            )}

            {historicalError && (
              <div className="mt-6 p-4 bg-danger/10 border border-danger/20 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="text-danger">⚠️</div>
                  <div>
                    <p className="text-sm font-medium text-danger">
                      Historical Data Error
                    </p>
                    <p className="text-xs text-danger/70">{historicalError}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Map Container */}
          <div className="flex-1 relative">
            <Map
              key={`${sensorUpdateTrigger}-${shapeUpdateTrigger}-${isHistoricalMode ? "historical" : "live"}`}
              className="h-full w-full"
              clientZones={
                isHistoricalMode ? [] : [...clientZones, ...operationResults]
              }
              savedShapes={allShapes}
              selectedSensor={isHistoricalMode ? null : selectedSensor}
              selectedTool={isHistoricalMode ? null : selectedTool}
              showSensors={true}
              onClientZoneClick={
                isHistoricalMode ? () => {} : handleClientZoneClick
              }
              onClientZoneCreated={
                isHistoricalMode ? () => {} : handleClientZoneCreated
              }
              onSensorPlaced={isHistoricalMode ? () => {} : handleSensorPlaced}
              onShapeCreated={isHistoricalMode ? () => {} : handleShapeCreated}
            />
          </div>
        </div>
      </div>

      {/* Shape Naming Modal */}
      <Modal
        backdrop="blur"
        classNames={{
          wrapper: "z-[1000]",
          backdrop: "z-[999]",
          base: "z-[1001]",
        }}
        isOpen={isModalOpen}
        placement="center"
        onClose={handleCancelShape}
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <h3 className="text-lg font-semibold">Name Your Shape</h3>
            <p className="text-sm text-foreground/60">
              Give your {pendingShape?.properties?.type || "shape"} a
              descriptive name
            </p>
          </ModalHeader>
          <ModalBody>
            <Input
              autoFocus
              label="Shape Name"
              placeholder="Enter a name for your shape"
              value={shapeName}
              onKeyDown={(e) => {
                if (e.key === "Enter" && shapeName.trim()) {
                  handleSaveShape();
                }
              }}
              onValueChange={setShapeName}
            />
          </ModalBody>
          <ModalFooter>
            <Button color="danger" variant="light" onPress={handleCancelShape}>
              Cancel
            </Button>
            <Button
              color="primary"
              isDisabled={!shapeName.trim()}
              variant="flat"
              onPress={handleAddToTemporary}
            >
              Add to Temporary
            </Button>
            <Button
              color="success"
              isDisabled={!shapeName.trim() || saving}
              isLoading={saving}
              onPress={handleSaveShape}
            >
              {saving ? "Saving..." : "Save Now"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </DefaultLayout>
  );
}
