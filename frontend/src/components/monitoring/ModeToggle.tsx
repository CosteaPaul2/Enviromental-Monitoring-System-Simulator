import { Switch } from '@heroui/switch';
import { Chip } from '@heroui/chip';
import { Icon } from '@iconify/react';

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
  onAnalysisModeChange
}: ModeToggleProps) {
  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium text-foreground-600">Mode Selection</h4>
      
      <div className="space-y-2">
        {onDrawingModeChange && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Drawing Mode</span>
              {isDrawingMode && (
                <Chip size="sm" color="primary" variant="flat">Active</Chip>
              )}
            </div>
            <Switch
              isSelected={isDrawingMode}
              onValueChange={onDrawingModeChange}
              color="primary"
              size="sm"
            />
          </div>
        )}
        
        {onAnalysisModeChange && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Analysis Mode</span>
              {isAnalysisMode && (
                <Chip size="sm" color="secondary" variant="flat">Active</Chip>
              )}
            </div>
            <Switch
              isSelected={isAnalysisMode}
              onValueChange={onAnalysisModeChange}
              color="secondary"
              size="sm"
            />
          </div>
        )}
      </div>
      
      {isAnalysisMode && (
        <div className="p-3 rounded-lg bg-warning-50 border border-warning-200">
          <div className="flex items-center gap-2 mb-2">
            <Icon icon="tabler:alert-triangle" className="text-warning-600 text-lg" />
            <span className="text-sm font-medium text-warning-700">Analysis Mode Active</span>
          </div>
          <p className="text-xs text-warning-600">
            Shapes created in this mode are temporary and won't be saved to the database.
          </p>
        </div>
      )}
    </div>
  );
}