import { HttpContext } from '@adonisjs/core/http'
import PrismaService from '#services/prisma_service'

export default class SpatialAnalysisController {
  private prisma = PrismaService.client

  async analyzeClientZone({ request, response }: HttpContext) {
    try {
      if (!request.user) {
        return response.status(401).json({
          success: false,
          message: 'Unauthorized access',
        })
      }

      const { geometry, name } = request.only(['geometry', 'name'])

      if (!geometry || !geometry.type || !geometry.coordinates) {
        return response.status(400).json({
          success: false,
          message: 'Invalid geometry format. Expected GeoJSON with type and coordinates',
        })
      }

      const geomText = this.geoJsonToWKT(geometry)

      const sensorsInZone = await this.getSensorsInClientZone(geomText)

      const basicAnalysis = this.getBasicAnalysis(geometry, sensorsInZone)

      return response.json({
        success: true,
        data: {
          zoneName: name || 'Analysis Area',
          geometry,
          analysis: {
            sensors: {
              total: sensorsInZone.length,
              active: sensorsInZone.filter((s) => s.active).length,
              sensors: sensorsInZone,
            },
            area: basicAnalysis.area,
            coverage: basicAnalysis.coverage,
          },
        },
      })
    } catch (error) {
      return response.status(500).json({
        success: false,
        message: 'Failed to analyze zone',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      })
    }
  }

  private async getSensorsInClientZone(geomWKT: string) {
    try {
      const sensors = (await this.prisma.$queryRaw`
        SELECT 
          s.id,
          s."sensorId",
          s.type,
          s.active,
          s."createdAt",
          u.name as "ownerName",
          u.email as "ownerEmail",
          ST_X(s.location) as longitude,
          ST_Y(s.location) as latitude
        FROM "Sensor" s
        INNER JOIN "User" u ON s."userId" = u.id
        WHERE s.location IS NOT NULL
        AND ST_Contains(ST_GeomFromText(${geomWKT}, 4326), s.location)
        ORDER BY s."createdAt" DESC
      `) as any[]

      return sensors
    } catch (error) {
      return []
    }
  }

  private geoJsonToWKT(geometry: any): string {
    switch (geometry.type) {
      case 'Point':
        const [lng, lat] = geometry.coordinates
        return `POINT(${lng} ${lat})`

      case 'Polygon':
        const coords = geometry.coordinates[0]
        const coordStr = coords.map((coord: number[]) => `${coord[0]} ${coord[1]}`).join(', ')
        return `POLYGON((${coordStr}))`

      case 'MultiPolygon':
        const polygons = geometry.coordinates
          .map((polygon: number[][][]) => {
            const ring = polygon[0]
            const coordStr = ring.map((coord: number[]) => `${coord[0]} ${coord[1]}`).join(', ')
            return `((${coordStr}))`
          })
          .join(', ')
        return `MULTIPOLYGON(${polygons})`

      default:
        throw new Error(`Unsupported geometry type: ${geometry.type}`)
    }
  }

  private getBasicAnalysis(geometry: any, sensors: any[]) {
    const area = this.calculateZoneArea(geometry)
    const areaKm2 = area / 1000000

    return {
      area: Math.round(areaKm2 * 100) / 100, 
      coverage: sensors.length > 0 ? 'monitored' : 'unmonitored',
      activeSensors: sensors.filter((s) => s.active).length,
      totalSensors: sensors.length,
    }
  }

  private calculateZoneArea(geometry: any): number {
    if (geometry.type === 'Point') {
      return Math.PI * Math.pow(geometry.radius || 100, 2)
    } else if (geometry.type === 'Polygon') {
      const coords = geometry.coordinates[0]
      let area = 0
      for (let i = 0; i < coords.length - 1; i++) {
        area += coords[i][0] * coords[i + 1][1] - coords[i + 1][0] * coords[i][1]
      }
      return Math.abs(area / 2) * 111320 * 111320
    }
    return 1000000
  }

}
