import redis from "@adonisjs/redis/services/main";

export type RedisChannels = 
  | 'sensor:created' 
  | 'sensor:reading'
  | 'sensor:status'

export interface SensorCreatedEvent {
  sensorId: number
  userId: string
  sensorSID: string
  type: string
  active: boolean
  createdAt: string
}

export interface SensorReadingEvent {
  sensorId: number
  timestamp: string
  value: number
  unit: string
  userId: string
}

export interface SensorStatusEvent {
  sensorId: number
  userId: string
  status: 'active' | 'inactive' | 'error'
  lastReading?: string
}

export default class RedisService {
    static async publish(channel: RedisChannels, data: any): Promise<boolean> {
        try {
            const serializedData = JSON.stringify(data)
            const result = await redis.publish(channel, serializedData)
            
            if (result > 0) {
                console.log(`Published to ${channel}:`, data)
                return true
            }
            return false
        } catch (error) {
            console.log(`Failed to publish to ${channel}:`, error)
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
                    console.log('Error parsing data')
                }
            })
            console.log(`Subscribed to channel: ${channel}`)
        } catch (error) {
            console.log(`Failed to subscribe to ${channel}:`, error)
        }
    }

    static async unsubscribe(channel: RedisChannels): Promise<void> {
        try {
            await redis.unsubscribe(channel)
            console.log(`Unsubscribed from channel: ${channel}`)
        } catch (error) {
            console.log(`Failed to unsubscribe from ${channel}`, error)
        }
    }

    static async publishSensorReading(data: SensorReadingEvent): Promise<boolean> {
        return await this.publish('sensor:reading', {
            ...data,
            timestamp: new Date().toISOString()
        })
    }

    static async publishSensorStatus(data: SensorStatusEvent): Promise<boolean> {
        return await this.publish('sensor:status', {
            ...data,
            timestamp: new Date().toISOString()
        })
    }

    static async getConnectionStatus(): Promise<boolean> {
        try {
            await redis.ping()
            return true
        } catch (error) {
            console.log('Redis connection check failed:', error)
            return false
        }
    }

    static async clearChannel(channel: RedisChannels): Promise<void> {
        try {
            await redis.del(channel)
            console.log(`Cleared channel: ${channel}`)
        } catch (error) {
            console.log(`Failed to clear channel ${channel}:`, error)
        }
    }
} 