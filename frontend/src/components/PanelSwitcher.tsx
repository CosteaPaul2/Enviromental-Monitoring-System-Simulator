import { useState } from 'react'
import { Card, CardHeader, CardBody } from '@heroui/card'
import { Button } from '@heroui/button'
import { Chip } from '@heroui/chip'
import { Icon } from "@iconify/react"
import DrawingPanel from './DrawingPanel'
import SensorPanel from './SensorPanel'
import GeometryOperationsPanel, { ClientZone } from './GeometryOperationsPanel'
import { Sensor } from '@/lib/sensorsApi'

interface PanelSwitcherProps {
  // Drawing panel props
  selectedTool: string | null
  onToolSelect: (toolId: string | null) => void
  onSaveShape?: () => Promise<void>
  onClearShapes: () => void
  isDrawing: boolean
  shapesCount: number
  isDrawingMode?: boolean
  onDrawingModeChange?: (enabled: boolean) => void
  isAnalysisMode?: boolean
  onAnalysisModeChange?: (enabled: boolean) => void
  drawnShapesCount?: number
  onClearAllShapes?: () => void
  
  // Sensor panel props
  onSensorSelect?: (sensor: Sensor | null) => void
  selectedSensor?: Sensor | null
  isPlacementMode?: boolean
  onPlacementModeChange?: (enabled: boolean) => void
  
  // Geometry operations panel props
  clientZones?: ClientZone[]
  selectedZones?: string[]
  onZoneSelect?: (zoneId: string) => void
  onZoneDelete?: (zoneId: string) => void
  onClearAllZones?: () => void
  onGeometryOperation?: (operation: string, zoneIds: string[]) => void
  operationResults?: ClientZone[]
  onClearResults?: () => void
}

type PanelType = 'drawing' | 'sensors' | 'geometry'

export default function PanelSwitcher(props: PanelSwitcherProps) {
  const [activePanel, setActivePanel] = useState<PanelType>('drawing')

  return (
    <div className="w-full max-w-md">
      {/* Panel Switcher Header */}
      <Card className="mb-4">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between w-full">
            <h2 className="text-xl font-bold">Controls</h2>
            <Chip size="sm" color="primary" variant="flat">
              {activePanel === 'drawing' ? 'Drawing Mode' : 
               activePanel === 'sensors' ? 'Sensor Mode' : 'Geometry Mode'}
            </Chip>
          </div>
        </CardHeader>
        <CardBody className="pt-0">
          <div className="grid grid-cols-3 gap-2">
            <Button
              size="sm"
              color={activePanel === 'drawing' ? 'primary' : 'default'}
              variant={activePanel === 'drawing' ? 'solid' : 'flat'}
              className="flex-1"
              startContent={<Icon icon="tabler:edit" />}
              onPress={() => setActivePanel('drawing')}
            >
              Drawing
            </Button>
            <Button
              size="sm"
              color={activePanel === 'sensors' ? 'warning' : 'default'}
              variant={activePanel === 'sensors' ? 'solid' : 'flat'}
              className="flex-1"
              startContent={<Icon icon="tabler:cpu" />}
              onPress={() => setActivePanel('sensors')}
            >
              Sensors
            </Button>
            <Button
              size="sm"
              color={activePanel === 'geometry' ? 'success' : 'default'}
              variant={activePanel === 'geometry' ? 'solid' : 'flat'}
              className="flex-1"
              startContent={<Icon icon="tabler:vector" />}
              onPress={() => setActivePanel('geometry')}
            >
              Geometry
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Active Panel */}
      {activePanel === 'drawing' ? (
        <DrawingPanel
          selectedTool={props.selectedTool}
          onToolSelect={props.onToolSelect}
          onSaveShape={props.onSaveShape}
          onClearShapes={props.onClearShapes}
          isDrawing={props.isDrawing}
          shapesCount={props.shapesCount}
          isDrawingMode={props.isDrawingMode}
          onDrawingModeChange={props.onDrawingModeChange}
          isAnalysisMode={props.isAnalysisMode}
          onAnalysisModeChange={props.onAnalysisModeChange}
          drawnShapesCount={props.drawnShapesCount}
          onClearAllShapes={props.onClearAllShapes}
        />
      ) : activePanel === 'sensors' ? (
        <SensorPanel
          onSensorSelect={props.onSensorSelect}
          selectedSensor={props.selectedSensor}
          isPlacementMode={props.isPlacementMode}
          onPlacementModeChange={props.onPlacementModeChange}
        />
      ) : (
        <GeometryOperationsPanel
          selectedTool={props.selectedTool}
          onToolSelect={props.onToolSelect}
          clientZones={props.clientZones || []}
          selectedZones={props.selectedZones || []}
          onZoneSelect={props.onZoneSelect || (() => {})}
          onZoneDelete={props.onZoneDelete || (() => {})}
          onClearAllZones={props.onClearAllZones || (() => {})}
          onGeometryOperation={props.onGeometryOperation || (() => {})}
          operationResults={props.operationResults || []}
          onClearResults={props.onClearResults}
        />
      )}
    </div>
  )
}