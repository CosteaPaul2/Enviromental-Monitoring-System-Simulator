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
      // Failed to start simulation
    }
  }

  public async stop(): Promise<void> {
    if (!this.isRunning) {
      return
    }

    try {
      for (const [databaseId] of this.activeSensors) {
        await this.stopSensor(databaseId)
      }

      await RedisService.unsubscribe('sensor:created')

      this.isRunning = false
    } catch (error) {
      throw error
    }
  }

  private async handleSensorCreated(event: SensorCreatedEvent): Promise<void> {
    try {
      if (this.activeSensors.has(event.sensorId)) {
        return
      }

      await this.startSensor(event)
    } catch (error) {
      // Sensor simulator has an error handling sensor creation and start generating data
    }
  }

  private async handleSensorStatusChange(event: { sensorId: string; userId: string; active: boolean; type: SensorType; sensorDbId: string }): Promise<void> {
    try {
      const sensorName = event.sensorId 
      const databaseId = parseInt(event.sensorDbId)
      
      for (const [dbId, sensor] of this.activeSensors) {
        if (sensor.sensorName === sensorName) {
          if (event.active) {
            // Sensor is already running
          } else {
            await this.stopSensor(dbId)
          }
          return
        }
      }
      
      if (event.active) {
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
      // Error handling sensor status change
    }
  }

  private async restoreActiveSensors(): Promise<void> {
    try {
      
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
    } catch (error) {
      // Failed to restore active sensors
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
  }

  private async stopSensor(databaseId: number): Promise<void> {
    const sensor = this.activeSensors.get(databaseId)
    if (!sensor) {
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
      }

      if (sensor.errorCount >= this.MAX_ERROR_COUNT) {
        await this.stopSensor(databaseId)
        
        await RedisService.publishSensorStatus({
          sensorId: databaseId,
          userId: userId,
          status: 'error'
        })
      }

    } catch (error) {
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
      // Redis connection lost
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