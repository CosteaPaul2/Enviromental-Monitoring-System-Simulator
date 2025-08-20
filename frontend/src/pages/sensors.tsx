import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@heroui/button"
import { Card, CardHeader, CardBody } from "@heroui/card"
import { Chip } from "@heroui/chip"
import { Divider } from "@heroui/divider"
import { Progress } from "@heroui/progress"
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/modal"
import { Input } from "@heroui/input"
import { Select, SelectItem } from "@heroui/select"
import { Icon } from "@iconify/react"
import { sensorsApi, sensorTypes, formatSensorValue, getSensorTypeInfo, getStatusColor, type Sensor, type SensorReading } from "@/lib/sensorsApi"
import DefaultLayout from "@/layouts/default"
import { useAppUpdates } from "@/contexts/AppUpdateContext"

export default function SensorsPage() {
  const navigate = useNavigate()
  const { triggerAllUpdates } = useAppUpdates()
  const [sensors, setSensors] = useState<Sensor[]>([])
  const [sensorReadings, setSensorReadings] = useState<Map<number, SensorReading>>(new Map())
  const [loading, setLoading] = useState(true)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [alertMessage, setAlertMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null)


  const [formData, setFormData] = useState({
    sensorId: '',
    type: 'TEMPERATURE' as Sensor['type']
  })
  const [errors, setErrors] = useState<{ [key: string]: string }>({})

  useEffect(() => {
    loadSensors()
  }, [])

  const loadSensors = async () => {
    try {
      setLoading(true)
      const response = await sensorsApi.getSensors()
      
      if (response.success && response.data) {
        setSensors(response.data.sensors)

        const readingsMap = new Map<number, SensorReading>()
        for (const sensor of response.data.sensors) {
          try {
            const readingResponse = await sensorsApi.getLatestReading(sensor.id)
            if (readingResponse.success && readingResponse.data) {
              readingsMap.set(sensor.id, readingResponse.data.reading)
            }
          } catch (error) {
            console.warn(`Failed to load reading for sensor ${sensor.id}`)
          }
        }
        setSensorReadings(readingsMap)
      }
    } catch (error) {
      console.error('Failed to load sensors:', error)
      setAlertMessage({ type: 'error', message: 'Failed to load sensors' })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateSensor = async () => {
    setErrors({})
    
    if (!formData.sensorId.trim()) {
      setErrors({ sensorId: 'Sensor ID is required' })
      return
    }
    
    try {
      setCreating(true)
      const response = await sensorsApi.createSensor({
        sensorId: formData.sensorId.trim(),
        type: formData.type
      })
      
      if (response.success) {
        setAlertMessage({ type: 'success', message: 'Sensor created successfully!' })
        setIsCreateModalOpen(false)
        resetForm()
        loadSensors()
        // Trigger updates across the app (map page, etc.)
        triggerAllUpdates()
      } else {
        setAlertMessage({ type: 'error', message: 'Failed to create sensor' })
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to create sensor'
      setAlertMessage({ type: 'error', message: errorMessage })
    } finally {
      setCreating(false)
    }
  }

  const resetForm = () => {
    setFormData({
      sensorId: '',
      type: 'TEMPERATURE'
    })
    setErrors({})
  }

  const handleSensorClick = (sensorId: number) => {
    navigate(`/sensors/${sensorId}`)
  }

  const handleToggleSensor = async (sensor: Sensor) => {
    try {
      const response = await sensorsApi.toggleSensor(sensor.sensorId)
      if (response.success) {
        setAlertMessage({ 
          type: 'success', 
          message: `Sensor ${sensor.active ? 'deactivated' : 'activated'} successfully!` 
        })
        loadSensors()
        // Trigger updates across the app (map page shapes, etc.)
        triggerAllUpdates()
      } else {
        setAlertMessage({ type: 'error', message: 'Failed to toggle sensor' })
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to toggle sensor'
      setAlertMessage({ type: 'error', message: errorMessage })
    }
  }

  return (
    <DefaultLayout>
      <div className="container mx-auto px-4 py-8 space-y-6">
        {alertMessage && (
          <div 
            className={`p-4 rounded-large border ${
              alertMessage.type === 'success' 
                ? 'bg-success-50 border-success-200 text-success-700' 
                : 'bg-danger-50 border-danger-200 text-danger-700'
            }`}
            role="alert"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icon 
                  icon={alertMessage.type === 'success' ? 'tabler:check' : 'tabler:alert-circle'} 
                  className="text-lg" 
                />
                <span className="text-small">{alertMessage.message}</span>
              </div>
              <Button
                isIconOnly
                size="sm"
                variant="light"
                onPress={() => setAlertMessage(null)}
              >
                <Icon icon="tabler:x" />
              </Button>
            </div>
          </div>
        )}

        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <Icon icon="tabler:settings" className="text-primary" />
              Sensor Management
            </h1>
            <p className="text-foreground/60 mt-2">
              Manage your environmental monitoring sensors
            </p>
          </div>
          <Button
            color="primary"
            size="lg"
            startContent={<Icon icon="tabler:plus" className="text-lg" />}
            onPress={() => setIsCreateModalOpen(true)}
            className="font-medium"
          >
            Create Sensor
          </Button>
        </div>

        <Card className="border-none bg-gradient-to-br from-content1 to-content2/20">
          <CardHeader className="border-b border-divider">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-xl">
                  <Icon icon="tabler:list-check" className="text-2xl text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-foreground">My Sensors</h3>
                  <p className="text-sm text-foreground/60 mt-1">
                    {sensors.length} sensors configured
                  </p>
                </div>
              </div>
              <Chip size="sm" variant="flat" color="primary">
                {sensors.length} Total
              </Chip>
            </div>
          </CardHeader>
          
          <CardBody className="p-6">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Progress 
                  size="sm" 
                  isIndeterminate 
                  aria-label="Loading sensors..."
                  className="max-w-md"
                  color="primary"
                />
                <p className="text-sm text-foreground/60 mt-3">Loading sensors...</p>
              </div>
            ) : sensors.length === 0 ? (
              <div className="text-center py-12">
                <div className="p-4 bg-content2 rounded-full w-fit mx-auto mb-4">
                  <Icon icon="tabler:square-plus" className="text-4xl text-foreground/40" />
                </div>
                <h4 className="text-lg font-medium text-foreground mb-2">No sensors yet</h4>
                <p className="text-sm text-foreground/60 mb-6 max-w-md mx-auto">
                  Create your first sensor to start collecting environmental data. 
                  The simulator will automatically generate realistic patterns.
                </p>
                <Button 
                  color="primary" 
                  size="lg"
                  onPress={() => setIsCreateModalOpen(true)}
                  startContent={<Icon icon="tabler:plus" />}
                >
                  Create Your First Sensor
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sensors.map((sensor) => {
                  const reading = sensorReadings.get(sensor.id)
                  const sensorType = getSensorTypeInfo(sensor.type)
                  
                  return (
                    <Card 
                      key={sensor.id} 
                      className="border border-divider hover:border-primary/50 transition-colors cursor-pointer"
                      isPressable
                      onPress={() => handleSensorClick(sensor.id)}
                    >
                      <CardBody className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div 
                              className="p-3 rounded-xl" 
                              style={{ backgroundColor: `${sensorType?.color}20` }}
                            >
                              <Icon 
                                icon={sensorType?.icon || 'tabler:cpu'} 
                                className="text-xl" 
                                style={{ color: sensorType?.color }}
                              />
                            </div>
                            <div>
                              <h4 className="font-semibold text-lg text-foreground">{sensor.sensorId}</h4>
                              <p className="text-sm text-foreground/60 capitalize">{sensor.type.toLowerCase()} sensor</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Chip 
                              color={getStatusColor(sensor.active ? 'active' : 'inactive')} 
                              variant="flat"
                              size="sm"
                              startContent={
                                <div className={`w-2 h-2 rounded-full ${
                                  sensor.active ? 'bg-success-500' : 'bg-danger-500'
                                }`} />
                              }
                            >
                              {sensor.active ? 'active' : 'inactive'}
                            </Chip>
                            <Button
                              isIconOnly
                              size="sm"
                              variant="light"
                              color={sensor.active ? 'danger' : 'success'}
                              onPress={() => handleToggleSensor(sensor)}
                              className="min-w-unit-8 w-unit-8 h-unit-8"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Icon 
                                icon={sensor.active ? 'tabler:player-pause' : 'tabler:player-play'} 
                                className="text-sm"
                              />
                            </Button>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-foreground/60">Sensor ID:</span>
                            <span className="bg-default-100 text-default-700 px-2 py-1 rounded-small text-xs font-mono">
                              {sensor.id}
                            </span>
                          </div>

                          <Divider />

                          <div className="text-center">
                            <div className="text-3xl font-bold mb-1" style={{ color: sensorType?.color }}>
                              {reading ? formatSensorValue(reading.value, sensor.type) : '---'}
                            </div>
                            <p className="text-xs text-foreground/60">
                              {reading ? 'Latest Reading' : 'No Data Available'}
                            </p>
                            {reading && (
                              <div className="mt-2 text-xs text-foreground/70">
                                <div>Timestamp: {new Date(reading.timestamp).toLocaleString()}</div>
                              </div>
                            )}
                          </div>

                          {reading && (
                            <>
                              <Divider />
                              <div className="text-xs text-foreground/60 text-center">
                                Last updated: {new Date(reading.timestamp).toLocaleString()}  
                              </div>
                            </>
                          )}

                          <div className="mt-4 pt-3 border-t border-divider">
                            <div className="flex items-center justify-center gap-2 text-primary">
                              <Icon icon="tabler:chart-line" className="text-sm" />
                              <span className="text-xs font-medium">Click to view charts & readings</span>
                            </div>
                          </div>
                        </div>
                      </CardBody>
                    </Card>
                  )
                })}
              </div>
            )}
          </CardBody>
        </Card>

        <Modal 
          isOpen={isCreateModalOpen} 
          onClose={() => { setIsCreateModalOpen(false); resetForm(); }}
          size="2xl"
          backdrop="blur"
        >
          <ModalContent>
            <ModalHeader className="flex flex-col gap-1 border-b border-divider pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Icon icon="tabler:plus" className="text-xl text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold">Create New Sensor</h3>
                  <p className="text-sm text-foreground/60 font-normal">
                    Configure your environmental monitoring sensor
                  </p>
                </div>
              </div>
            </ModalHeader>
            
            <ModalBody className="py-6">
              <div className="space-y-4">
                <Input
                  label="Sensor ID"
                  placeholder="e.g., TEMP_001"
                  value={formData.sensorId}
                  onChange={(e) => setFormData(prev => ({ ...prev, sensorId: e.target.value.toUpperCase() }))}
                  isRequired
                  isInvalid={!!errors.sensorId}
                  errorMessage={errors.sensorId}
                  description="Unique identifier (A-Z, 0-9, _)"
                  startContent={<Icon icon="tabler:hash" className="text-default-400" />}
                  variant="bordered"
                  classNames={{
                    input: "text-foreground",
                    inputWrapper: "border-divider hover:border-focus focus-within:border-focus bg-content2"
                  }}
                />

                <Select
                  label="Sensor Type"
                  placeholder="Select sensor type"
                  selectedKeys={[formData.type]}
                  onSelectionChange={(keys) => setFormData(prev => ({ ...prev, type: Array.from(keys)[0] as Sensor['type'] }))}
                  isRequired
                  variant="bordered"
                  classNames={{
                    trigger: "border-divider hover:border-focus bg-content2",
                    value: "text-foreground"
                  }}
                  startContent={
                    getSensorTypeInfo(formData.type) && (
                      <Icon 
                        icon={getSensorTypeInfo(formData.type)!.icon} 
                        className="text-lg" 
                        style={{ color: getSensorTypeInfo(formData.type)!.color }} 
                      />
                    )
                  }
                >
                  {sensorTypes.map((type) => (
                    <SelectItem 
                      key={type.value}
                      textValue={`${type.label} (${type.unit})`}
                      startContent={
                        <Icon icon={type.icon} className="text-lg" style={{ color: type.color }} />
                      }
                    >
                      {type.label} ({type.unit})
                    </SelectItem>
                  ))}
                </Select>
              </div>
            </ModalBody>
            
            <ModalFooter className="border-t border-divider pt-4">
              <Button 
                variant="flat" 
                onPress={() => { setIsCreateModalOpen(false); resetForm(); }}
                isDisabled={creating}
              >
                Cancel
              </Button>
              <Button 
                color="primary" 
                onPress={handleCreateSensor}
                isLoading={creating}
                isDisabled={!formData.sensorId || creating}
                startContent={!creating ? <Icon icon="tabler:plus" /> : undefined}
              >
                {creating ? 'Creating...' : 'Create Sensor'}
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </div>
    </DefaultLayout>
  )
}