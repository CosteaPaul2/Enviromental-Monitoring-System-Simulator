import { useState, useEffect } from 'react'
import { Card, CardHeader, CardBody } from '@heroui/card'
import { Button } from '@heroui/button'
import { Chip } from '@heroui/chip'
import { Divider } from '@heroui/divider'
import { Switch } from '@heroui/switch'
import { Tooltip } from '@heroui/tooltip'
import { Icon } from "@iconify/react"
import { Sensor, sensorsApi, getSensorTypeInfo } from '@/lib/sensorsApi'

interface SensorPanelProps {
  onSensorSelect?: (sensor: Sensor | null) => void
  selectedSensor?: Sensor | null
  isPlacementMode?: boolean
  onPlacementModeChange?: (enabled: boolean) => void
}

export default function SensorPanel({
  onSensorSelect,
  selectedSensor,
  isPlacementMode = false,
  onPlacementModeChange
}: SensorPanelProps) {
  const [sensors, setSensors] = useState<Sensor[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSensors()
  }, [])

  const loadSensors = async () => {
    try {
      setLoading(true)
      const response = await sensorsApi.getSensors()
      if (response.success && response.data) {
        setSensors(response.data.sensors)
      }
    } catch (error) {
      console.error('Failed to load sensors:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleSensor = async (sensor: Sensor, event: React.MouseEvent) => {
    event.stopPropagation()
    try {
      const response = await sensorsApi.toggleSensor(sensor.sensorId)
      if (response.success) {
        await loadSensors()
      }
    } catch (error) {
      console.error('Failed to toggle sensor:', error)
    }
  }

  const sensorsWithLocation = sensors.filter(s => s.latitude && s.longitude)
  const sensorsWithoutLocation = sensors.filter(s => !s.latitude || !s.longitude)

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between w-full">
          <h3 className="text-lg font-semibold">Sensor Management</h3>
          <div className="flex gap-2">
            <Chip size="sm" color="primary" variant="flat">
              {sensors.length} total
            </Chip>
          </div>
        </div>
      </CardHeader>
      
      <CardBody className="space-y-4">
        {/* Placement Mode Toggle */}
        {onPlacementModeChange && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-foreground-600">Mode Selection</h4>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Placement Mode</span>
                {isPlacementMode && (
                  <Chip size="sm" color="warning" variant="flat">Active</Chip>
                )}
              </div>
              <Switch
                isSelected={isPlacementMode}
                onValueChange={onPlacementModeChange}
                color="warning"
                size="sm"
              />
            </div>
            
            {isPlacementMode && (
              <div className="p-3 rounded-lg bg-warning-50 border border-warning-200">
                <div className="flex items-center gap-2 mb-2">
                  <Icon icon="tabler:map-pin-plus" className="text-warning-600 text-lg" />
                  <span className="text-sm font-medium text-warning-700">Placement Mode Active</span>
                </div>
                <p className="text-xs text-warning-600">
                  Select a sensor below, then click on the map to place it.
                </p>
              </div>
            )}
          </div>
        )}

        {loading ? (
          <div className="text-center py-6">
            <Icon icon="tabler:refresh" className="text-2xl text-foreground/40 animate-spin mb-2" />
            <p className="text-sm text-foreground/60">Loading sensors...</p>
          </div>
        ) : (
          <>
            {/* Sensors on Map */}
            {sensorsWithLocation.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-foreground-600">On Map</h4>
                  <Chip size="sm" color="success" variant="flat">
                    {sensorsWithLocation.length} placed
                  </Chip>
                </div>
                
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {sensorsWithLocation.map((sensor) => {
                    const sensorType = getSensorTypeInfo(sensor.type)
                    const isSelected = selectedSensor?.id === sensor.id
                    
                    return (
                      <Card 
                        key={sensor.id}
                        className={`border transition-colors cursor-pointer ${
                          isSelected ? 'border-primary bg-primary/5' : 'border-divider hover:border-primary/50'
                        }`}
                        isPressable={!!onSensorSelect}
                        onPress={() => onSensorSelect?.(sensor)}
                      >
                        <CardBody className="p-3">
                          <div className="flex items-center gap-3">
                            <div 
                              className="p-2 rounded-xl flex-shrink-0 w-10 h-10 flex items-center justify-center" 
                              style={{ backgroundColor: `${sensorType?.color}20` }}
                            >
                              <Icon 
                                icon={sensorType?.icon || 'tabler:cpu'} 
                                className="text-lg" 
                                style={{ color: sensorType?.color }}
                              />
                            </div>
                            
                            <div className="min-w-0 flex-1">
                              <h5 className="font-medium text-sm text-foreground truncate">{sensor.sensorId}</h5>
                              <p className="text-xs text-foreground/60 capitalize">{sensor.type.toLowerCase()} sensor</p>
                            </div>
                            
                            <div className="flex-shrink-0">
                              <Tooltip content={sensor.active ? 'Deactivate sensor' : 'Activate sensor'}>
                                <Switch
                                  size="sm"
                                  isSelected={sensor.active}
                                  onValueChange={() => handleToggleSensor(sensor, { stopPropagation: () => {} } as React.MouseEvent)}
                                  color={sensor.active ? 'success' : 'default'}
                                />
                              </Tooltip>
                            </div>
                          </div>
                        </CardBody>
                      </Card>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Sensors needing placement */}
            {sensorsWithoutLocation.length > 0 && (
              <>
                {sensorsWithLocation.length > 0 && <Divider />}
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-foreground-600">Needs Placement</h4>
                    <Chip size="sm" color="warning" variant="flat">
                      {sensorsWithoutLocation.length} unplaced
                    </Chip>
                  </div>
                  
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {sensorsWithoutLocation.map((sensor) => {
                      const sensorType = getSensorTypeInfo(sensor.type)
                      const isSelected = selectedSensor?.id === sensor.id
                      
                      return (
                        <Card 
                          key={sensor.id}
                          className={`border transition-colors cursor-pointer ${
                            isSelected ? 'border-warning bg-warning/5' : 'border-divider hover:border-warning/50'
                          }`}
                          isPressable={!!onSensorSelect}
                          onPress={() => onSensorSelect?.(sensor)}
                        >
                          <CardBody className="p-3">
                            <div className="flex items-center gap-3">
                              <div 
                                className="p-2 rounded-xl flex-shrink-0 w-10 h-10 flex items-center justify-center" 
                                style={{ backgroundColor: `${sensorType?.color}20` }}
                              >
                                <Icon 
                                  icon={sensorType?.icon || 'tabler:cpu'} 
                                  className="text-lg" 
                                  style={{ color: sensorType?.color }}
                                />
                              </div>
                              
                              <div className="min-w-0 flex-1">
                                <h5 className="font-medium text-sm text-foreground truncate">{sensor.sensorId}</h5>
                                <p className="text-xs text-foreground/60 capitalize">{sensor.type.toLowerCase()} sensor</p>
                              </div>
                              
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <Tooltip content="Click to place on map">
                                  <Icon 
                                    icon="tabler:map-pin-plus" 
                                    className="text-warning text-lg animate-pulse"
                                  />
                                </Tooltip>
                                <Tooltip content={sensor.active ? 'Deactivate sensor' : 'Activate sensor'}>
                                  <Switch
                                    size="sm"
                                    isSelected={sensor.active}
                                    onValueChange={() => handleToggleSensor(sensor, { stopPropagation: () => {} } as React.MouseEvent)}
                                    color={sensor.active ? 'success' : 'default'}
                                  />
                                </Tooltip>
                              </div>
                            </div>
                          </CardBody>
                        </Card>
                      )
                    })}
                  </div>
                </div>
              </>
            )}

            {/* Empty state */}
            {sensors.length === 0 && (
              <div className="text-center py-8">
                <div className="p-4 bg-content2 rounded-full w-fit mx-auto mb-4">
                  <Icon icon="tabler:square-plus" className="text-4xl text-foreground/40" />
                </div>
                <h4 className="text-lg font-medium text-foreground mb-2">No sensors yet</h4>
                <p className="text-sm text-foreground/60 mb-4">
                  Create sensors from the sensor management page to see them here.
                </p>
                <Button 
                  color="primary" 
                  size="sm"
                  onPress={() => window.location.href = '/sensors'}
                  startContent={<Icon icon="tabler:settings" />}
                >
                  Manage Sensors
                </Button>
              </div>
            )}

            {/* Selected sensor info */}
            {selectedSensor && (
              <>
                <Divider />
                <div className="p-3 rounded-lg bg-primary-50 border border-primary-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon icon="tabler:cursor-arrow" className="text-primary-600 text-sm" />
                    <span className="text-sm font-medium text-primary-700">
                      {selectedSensor.sensorId} Selected
                    </span>
                  </div>
                  <p className="text-xs text-primary-600">
                    {selectedSensor.latitude && selectedSensor.longitude 
                      ? 'Click on map to move this sensor to a new location'
                      : 'Click on the map to place this sensor'
                    }
                  </p>
                </div>
              </>
            )}

            {/* Instructions */}
            {!selectedSensor && isPlacementMode && (
              <div className="p-4 rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200">
                <div className="flex items-start gap-3">
                  <Icon icon="tabler:info-circle" className="text-blue-500 mt-0.5 text-lg" />
                  <div>
                    <p className="text-sm text-blue-700 font-bold mb-2">How to place sensors:</p>
                    <ul className="text-xs text-blue-600 space-y-1">
                      <li>• Select a sensor from the list above</li>
                      <li>• Click on the map where you want to place it</li>
                      <li>• Toggle sensors on/off with the switches</li>
                      <li>• Placed sensors appear with colored icons</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </CardBody>
    </Card>
  )
}