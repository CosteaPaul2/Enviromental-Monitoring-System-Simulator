import RedisService, { SensorCreatedEvent, SensorReadingEvent } from './redis_service.js'
import SensorDataGenerator, { SensorType } from './sensor_data_generator.js'

export interface ActiveSensor {
  databaseId: number      
  sensorName: string     
  type: SensorType
  userId: string
  intervalId: NodeJS.Timeout
  errorCount: number
  lastReading?: Date
}

export default class SensorSimulatorService {
  private static instance: SensorSimulatorService
  private activeSensors: Map<number, ActiveSensor> = new Map()
  private isRunning: boolean = false
  private readonly MAX_ERROR_COUNT = 3
  private readonly HEALTH_CHECK_INTERVAL = 30000

  private constructor() {}

  public static getInstance(): SensorSimulatorService {
    if (!SensorSimulatorService.instance) {
      SensorSimulatorService.instance = new SensorSimulatorService()
    }
    return SensorSimulatorService.instance
  }

  public async start(): Promise<void> {
    if (this.isRunning) {
      return
    }

    try {
      await RedisService.subscribe('sensor:created', this.handleSensorCreated.bind(this))
      await RedisService.subscribe('sensor:status', this.handleSensorStatusChange.bind(this))

      // Restore active sensors on startup
      await this.restoreActiveSensors()

      this.startHealthChecks()

      this.isRunning = true
    } catch (error) {
      console.error('Failed to start simulation', error)
    }
  }

  public async stop(): Promise<void> {
    if (!this.isRunning) {
      console.log('Sensor-Simulator is not running')
      return
    }

    try {
      for (const [databaseId] of this.activeSensors) {
        await this.stopSensor(databaseId)
      }

      await RedisService.unsubscribe('sensor:created')

      this.isRunning = false
      console.log('Sensor Simulator stopped')
    } catch (error) {
      console.log('Error stopping sensor-simulator', error)
      throw error
    }
  }

  private async handleSensorCreated(event: SensorCreatedEvent): Promise<void> {
    try {
      console.log(`Need to generate data for newly created sensor: ${event.sensorSID} (${event.type})`)
      
      if (this.activeSensors.has(event.sensorId)) {
        console.log(`${event.sensorSID} is already being simulated`)
        return
      }

      await this.startSensor(event)
    } catch (error) {
      console.error('Sensor simulator has an error handling sensor creation and start generating data:', error)
    }
  }

  private async handleSensorStatusChange(event: { sensorId: string; userId: string; active: boolean; type: SensorType; sensorDbId: string }): Promise<void> {
    try {
      const sensorName = event.sensorId 
      const databaseId = parseInt(event.sensorDbId)  
      
      console.log(`Sensor status changed: ${sensorName} -> ${event.active ? 'ACTIVE' : 'INACTIVE'}`)
      
      for (const [dbId, sensor] of this.activeSensors) {
        if (sensor.sensorName === sensorName) {
          if (event.active) {
            console.log(`SIMULATOR Sensor ${sensorName} is already running`)
          } else {
            console.log(`SIMULATOR Stopping sensor: ${sensorName}`)
            await this.stopSensor(dbId)
          }
          return
        }
      }
      
      if (event.active) {
        console.log(`SIMULATOR Starting sensor: ${sensorName}`)
        const sensorCreatedEvent = {
          sensorId: databaseId,  
          sensorSID: sensorName,   
          type: event.type,
          userId: event.userId,
          active: true,
          createdAt: new Date().toISOString()
        }
        await this.startSensor(sensorCreatedEvent)
      }
    } catch (error) {
      console.error('SIMULATOR Error handling sensor status change:', error)
    }
  }

  private async restoreActiveSensors(): Promise<void> {
    try {
      console.log('Restoring active sensors on startup...')
      
      // Make HTTP request to backend to get active sensors
      const response = await fetch('http://localhost:3333/sensors/active', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      if (!response.ok) {
        throw new Error(`Failed to fetch active sensors: ${response.status}`)
      }
      
      const result = await response.json() as { success: boolean; data?: { sensors: any[] } }
      const activeSensors = result.data?.sensors || []
      
      console.log(`Found ${activeSensors.length} active sensors to restore`)
      
      for (const sensor of activeSensors) {
        const sensorCreatedEvent: SensorCreatedEvent = {
          sensorId: sensor.id,
          sensorSID: sensor.sensorId,
          type: sensor.type,
          userId: sensor.userId,
          active: sensor.active,
          createdAt: sensor.createdAt
        }
        
        await this.startSensor(sensorCreatedEvent)
      }
      
      console.log('Active sensors restoration completed')
    } catch (error) {
      console.error('Failed to restore active sensors:', error)
    }
  }

  private async startSensor(event: SensorCreatedEvent): Promise<void> {
    const sensorType = event.type as SensorType
    const databaseId = event.sensorId     
    const sensorName = event.sensorSID    
    const updateInterval = SensorDataGenerator.getUpdateInterval(sensorType)

    const intervalId = setInterval(async () => {
      await this.generateAndPublishReading(databaseId, sensorType, event.userId)
    }, updateInterval)

    const activeSensor: ActiveSensor = {
      databaseId: databaseId,
      sensorName: sensorName,
      type: sensorType,
      userId: event.userId,
      intervalId,
      errorCount: 0
    }

    this.activeSensors.set(databaseId, activeSensor)
    
    await RedisService.publishSensorStatus({
      sensorId: databaseId,
      userId: event.userId,
      status: 'active'
    })

    console.log(`Started simulating sensor: ${sensorName} (${sensorType})`)
  }

  private async stopSensor(databaseId: number): Promise<void> {
    const sensor = this.activeSensors.get(databaseId)
    if (!sensor) {
      console.log(`Sensor ${databaseId} not found in active sensors`)
      return
    }

    clearInterval(sensor.intervalId)
    
    SensorDataGenerator.resetSensorState(sensor.sensorName)
    
    await RedisService.publishSensorStatus({
      sensorId: sensor.databaseId,
      userId: sensor.userId,
      status: 'inactive'
    })

    this.activeSensors.delete(databaseId)
    console.log(`Stopped simulating sensor: ${sensor.sensorName}`)
  }

  private async generateAndPublishReading(databaseId: number, sensorType: SensorType, userId: string): Promise<void> {
    const sensor = this.activeSensors.get(databaseId)
    if (!sensor) {
      return
    }

    try {
      const reading = SensorDataGenerator.generateReading(sensorType, sensor.sensorName)
      
      const readingEvent: SensorReadingEvent = {
        sensorId: databaseId,
        timestamp: reading.timestamp.toISOString(),
        value: reading.value,
        unit: reading.unit,
        userId: userId
      }

      const success = await RedisService.publishSensorReading(readingEvent)
      
      if (success) {
        sensor.lastReading = reading.timestamp
        sensor.errorCount = 0
      } else {
        sensor.errorCount++
        console.warn(`Failed to publish reading for sensor ${sensor.sensorName}`)
      }

      if (sensor.errorCount >= this.MAX_ERROR_COUNT) {
        console.error(`Too many errors for sensor ${sensor.sensorName}, stopping simulation`)
        await this.stopSensor(databaseId)
        
        await RedisService.publishSensorStatus({
          sensorId: databaseId,
          userId: userId,
          status: 'error'
        })
      }

    } catch (error) {
      console.error(`Error generating reading for sensor ${sensor.sensorName}:`, error)
      sensor.errorCount++
    }
  }

  private startHealthChecks(): void {
    setInterval(() => {
      this.performHealthCheck()
    }, this.HEALTH_CHECK_INTERVAL)
  }

  private async performHealthCheck(): Promise<void> {
    const redisStatus = await RedisService.getConnectionStatus()
    if (!redisStatus) {
      console.error('Redis connection lost!')
    }
  }

  public getStats(): {
    isRunning: boolean
    activeSensorCount: number
    totalErrorCount: number
    sensorsWithErrors: number
    lastHealthCheck: Date
  } {
    const totalErrorCount = Array.from(this.activeSensors.values())
      .reduce((sum, sensor) => sum + sensor.errorCount, 0)
    
    const sensorsWithErrors = Array.from(this.activeSensors.values())
      .filter(sensor => sensor.errorCount > 0).length

    return {
      isRunning: this.isRunning,
      activeSensorCount: this.activeSensors.size,
      totalErrorCount,
      sensorsWithErrors,
      lastHealthCheck: new Date()
    }
  }

  public getActiveSensors(): Map<number, ActiveSensor> {
    return this.activeSensors
  }

  public getSensorStatus(sensorId: number): ActiveSensor | undefined {
    return this.activeSensors.get(sensorId)
  }
} 