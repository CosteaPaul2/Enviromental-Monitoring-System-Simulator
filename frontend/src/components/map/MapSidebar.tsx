import { memo } from "react";

import PanelSwitcher from "@/components/PanelSwitcher";
import HistoricalTimePicker from "@/components/monitoring/HistoricalTimePicker";
import { ClientZone } from "@/types";

interface MapSidebarProps {
  readonly isHistoricalMode: boolean;
  readonly selectedDateTime: Date;
  readonly onDateTimeChange: (date: Date) => void;
  readonly onToggleHistoricalMode: (enabled: boolean) => void;

  readonly clientZones: readonly ClientZone[];
  readonly isDrawing: boolean;
  readonly isPlacementMode: boolean;
  readonly operationResults: readonly ClientZone[];
  readonly selectedSensor: any;
  readonly selectedTool: string | null;
  readonly selectedZones: readonly string[];
  readonly shapesCount: number;

  readonly onClearAllZones: () => void;
  readonly onClearResults: () => void;
  readonly onClearShapes: () => void;
  readonly onGeometryOperation: (
    operation: string,
    zoneIds: readonly string[],
  ) => void;
  readonly onPlacementModeChange: (enabled: boolean) => void;
  readonly onSaveShape?: () => Promise<void>;
  readonly onSensorSelect: (sensor: any) => void;
  readonly onToolSelect: (toolId: string | null) => void;
  readonly onZoneDelete: (zoneId: string) => void;
  readonly onZoneSelect: (zoneId: string) => void;

  readonly displayShapes: readonly any[];
  readonly temporaryShapes: readonly any[];
  readonly loading: boolean;
  readonly historicalLoading: boolean;
  readonly historicalError: string | null;
}

const MapSidebar = memo<MapSidebarProps>(
  ({
    isHistoricalMode,
    selectedDateTime,
    onDateTimeChange,
    onToggleHistoricalMode,
    clientZones,
    isDrawing,
    isPlacementMode,
    operationResults,
    selectedSensor,
    selectedTool,
    selectedZones,
    onClearAllZones,
    onClearResults,
    onClearShapes,
    onGeometryOperation,
    onPlacementModeChange,
    onSaveShape,
    onSensorSelect,
    onToolSelect,
    onZoneDelete,
    onZoneSelect,
    displayShapes,
    temporaryShapes,
    loading,
    historicalLoading,
    historicalError,
  }) => {
    const allShapes = [...displayShapes, ...temporaryShapes];

    return (
      <div className="w-80 bg-content1 border-r border-divider p-4 overflow-y-auto">
        <div className="mb-4">
          <HistoricalTimePicker
            isHistoricalMode={isHistoricalMode}
            selectedDateTime={selectedDateTime}
            onDateTimeChange={onDateTimeChange}
            onToggleHistoricalMode={onToggleHistoricalMode}
          />
        </div>

        <PanelSwitcher
          clientZones={isHistoricalMode ? [] : [...clientZones]}
          isDrawing={!isHistoricalMode && isDrawing}
          isPlacementMode={isHistoricalMode ? false : isPlacementMode}
          operationResults={isHistoricalMode ? [] : [...operationResults]}
          selectedSensor={isHistoricalMode ? null : selectedSensor}
          selectedTool={isHistoricalMode ? null : selectedTool}
          selectedZones={isHistoricalMode ? [] : [...selectedZones]}
          shapesCount={temporaryShapes.length}
          onClearAllZones={isHistoricalMode ? () => {} : onClearAllZones}
          onClearResults={isHistoricalMode ? () => {} : onClearResults}
          onClearShapes={isHistoricalMode ? () => {} : onClearShapes}
          onGeometryOperation={
            isHistoricalMode ? () => {} : onGeometryOperation
          }
          onPlacementModeChange={
            isHistoricalMode ? () => {} : onPlacementModeChange
          }
          onSaveShape={isHistoricalMode ? undefined : onSaveShape}
          onSensorSelect={isHistoricalMode ? () => {} : onSensorSelect}
          onToolSelect={isHistoricalMode ? () => {} : onToolSelect}
          onZoneDelete={isHistoricalMode ? () => {} : onZoneDelete}
          onZoneSelect={isHistoricalMode ? () => {} : onZoneSelect}
        />

        {(displayShapes.length > 0 || temporaryShapes.length > 0) && (
          <div className="mt-6 p-4 bg-content2 rounded-lg">
            <h4 className="font-semibold text-foreground mb-3">
              {isHistoricalMode ? "Historical Shape Summary" : "Shape Summary"}
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-foreground/70">
                  {isHistoricalMode ? "Historical Shapes:" : "Saved Shapes:"}
                </span>
                <span className="font-medium text-success">
                  {displayShapes.length}
                </span>
              </div>
              {!isHistoricalMode && (
                <div className="flex justify-between">
                  <span className="text-foreground/70">Temporary Shapes:</span>
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
    );
  },
);

MapSidebar.displayName = "MapSidebar";

export default MapSidebar;
