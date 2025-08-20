import { Card, CardHeader, CardBody } from '@heroui/card'
import { Button } from '@heroui/button'
import { Chip } from '@heroui/chip'
import { Divider } from '@heroui/divider'
import { Switch } from '@heroui/switch'
import { Tooltip } from '@heroui/tooltip'
import { Icon } from "@iconify/react";

interface DrawingPanelProps {
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
}

interface DrawingTool {
  id: string;
  name: string;
  icon: string;
  color: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  description: string;
  dbType: 'POLYGON' | 'RECTANGLE' | 'CIRCLE';
}

const drawingTools: DrawingTool[] = [
  { 
    id: 'polygon', 
    name: 'Polygon', 
    icon: 'tabler:polygon', 
    color: 'success',
    description: 'Click corners, double-click to close',
    dbType: 'POLYGON'
  },
  { 
    id: 'rectangle', 
    name: 'Rectangle', 
    icon: 'tabler:square', 
    color: 'warning',
    description: 'Click and drag to draw rectangle',
    dbType: 'RECTANGLE'
  },
  { 
    id: 'circle', 
    name: 'Circle', 
    icon: 'tabler:circle', 
    color: 'primary',
    description: 'Click center, drag to set radius',
    dbType: 'CIRCLE'
  },
];

export default function DrawingPanel({
  selectedTool,
  onToolSelect,
  onSaveShape,
  onClearShapes,
  isDrawing: _isDrawing,
  shapesCount,
  isDrawingMode = true,
  onDrawingModeChange,
  isAnalysisMode = false,
  onAnalysisModeChange,
  drawnShapesCount,
  onClearAllShapes
}: DrawingPanelProps) {
  const activeTool = drawingTools.find(tool => tool.id === selectedTool);

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between w-full">
          <h3 className="text-lg font-semibold">Drawing Tools</h3>
          <div className="flex gap-2">
            {(shapesCount > 0 || (drawnShapesCount && drawnShapesCount > 0)) && (
              <Chip size="sm" color="primary" variant="flat">
                {shapesCount || drawnShapesCount} shapes
              </Chip>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardBody className="space-y-4">
        {(onDrawingModeChange || onAnalysisModeChange) && (
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
        )}

        {!isDrawingMode && onDrawingModeChange && (
          <div className="text-center py-6">
            <Icon icon="tabler:edit" className="text-4xl text-gray-400 mb-2" />
            <p className="text-gray-500 text-sm">Enable Drawing Mode to start drawing</p>
          </div>
        )}

        {(isDrawingMode || !onDrawingModeChange) && (
          <>
            <Divider />
            
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-foreground-600">Select Tool</h4>
              
              <div className="grid grid-cols-2 gap-2">
                {drawingTools.map((tool) => (
                  <Tooltip 
                    key={tool.id} 
                    content={tool.description}
                    placement="top"
                  >
                    <Button
                      size="lg"
                      color={selectedTool === tool.id ? tool.color : 'default'}
                      variant={selectedTool === tool.id ? 'solid' : 'flat'}
                      className={`h-16 flex-col gap-1 transition-all duration-200 ${
                        selectedTool === tool.id ? 'shadow-lg scale-105' : 'hover:scale-102'
                      }`}
                      onPress={() => {
                        if (selectedTool === tool.id) {
                          onToolSelect(null); 
                        } else {
                          onToolSelect(tool.id); 
                        }
                      }}
                    >
                      <Icon icon={tool.icon} className="text-xl" />
                      <span className="text-xs">{tool.name}</span>
                      {selectedTool === tool.id && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                      )}
                    </Button>
                  </Tooltip>
                ))}
              </div>
            </div>

            {selectedTool && (
              <div className="p-3 rounded-lg bg-green-50 border border-green-200">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                  <Icon icon={activeTool?.icon || 'tabler:polygon'} className="text-sm" />
                  <span className="text-sm font-medium text-green-700">
                    {activeTool?.name} Tool Active
                  </span>
                </div>
                <p className="text-xs text-green-600 mb-3">
                  {activeTool?.description}
                </p>
                
                <div className="space-y-2">
                  <div className="p-2 bg-green-100 rounded-md">
                    <div className="flex items-center gap-2 text-xs text-green-700">
                      <Icon icon="tabler:cursor-arrow" className="text-sm" />
                      <span>Map cursor changed to crosshair</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-green-700 mt-1">
                      <Icon icon="tabler:hand-grab" className="text-sm" />
                      <span>Map dragging is disabled while drawing</span>
                    </div>
                  </div>
                  
                  <div className="p-2 bg-blue-100 rounded-md">
                    <div className="text-xs text-blue-700">
                      <strong>Ready to draw!</strong> The map cursor is now a crosshair.
                      {selectedTool === 'rectangle' && (
                        <div className="mt-1">
                          <strong>Rectangle:</strong> Click and drag to draw a rectangle
                        </div>
                      )}
                      {selectedTool === 'polygon' && (
                        <div className="mt-1">
                          <strong>Polygon:</strong> Click to add points, double-click to finish
                        </div>
                      )}
                      {selectedTool === 'circle' && (
                        <div className="mt-1">
                          <strong>Circle:</strong> Click center, drag to set radius, release to finish
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <p className="text-xs text-green-600">
                      💡 Click the tool again to deactivate
                    </p>
                  </div>
                </div>
              </div>
            )}

            {!selectedTool && (
              <div className="p-4 rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200">
                <div className="flex items-start gap-3">
                  <Icon icon="tabler:info-circle" className="text-blue-500 mt-0.5 text-lg" />
                  <div>
                    <p className="text-sm text-blue-700 font-bold mb-2">Quick Guide:</p>
                    <ul className="text-xs text-blue-600 space-y-1">
                      <li>• Select a drawing tool above</li>
                      <li>• Draw your shape on the map</li>
                      <li>• {isAnalysisMode ? 'Shapes are temporary for analysis' : 'Fill out properties to save'}</li>
                      <li>• Click tool again to deselect</li>
                    </ul>
                  </div>
                </div>
                
                {process.env.NODE_ENV === 'development' && (
                  <div className="mt-3 pt-2 border-t border-blue-200">
                    <Button
                      size="sm"
                      color="warning"
                      variant="flat"
                      className="w-full"
                      onPress={() => {
                        console.log('🐛 Debug: Drawing panel state', {
                          isDrawingMode,
                          isAnalysisMode,
                          selectedTool,
                          drawnShapesCount
                        });
                        if (!selectedTool) {
                          onToolSelect('rectangle');
                        }
                      }}
                    >
                      🐛 Debug: Force Rectangle Tool
                    </Button>
                  </div>
                )}
              </div>
            )}

            {(shapesCount > 0 || (drawnShapesCount && drawnShapesCount > 0)) && (
              <>
                <Divider />
                <Button
                  size="sm"
                  color="danger"
                  variant="flat"
                  className="w-full"
                  startContent={<Icon icon="tabler:trash" />}
                  onPress={onClearShapes || onClearAllShapes}
                >
                  Clear All Shapes ({shapesCount || drawnShapesCount})
                </Button>
              </>
            )}

            {onSaveShape && shapesCount > 0 && (
              <Button
                size="sm"
                color="success"
                variant="solid"
                className="w-full"
                startContent={<Icon icon="tabler:device-floppy" />}
                onPress={onSaveShape}
              >
                Save Shapes ({shapesCount})
              </Button>
            )}
          </>
        )}
      </CardBody>
    </Card>
  );
} 