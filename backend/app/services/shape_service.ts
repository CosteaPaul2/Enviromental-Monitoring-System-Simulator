import prismaService from '#services/prisma_service'
import { ShapeType } from '@prisma/client'

interface CreateShapeData {
  name: string
  type: ShapeType
  geometry: any
  userId: string
}

interface ShapeResponse {
  id: number
  name: string
  type: ShapeType
  userId: string
  createdAt: Date
  updatedAt: Date
}

interface ShapeWithGeometry extends ShapeResponse {
  geometry: any
}

interface SpatialQueryResult {
  sensorId: number
  sensorName: string
  shapeId?: number
  shapeName?: string
}

export default class ShapeService {
  static async createShape(data: CreateShapeData): Promise<ShapeResponse> {
    try {
      await prismaService.ensureConnection()

      const result = await prismaService.client.$queryRaw<{ id: number }[]>`
        INSERT INTO "Shape" (name, type, geometry, "userId", "createdAt", "updatedAt")
        VALUES (
          ${data.name},
          ${data.type}::"ShapeType",
          ST_GeomFromGeoJSON(${JSON.stringify(data.geometry)}),
          ${data.userId},
          NOW(),
          NOW()
        )
        RETURNING id
      `

      if (!result || result.length === 0) {
        throw new Error('Failed to create shape')
      }

      const shapeId = result[0].id

      const createdShape = await prismaService.client.shape.findUnique({
        where: { id: shapeId },
      })

      if (!createdShape) {
        throw new Error('Failed to retrieve created shape')
      }

      const containedSensors = await this.getSensorsInShape(shapeId)
      console.log(
        `Shape "${data.name}" created with ID ${shapeId}, contains ${containedSensors.length} sensors`
      )

      return createdShape
    } catch (error) {
      console.error('Failed to create shape:', error)
      throw error
    }
  }

  static async getShapesByUserId(userId: string): Promise<ShapeResponse[]> {
    try {
      await prismaService.ensureConnection()

      const shapes = await prismaService.client.shape.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      })

      return shapes
    } catch (error) {
      console.error('Failed to get shapes for user:', error)
      throw error
    }
  }

  static async getShapeById(shapeId: number, userId: string): Promise<ShapeResponse | null> {
    try {
      await prismaService.ensureConnection()

      const shape = await prismaService.client.shape.findFirst({
        where: { id: shapeId, userId },
      })

      return shape
    } catch (error) {
      console.error('Failed to get shape by ID:', error)
      throw error
    }
  }

  static async deleteShape(shapeId: number, userId: string): Promise<boolean> {
    try {
      await prismaService.ensureConnection()

      const shape = await prismaService.client.shape.findFirst({
        where: { id: shapeId, userId },
      })

      if (!shape) {
        throw new Error(`Shape ${shapeId} not found for user ${userId}`)
      }

      await prismaService.client.shape.delete({
        where: { id: shapeId },
      })

      console.log(`Shape "${shape.name}" (ID: ${shapeId}) deleted`)
      return true
    } catch (error) {
      console.error('Failed to delete shape:', error)
      throw error
    }
  }

  static async getShapeWithGeometry(
    shapeId: number,
    userId: string
  ): Promise<ShapeWithGeometry | null> {
    try {
      await prismaService.ensureConnection()

      const result = await prismaService.client.$queryRaw<any[]>`
        SELECT 
          id,
          name,
          type,
          "userId",
          "createdAt",
          "updatedAt",
          ST_AsGeoJSON(geometry) as geometry
        FROM "Shape"
        WHERE id = ${shapeId} AND "userId" = ${userId}
      `

      if (!result || result.length === 0) {
        return null
      }

      const shape = result[0]
      return {
        ...shape,
        geometry: JSON.parse(shape.geometry),
      }
    } catch (error) {
      console.error('Failed to get shape with geometry:', error)
      throw error
    }
  }

  static async getShapesWithGeometry(userId: string): Promise<ShapeWithGeometry[]> {
    try {
      await prismaService.ensureConnection()

      const result = await prismaService.client.$queryRaw<any[]>`
        SELECT 
          id,
          name,
          type,
          "userId",
          "createdAt",
          "updatedAt",
          ST_AsGeoJSON(geometry) as geometry
        FROM "Shape"
        WHERE "userId" = ${userId}
        ORDER BY "createdAt" DESC
      `

      if (!result || !Array.isArray(result)) {
        return []
      }

      return result.map((shape) => ({
        ...shape,
        geometry: JSON.parse(shape.geometry),
      }))
    } catch (error) {
      console.error('Failed to get shapes with geometry:', error)
      throw error
    }
  }

  static async getSensorsInShape(shapeId: number): Promise<SpatialQueryResult[]> {
    try {
      await prismaService.ensureConnection()

      const result = await prismaService.client.$queryRaw<SpatialQueryResult[]>`
        SELECT 
          s.id as "sensorId",
          s."sensorId" as "sensorName"
        FROM "Sensor" s
        INNER JOIN "Shape" sh ON sh.id = ${shapeId}
        WHERE s.location IS NOT NULL
        AND ST_Contains(sh.geometry, s.location)
      `

      return result || []
    } catch (error) {
      console.error('Failed to get sensors in shape:', error)
      throw error
    }
  }

  static async getShapesContainingSensor(sensorId: number): Promise<SpatialQueryResult[]> {
    try {
      await prismaService.ensureConnection()

      const result = await prismaService.client.$queryRaw<SpatialQueryResult[]>`
        SELECT 
          sh.id as "shapeId",
          sh.name as "shapeName"
        FROM "Shape" sh
        INNER JOIN "Sensor" s ON s.id = ${sensorId}
        WHERE s.location IS NOT NULL
        AND ST_Contains(sh.geometry, s.location)
      `

      return result || []
    } catch (error) {
      console.error('Failed to get shapes containing sensor:', error)
      throw error
    }
  }

  static async getShapesContainingSensorBySensorId(
    sensorId: string,
    userId: string
  ): Promise<SpatialQueryResult[]> {
    try {
      await prismaService.ensureConnection()

      const result = await prismaService.client.$queryRaw<SpatialQueryResult[]>`
        SELECT 
          sh.id as "shapeId",
          sh.name as "shapeName"
        FROM "Shape" sh
        INNER JOIN "Sensor" s ON s."sensorId" = ${sensorId} AND s."userId" = ${userId}
        WHERE s.location IS NOT NULL
        AND sh."userId" = ${userId}
        AND ST_Contains(sh.geometry, s.location)
      `

      return result || []
    } catch (error) {
      console.error('Failed to get shapes containing sensor by sensorId:', error)
      throw error
    }
  }

  static async updateShapeGeometry(
    shapeId: number,
    userId: string,
    geometry: any
  ): Promise<boolean> {
    try {
      await prismaService.ensureConnection()

      const shape = await prismaService.client.shape.findFirst({
        where: { id: shapeId, userId },
      })

      if (!shape) {
        throw new Error(`Shape ${shapeId} not found for user ${userId}`)
      }

      await prismaService.client.$executeRaw`
        UPDATE "Shape" 
        SET 
          geometry = ST_GeomFromGeoJSON(${JSON.stringify(geometry)}),
          "updatedAt" = NOW()
        WHERE id = ${shapeId}
      `

      console.log(`Shape "${shape.name}" geometry updated`)
      return true
    } catch (error) {
      console.error('Failed to update shape geometry:', error)
      throw error
    }
  }

  static async getShapesHistoricalState(userId: string, targetDate: Date): Promise<any[]> {
    try {
      await prismaService.ensureConnection()

      const result = (await prismaService.client.$queryRaw`
        SELECT 
          id,
          name,
          type,
          ST_AsGeoJSON(geometry) as geometry,
          "userId",
          "createdAt",
          "updatedAt"
        FROM "Shape"
        WHERE "userId" = ${userId}
        AND "createdAt" <= ${targetDate}
        ORDER BY "createdAt" DESC
      `) as any[]

      return result.map((shape) => ({
        ...shape,
        geometry: shape.geometry ? JSON.parse(shape.geometry) : null,
      }))
    } catch (error) {
      console.error('Error getting historical shapes:', error)
      throw error
    }
  }

  static async getSensorsInShapeAtTime(shapeId: number, targetDate: Date): Promise<any[]> {
    try {
      await prismaService.ensureConnection()

      const result = (await prismaService.client.$queryRaw`
        SELECT 
          s.id as "sensorId",
          s."sensorId" as "sensorName",
          s.type,
          s.active,
          ST_X(s.location) as longitude,
          ST_Y(s.location) as latitude
        FROM "Sensor" s, "Shape" sh
        WHERE sh.id = ${shapeId}
        AND s."createdAt" <= ${targetDate}
        AND s.location IS NOT NULL
        AND ST_Within(s.location, sh.geometry)
      `) as any[]

      return result
    } catch (error) {
      console.error('Error getting sensors in shape at time:', error)
      return []
    }
  }
}
