import prismaService from '#services/prisma_service'
import { SensorType } from '@prisma/client'
import RedisService from '#services/redis_service'

interface CreateSensorData {
  sensorId: string
  type: SensorType
  userId: string
}

interface SensorWithLocation {
  id: number
  sensorId: string
  type: SensorType
  active: boolean
  userId: string
  createdAt: Date
  updatedAt: Date
  location?: any
  user: {
    id: string
    email: string
    name: string
  }
}

interface SensorResponse {
  id: number
  sensorId: string
  type: SensorType
  active: boolean
  userId: string
  createdAt: Date
  updatedAt: Date
  latitude?: number | null
  longitude?: number | null
  user: {
    id: string
    email: string
    name: string
  }
}

export default class SensorService {
  static async createSensor(data: CreateSensorData): Promise<SensorResponse | null> {
    try {
      await prismaService.ensureConnection()

      const existingSensor = await prismaService.client.sensor.findUnique({
        where: { sensorId: data.sensorId },
      })

      if (existingSensor) {
        throw new Error(`Sensor with ID ${data.sensorId} already exists`)
      }

      const sensor = await prismaService.client.sensor.create({
        data: {
          sensorId: data.sensorId,
          type: data.type,
          userId: data.userId,
          active: true,
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
      })

      await RedisService.publish('sensor:created', {
        sensorId: sensor.id,
        userId: sensor.userId,
        sensorName: sensor.sensorId,
        type: sensor.type,
        active: sensor.active,
        createdAt: sensor.createdAt,
      })


      return {
        ...sensor,
        latitude: null,
        longitude: null,
      }
    } catch (error) {
      throw error
    }
  }

  static async getSensorsByUserId(userId: string): Promise<SensorResponse[]> {
    try {
      await prismaService.ensureConnection()

      const sensors = (await prismaService.client.sensor.findMany({
        where: {
          userId,
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      })) as SensorWithLocation[]

      const sensorsWithLocation = await Promise.all(
        sensors.map(async (sensor) => {
          let latitude = null
          let longitude = null

          try {
            const locationResult = await prismaService.client.$queryRaw<
              Array<{ lat: number; lng: number }>
            >`
              SELECT ST_Y(location) as lat, ST_X(location) as lng
              FROM "Sensor"
              WHERE id = ${sensor.id} AND location IS NOT NULL
            `

            if (
              locationResult.length > 0 &&
              locationResult[0].lat !== null &&
              locationResult[0].lng !== null
            ) {
              latitude = locationResult[0].lat
              longitude = locationResult[0].lng
            }
          } catch (error) {
          }

          return {
            id: sensor.id,
            sensorId: sensor.sensorId,
            type: sensor.type,
            active: sensor.active,
            userId: sensor.userId,
            createdAt: sensor.createdAt,
            updatedAt: sensor.updatedAt,
            latitude,
            longitude,
            user: sensor.user,
          }
        })
      )

      return sensorsWithLocation
    } catch (error) {
      throw error
    }
  }

  static async getSensorById(sensorId: string, userId: string): Promise<SensorResponse | null> {
    try {
      await prismaService.ensureConnection()

      const sensor = await prismaService.client.sensor.findFirst({
        where: {
          sensorId,
          userId,
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
      })

      return sensor
    } catch (error) {
      throw error
    }
  }

  static async getSensorByDbId(id: number, userId: string): Promise<SensorResponse | null> {
    try {
      await prismaService.ensureConnection()

      const sensor = await prismaService.client.sensor.findFirst({
        where: {
          id,
          userId,
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
      })

      return sensor
    } catch (error) {
      throw error
    }
  }
  static async toggleSensor(sensorId: string, userId: string): Promise<boolean> {
    try {
      await prismaService.ensureConnection()

      const sensor = await prismaService.client.sensor.findFirst({
        where: {
          sensorId,
          userId,
        },
      })

      if (!sensor) {
        throw new Error(`Sensor ${sensorId} not found for user ${userId}`)
      }

      const newActiveState = !sensor.active

      await prismaService.client.sensor.update({
        where: {
          id: sensor.id,
        },
        data: { active: newActiveState },
      })

      await RedisService.publish('sensor:status', {
        sensorId,
        userId,
        active: newActiveState,
        type: sensor.type,
        sensorDbId: sensor.id,
      })

      return true
    } catch (error) {
      throw error
    }
  }

  static async getAllActiveSensors(): Promise<SensorResponse[]> {
    try {
      await prismaService.ensureConnection()

      const sensors = await prismaService.client.sensor.findMany({
        where: {
          active: true,
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      })

      return sensors
    } catch (error) {
      throw error
    }
  }

  static async setSensorLocation(
    sensorId: string,
    userId: string,
    latitude: number,
    longitude: number
  ): Promise<boolean> {
    try {
      if (
        typeof latitude !== 'number' ||
        typeof longitude !== 'number' ||
        latitude < -90 ||
        latitude > 90 ||
        longitude < -180 ||
        longitude > 180 ||
        isNaN(latitude) ||
        isNaN(longitude)
      ) {
        return false
      }

      await prismaService.ensureConnection()

      const sensor = await prismaService.client.sensor.findFirst({
        where: {
          sensorId,
          userId,
        },
      })

      if (!sensor) {
        return false
      }

      await prismaService.client.$executeRaw`
      UPDATE "Sensor"
      SET location = ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)
      WHERE id = ${sensor.id}`

      try {
      } catch (error) {
      }

      return true
    } catch (error) {
      return false
    }
  }

  static async getSensorsHistoricalState(
    userId: string,
    targetDate: Date
  ): Promise<SensorResponse[]> {
    try {
      await prismaService.ensureConnection()

      const sensorsWithLocation = (await prismaService.client.$queryRaw`
        SELECT 
          s.id,
          s."sensorId",
          s.type,
          s.active,
          s."userId",
          s."createdAt",
          s."updatedAt",
          ST_X(s.location) as longitude,
          ST_Y(s.location) as latitude,
          u.id as "user_id",
          u.email as "user_email",
          u.name as "user_name"
        FROM "Sensor" s
        JOIN "User" u ON s."userId" = u.id
        WHERE s."userId" = ${userId}
        AND s."createdAt" <= ${targetDate}
        ORDER BY s."createdAt" DESC
      `) as any[]

      return sensorsWithLocation.map((sensor: any) => ({
        id: sensor.id,
        sensorId: sensor.sensorId,
        type: sensor.type,
        active: sensor.active,
        userId: sensor.userId,
        createdAt: sensor.createdAt,
        updatedAt: sensor.updatedAt,
        latitude: sensor.latitude,
        longitude: sensor.longitude,
        user: {
          id: sensor.user_id,
          email: sensor.user_email,
          name: sensor.user_name,
        },
      }))
    } catch (error) {
      throw error
    }
  }

  static async getSensorHistoricalStateById(
    sensorDbId: number,
    userId: string,
    targetDate: Date
  ): Promise<SensorResponse | null> {
    try {
      await prismaService.ensureConnection()

      const sensorsWithLocation = (await prismaService.client.$queryRaw`
        SELECT 
          s.id,
          s."sensorId",
          s.type,
          s.active,
          s."userId",
          s."createdAt",
          s."updatedAt",
          ST_X(s.location) as longitude,
          ST_Y(s.location) as latitude,
          u.id as "user_id",
          u.email as "user_email",
          u.name as "user_name"
        FROM "Sensor" s
        JOIN "User" u ON s."userId" = u.id
        WHERE s.id = ${sensorDbId}
        AND s."userId" = ${userId}
        AND s."createdAt" <= ${targetDate}
        LIMIT 1
      `) as any[]

      if (sensorsWithLocation.length === 0) {
        return null
      }

      const sensor = sensorsWithLocation[0]
      return {
        id: sensor.id,
        sensorId: sensor.sensorId,
        type: sensor.type,
        active: sensor.active,
        userId: sensor.userId,
        createdAt: sensor.createdAt,
        updatedAt: sensor.updatedAt,
        latitude: sensor.latitude,
        longitude: sensor.longitude,
        user: {
          id: sensor.user_id,
          email: sensor.user_email,
          name: sensor.user_name,
        },
      }
    } catch (error) {
      return null
    }
  }
}
