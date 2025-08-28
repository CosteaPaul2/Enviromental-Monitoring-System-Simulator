import { memo } from "react";
import { Button } from "@heroui/button";

interface MapHeaderProps {
  readonly userName?: string;
  readonly isHistoricalMode: boolean;
  readonly selectedDateTime: Date;
  readonly temporaryShapesCount: number;
  readonly isSaving: boolean;
  readonly onSaveShapes: () => void;
  readonly onViewSensors: () => void;
}

const MapHeader = memo<MapHeaderProps>(
  ({
    userName,
    isHistoricalMode,
    selectedDateTime,
    temporaryShapesCount,
    isSaving,
    onSaveShapes,
    onViewSensors,
  }) => {
    return (
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
              {userName && `Welcome, ${userName} • `}
              {isHistoricalMode
                ? `Viewing data from ${selectedDateTime.toLocaleDateString()} at ${selectedDateTime.toLocaleTimeString()}`
                : "Draw zones to monitor pollution levels"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {temporaryShapesCount > 0 && (
              <Button
                color="success"
                isDisabled={isSaving}
                isLoading={isSaving}
                onPress={onSaveShapes}
              >
                {isSaving
                  ? "Saving..."
                  : `Save ${temporaryShapesCount} Shape${temporaryShapesCount > 1 ? "s" : ""}`}
              </Button>
            )}
            <Button variant="bordered" onPress={onViewSensors}>
              View Sensors
            </Button>
          </div>
        </div>
      </div>
    );
  },
);

MapHeader.displayName = "MapHeader";

export default MapHeader;
