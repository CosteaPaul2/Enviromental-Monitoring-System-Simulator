import redis from '@adonisjs/redis/services/main'

export type RedisChannels =
  | 'sensor:created'
  | 'sensor:reading'
  | 'user:authenticated'
  | 'sensor:status'

export interface SensorCreatedData {
  sensorId: number
  userId: string
  sensorName: string
  type: string
  active: boolean
  createdAt: Date
}

export interface SensorReadingData {
  sensorId: number
  timestamp: Date
  value: number
  unit: string
}

export default class RedisService {
  static async publish(channel: RedisChannels, data: any): Promise<boolean> {
    try {
      const serializedData = JSON.stringify(data)
      const result = await redis.publish(channel, serializedData)

      if (result > 0) {
        return true
      }
      return false
    } catch (error) {
      return false
    }
  }

  static async subscribe(channel: RedisChannels, callback: (data: any) => void): Promise<void> {
    try {
      redis.subscribe(channel, (message) => {
        try {
          const parsedData = JSON.parse(message)
          callback(parsedData)
        } catch (error) {
        }
      })
    } catch (error) {
    }
  }

  static async unsubscribe(channel: RedisChannels): Promise<void> {
    try {
      await redis.unsubscribe(channel)
    } catch (error) {
    }
  }

  static async publishSensorReading(data: SensorReadingData): Promise<boolean> {
    return await this.publish('sensor:reading', {
      ...data,
      timestamp: data.timestamp.toISOString(),
    })
  }

  static async publishSensorCreated(data: SensorCreatedData): Promise<boolean> {
    return await this.publish('sensor:created', {
      ...data,
      createdAt: data.createdAt.toISOString(),
    })
  }

  static async getConnectionStatus(): Promise<boolean> {
    try {
      await redis.ping()
      return true
    } catch (error) {
      return false
    }
  }
}
