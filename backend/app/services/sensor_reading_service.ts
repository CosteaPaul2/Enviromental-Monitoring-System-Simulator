import prismaService from '#services/prisma_service'
import { SensorUnit } from '@prisma/client'

export interface CreateSensorReadingData {
  sensorId: number
  value: number
  unit: SensorUnit
  timestamp?: Date
}

export interface SensorReadingResponse {
  id: number
  sensorId: number
  timestamp: Date
  value: number
  unit: SensorUnit
}

export default class SensorReadingService {
  static async createReading(data: CreateSensorReadingData): Promise<SensorReadingResponse | null> {
    try {
      await prismaService.ensureConnection()

      const sensor = await prismaService.client.sensor.findUnique({
        where: {
          id: data.sensorId,
          active: true,
        },
      })

      if (!sensor) {
        throw new Error(`Active sensor with ID ${data.sensorId} not found`)
      }

      const reading = await prismaService.client.sensorReading.create({
        data: {
          sensorId: data.sensorId,
          value: data.value,
          unit: data.unit,
          timestamp: data.timestamp || new Date(),
        },
      })

      return reading
    } catch (error) {
      throw error
    }
  }

  static async getReadingsBySensorId(
    sensorId: number,
    limit: number = 100,
    offset: number = 0
  ): Promise<SensorReadingResponse[]> {
    try {
      await prismaService.ensureConnection()

      const readings = await prismaService.client.sensorReading.findMany({
        where: { sensorId },
        orderBy: { timestamp: 'desc' },
        take: limit,
        skip: offset,
      })

      return readings
    } catch (error) {
      throw error
    }
  }

  static async getLatestReading(sensorId: number): Promise<SensorReadingResponse | null> {
    try {
      await prismaService.ensureConnection()

      const reading = await prismaService.client.sensorReading.findFirst({
        where: { sensorId },
        orderBy: { timestamp: 'desc' },
      })

      return reading
    } catch (error) {
      throw error
    }
  }

  static async getReadings(
    sensorId: number,
    startDate?: string,
    endDate?: string,
    limit: number = 100
  ): Promise<SensorReadingResponse[]> {
    try {
      await prismaService.ensureConnection()

      if (startDate && endDate) {
        return this.getReadingsInRange(sensorId, new Date(startDate), new Date(endDate))
      }

      return this.getReadingsBySensorId(sensorId, limit)
    } catch (error) {
      throw error
    }
  }

  static async getReadingsInRange(
    sensorId: number,
    startDate: Date,
    endDate: Date
  ): Promise<SensorReadingResponse[]> {
    try {
      await prismaService.ensureConnection()

      const readings = await prismaService.client.sensorReading.findMany({
        where: {
          sensorId,
          timestamp: {
            gte: startDate,
            lte: endDate,
          },
        },
        orderBy: { timestamp: 'asc' },
      })

      return readings
    } catch (error) {
      throw error
    }
  }

  static async getClosestReading(
    sensorId: number,
    targetDate: Date
  ): Promise<SensorReadingResponse | null> {
    try {
      await prismaService.ensureConnection()

      const reading = await prismaService.client.sensorReading.findFirst({
        where: {
          sensorId,
          timestamp: {
            gte: new Date(targetDate.getTime() - 24 * 60 * 60 * 1000),
            lte: new Date(targetDate.getTime() + 24 * 60 * 60 * 1000),
          },
        },
        orderBy: [
          {
            timestamp: 'desc',
          },
        ],
      })

      if (!reading) {
        const closestReading = await prismaService.client.sensorReading.findFirst({
          where: {
            sensorId,
            timestamp: {
              lte: targetDate,
            },
          },
          orderBy: {
            timestamp: 'desc',
          },
        })

        return closestReading
      }

      return reading
    } catch (error) {
      console.error('Error getting closest reading:', error)
      return null
    }
  }

  static async getReadingsAtTime(
    sensorId: number,
    targetDate: Date,
    toleranceHours: number = 1
  ): Promise<SensorReadingResponse[]> {
    try {
      await prismaService.ensureConnection()

      const startTime = new Date(targetDate.getTime() - toleranceHours * 60 * 60 * 1000)
      const endTime = new Date(targetDate.getTime() + toleranceHours * 60 * 60 * 1000)

      const readings = await prismaService.client.sensorReading.findMany({
        where: {
          sensorId,
          timestamp: {
            gte: startTime,
            lte: endTime,
          },
        },
        orderBy: { timestamp: 'asc' },
      })

      return readings
    } catch (error) {
      throw error
    }
  }
}
