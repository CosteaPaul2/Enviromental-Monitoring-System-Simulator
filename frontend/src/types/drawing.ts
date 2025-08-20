export interface DrawingTool {
  id: string;
  name: string;
  icon: string;
  color: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  description: string;
  dbType: 'POLYGON' | 'RECTANGLE' | 'CIRCLE';
}

export interface DrawingPanelProps {
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