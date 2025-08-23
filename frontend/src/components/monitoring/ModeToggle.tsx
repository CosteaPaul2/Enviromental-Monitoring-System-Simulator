import { Switch } from "@heroui/switch";
import { Chip } from "@heroui/chip";
import { Icon } from "@iconify/react";

interface ModeToggleProps {
  isDrawingMode?: boolean;
  onDrawingModeChange?: (enabled: boolean) => void;
  isAnalysisMode?: boolean;
  onAnalysisModeChange?: (enabled: boolean) => void;
}

export function ModeToggle({
  isDrawingMode = true,
  onDrawingModeChange,
  isAnalysisMode = false,
  onAnalysisModeChange,
}: ModeToggleProps) {
  return (
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
            Shapes created in this mode are temporary and won't be saved to the
            database.
          </p>
        </div>
      )}
    </div>
  );
}
