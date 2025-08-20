import RedisService from './redis_service.js'
import SensorReadingService from './sensor_reading_service.js'
import { SensorUnit } from '@prisma/client'

export interface SensorReadingEvent {
  sensorId: number
  timestamp: string
  value: number
  unit: string
  userId: string
}

export default class SensorReadingSubscriber {
  private static instance: SensorReadingSubscriber
  private isSubscribed: boolean = false

  private constructor() {}

  public static getInstance(): SensorReadingSubscriber {
    if (!SensorReadingSubscriber.instance) {
      SensorReadingSubscriber.instance = new SensorReadingSubscriber()
    }
    return SensorReadingSubscriber.instance
  }

  public async start(): Promise<void> {
    if (this.isSubscribed) {
      console.log('Reading subscriber already running')
      return
    }

    try {
      await RedisService.subscribe('sensor:reading', this.handleSensorReading.bind(this))
      this.isSubscribed = true
    } catch (error) {
      throw error
    }
  }

  public async stop(): Promise<void> {
    if (!this.isSubscribed) {
      return
    }

    try {
      await RedisService.unsubscribe('sensor:reading')
      this.isSubscribed = false
    } catch (error) {
      throw error
    }
  }

  private async handleSensorReading(event: SensorReadingEvent): Promise<void> {
    try {
      if (!event.sensorId || !event.value || !event.unit) {
        return
      }
      const sensorUnit = event.unit as SensorUnit
      if (!Object.values(SensorUnit).includes(sensorUnit)) {
        console.log('BACKEND Invalid sensor unit:', event.unit)
        return
      }

      const reading = await SensorReadingService.createReading({
        sensorId: event.sensorId,
        value: event.value,
        unit: sensorUnit,
        timestamp: new Date(event.timestamp),
      })

      if (reading) {
        console.log(` Saved reading for sensor ${event.sensorId}: ${event.value} ${event.unit}`
        )
      }
    } catch (error) {
      console.log('Error processing sensor reading:', error)
    }
  }

  public isRunning(): boolean {
    return this.isSubscribed
  }
}
