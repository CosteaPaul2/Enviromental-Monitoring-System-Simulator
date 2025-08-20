import ShapeService from '#services/shape_service'
import PollutionAnalysisService from '#services/pollution_analysis_service'
import SensorService from '#services/sensor_service'
import SensorReadingService from '#services/sensor_reading_service'
import { HttpContext } from '@adonisjs/core/http'
import { ShapeType } from '@prisma/client'

export default class ShapeController {
  async index({ request, response }: HttpContext) {
    try {
      if (!request.user) {
        return response.status(401).json({
          success: false,
          message: 'Unauthorized access'
        })
      }

      const shapes = await ShapeService.getShapesByUserId(request.user.id)

      return response.json({
        success: true,
        data: {
          shapes,
          count: shapes.length
        }
      })
    } catch (error) {
      return response.status(500).json({
        success: false,
        message: 'Failed to fetch shapes',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      })
    }
  }

  async indexWithGeometry({ request, response }: HttpContext) {
    try {
      if (!request.user) {
        return response.status(401).json({
          success: false,
          message: 'Unauthorized access'
        })
      }

      const shapes = await ShapeService.getShapesWithGeometry(request.user.id)

      const shapesWithPollution = await Promise.all(
        shapes.map(async (shape) => {
          try {
            const sensorsInShape = await ShapeService.getSensorsInShape(shape.id)
            
            const detailedSensors = await Promise.all(
              sensorsInShape.map(async (sensor) => {
                try {
                  const sensorDetails = await SensorService.getSensorByDbId(sensor.sensorId, request.user!.id)
                  return {
                    id: sensor.sensorId,
                    sensorId: sensor.sensorName,
                    type: sensorDetails?.type || 'AIR_QUALITY',
                    active: sensorDetails?.active || false
                  }
                } catch (error) {
                  return {
                    id: sensor.sensorId,
                    sensorId: sensor.sensorName,
                    type: 'AIR_QUALITY',
                    active: false
                  }
                }
              })
            )

            const pollutionAnalysis = await PollutionAnalysisService.analyzeShapePollution(
              shape.id,
              shape.name,
              detailedSensors
            )

            return {
              ...shape,
              pollutionLevel: pollutionAnalysis.overallPollutionLevel,
              riskScore: pollutionAnalysis.riskScore,
              alertLevel: pollutionAnalysis.alertLevel,
              sensorCount: detailedSensors.length,
              activeSensorCount: detailedSensors.filter(s => s.active).length
            }
          } catch (error) {
            console.warn(`Failed to analyze pollution for shape ${shape.id}:`, error)
            return {
              ...shape,
              pollutionLevel: 'no-data',
              riskScore: 0,
              alertLevel: 'none',
              sensorCount: 0,
              activeSensorCount: 0
            }
          }
        })
      )

      return response.json({
        success: true,
        data: {
          shapes: shapesWithPollution,
          count: shapesWithPollution.length
        }
      })
    } catch (error) {
      return response.status(500).json({
        success: false,
        message: 'Failed to fetch shapes with geometry',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      })
    }
  }

  async show({ request, response }: HttpContext) {
    try {
      if (!request.user) {
        return response.status(401).json({
          success: false,
          message: 'Unauthorized access'
        })
      }

      const { id } = request.params()
      const shapeId = parseInt(id)

      if (isNaN(shapeId)) {
        return response.status(400).json({
          success: false,
          message: 'Invalid shape ID'
        })
      }

      const shape = await ShapeService.getShapeById(shapeId, request.user.id)

      if (!shape) {
        return response.status(404).json({
          success: false,
          message: 'Shape not found'
        })
      }

      return response.json({
        success: true,
        data: { shape }
      })
    } catch (error) {
      return response.status(500).json({
        success: false,
        message: 'Failed to fetch shape',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      })
    }
  }

  async showWithGeometry({ request, response }: HttpContext) {
    try {
      if (!request.user) {
        return response.status(401).json({
          success: false,
          message: 'Unauthorized access'
        })
      }

      const { id } = request.params()
      const shapeId = parseInt(id)

      if (isNaN(shapeId)) {
        return response.status(400).json({
          success: false,
          message: 'Invalid shape ID'
        })
      }

      const shape = await ShapeService.getShapeWithGeometry(shapeId, request.user.id)

      if (!shape) {
        return response.status(404).json({
          success: false,
          message: 'Shape not found'
        })
      }

      return response.json({
        success: true,
        data: { shape }
      })
    } catch (error) {
      return response.status(500).json({
        success: false,
        message: 'Failed to fetch shape with geometry',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      })
    }
  }

  async store({ request, response }: HttpContext) {
    try {
      if (!request.user) {
        return response.status(401).json({
          success: false,
          message: 'Unauthorized access'
        })
      }

      const { name, type, geometry } = request.only(['name', 'type', 'geometry'])

      if (!name || !type || !geometry) {
        return response.status(400).json({
          success: false,
          message: 'Missing required fields',
          errors: {
            name: !name ? 'Name is required' : undefined,
            type: !type ? 'Type is required' : undefined,
            geometry: !geometry ? 'Geometry is required' : undefined
          }
        })
      }

      if (!Object.values(ShapeType).includes(type)) {
        return response.status(400).json({
          success: false,
          message: 'Invalid shape type',
          validTypes: Object.values(ShapeType)
        })
      }

      if (!geometry.type || !geometry.coordinates) {
        return response.status(400).json({
          success: false,
          message: 'Invalid geometry format. Expected GeoJSON with type and coordinates'
        })
      }

      const shape = await ShapeService.createShape({
        name: name.trim(),
        type,
        geometry,
        userId: request.user.id
      })

      const containedSensors = await ShapeService.getSensorsInShape(shape.id)

      return response.status(201).json({
        success: true,
        message: 'Shape created successfully',
        data: { 
          shape,
          containedSensors: {
            sensors: containedSensors,
            count: containedSensors.length
          }
        }
      })
    } catch (error) {
      return response.status(500).json({
        success: false,
        message: 'Failed to create shape',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      })
    }
  }

  async destroy({ request, response }: HttpContext) {
    try {
      if (!request.user) {
        return response.status(401).json({
          success: false,
          message: 'Unauthorized access'
        })
      }

      const { id } = request.params()
      const shapeId = parseInt(id)

      if (isNaN(shapeId)) {
        return response.status(400).json({
          success: false,
          message: 'Invalid shape ID'
        })
      }

      const result = await ShapeService.deleteShape(shapeId, request.user.id)

      if (!result) {
        return response.status(404).json({
          success: false,
          message: 'Shape not found'
        })
      }

      return response.json({
        success: true,
        message: 'Shape deleted successfully'
      })
    } catch (error) {
      if (error.message && error.message.includes('not found')) {
        return response.status(404).json({
          success: false,
          message: 'Shape not found for this user'
        })
      }

      return response.status(500).json({
        success: false,
        message: 'Failed to delete shape',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      })
    }
  }

  async update({ request, response }: HttpContext) {
    try {
      if (!request.user) {
        return response.status(401).json({
          success: false,
          message: 'Unauthorized access'
        })
      }

      const { id } = request.params()
      const shapeId = parseInt(id)
      const { geometry } = request.only(['geometry'])

      if (isNaN(shapeId)) {
        return response.status(400).json({
          success: false,
          message: 'Invalid shape ID'
        })
      }

      if (!geometry) {
        return response.status(400).json({
          success: false,
          message: 'Geometry is required'
        })
      }

      if (!geometry.type || !geometry.coordinates) {
        return response.status(400).json({
          success: false,
          message: 'Invalid geometry format. Expected GeoJSON with type and coordinates'
        })
      }

      const result = await ShapeService.updateShapeGeometry(shapeId, request.user.id, geometry)

      if (!result) {
        return response.status(404).json({
          success: false,
          message: 'Shape not found'
        })
      }

      const containedSensors = await ShapeService.getSensorsInShape(shapeId)

      return response.json({
        success: true,
        message: 'Shape geometry updated successfully',
        data: {
          containedSensors: {
            sensors: containedSensors,
            count: containedSensors.length
          }
        }
      })
    } catch (error) {
      if (error.message && error.message.includes('not found')) {
        return response.status(404).json({
          success: false,
          message: 'Shape not found for this user'
        })
      }

      return response.status(500).json({
        success: false,
        message: 'Failed to update shape',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      })
    }
  }

  async getSensorsInShape({ request, response }: HttpContext) {
    try {
      if (!request.user) {
        return response.status(401).json({
          success: false,
          message: 'Unauthorized access'
        })
      }

      const { id } = request.params()
      const shapeId = parseInt(id)

      if (isNaN(shapeId)) {
        return response.status(400).json({
          success: false,
          message: 'Invalid shape ID'
        })
      }

      const shape = await ShapeService.getShapeById(shapeId, request.user.id)
      if (!shape) {
        return response.status(404).json({
          success: false,
          message: 'Shape not found'
        })
      }

      const sensors = await ShapeService.getSensorsInShape(shapeId)

      return response.json({
        success: true,
        data: {
          shapeId,
          shapeName: shape.name,
          sensors,
          count: sensors.length
        }
      })
    } catch (error) {
      return response.status(500).json({
        success: false,
        message: 'Failed to get sensors in shape',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      })
    }
  }

  async getShapesContainingSensor({ request, response }: HttpContext) {
    try {
      if (!request.user) {
        return response.status(401).json({
          success: false,
          message: 'Unauthorized access'
        })
      }

      const { sensorId } = request.params()

      if (!sensorId) {
        return response.status(400).json({
          success: false,
          message: 'Sensor ID is required'
        })
      }

      const shapes = await ShapeService.getShapesContainingSensorBySensorId(sensorId, request.user.id)

      return response.json({
        success: true,
        data: {
          sensorId,
          shapes,
          count: shapes.length
        }
      })
    } catch (error) {
      return response.status(500).json({
        success: false,
        message: 'Failed to get shapes containing sensor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      })
    }
  }

  async getShapeDetails({ request, response }: HttpContext) {
    try {
      if (!request.user) {
        return response.status(401).json({
          success: false,
          message: 'Unauthorized access'
        })
      }

      const { id } = request.params()
      const shapeId = parseInt(id)

      if (isNaN(shapeId)) {
        return response.status(400).json({
          success: false,
          message: 'Invalid shape ID'
        })
      }

      const shape = await ShapeService.getShapeById(shapeId, request.user.id)
      if (!shape) {
        return response.status(404).json({
          success: false,
          message: 'Shape not found'
        })
      }

      const shapeWithGeometry = await ShapeService.getShapeWithGeometry(shapeId, request.user.id)
      const sensorsInShape = await ShapeService.getSensorsInShape(shapeId)

      const detailedSensors = await Promise.all(
        sensorsInShape.map(async (sensor) => {
          try {
            const sensorDetails = await SensorService.getSensorByDbId(sensor.sensorId, request.user!.id)
            return {
              id: sensor.sensorId,
              sensorId: sensor.sensorName,
              type: sensorDetails?.type || 'AIR_QUALITY',
              active: sensorDetails?.active || false,
              latitude: sensorDetails?.latitude,
              longitude: sensorDetails?.longitude,
              user: sensorDetails?.user
            }
          } catch (error) {
            console.warn(`Failed to get details for sensor ${sensor.sensorId}:`, error)
            return {
              id: sensor.sensorId,
              sensorId: sensor.sensorName,
              type: 'AIR_QUALITY',
              active: false
            }
          }
        })
      )

      const pollutionAnalysis = await PollutionAnalysisService.analyzeShapePollution(
        shapeId,
        shape.name,
        detailedSensors
      )

      return response.json({
        success: true,
        data: {
          shape: {
            id: shape.id,
            name: shape.name,
            type: shape.type,
            createdAt: shape.createdAt,
            updatedAt: shape.updatedAt,
            geometry: shapeWithGeometry?.geometry
          },
          sensors: detailedSensors,
          pollutionAnalysis,
          summary: {
            totalSensors: detailedSensors.length,
            activeSensors: detailedSensors.filter(s => s.active).length,
            pollutionLevel: pollutionAnalysis.overallPollutionLevel,
            riskScore: pollutionAnalysis.riskScore,
            alertLevel: pollutionAnalysis.alertLevel
          }
        }
      })
    } catch (error) {
      console.error('Failed to get shape details:', error)
      return response.status(500).json({
        success: false,
        message: 'Failed to get shape details',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      })
    }
  }

  async getHistoricalShapes({ request, response }: HttpContext) {
    try {
      if (!request.user) {
        return response.status(401).json({
          success: false,
          message: 'Unauthorized access'
        })
      }

      const { timestamp } = request.qs()

      if (!timestamp) {
        return response.status(400).json({
          success: false,
          message: 'timestamp is required'
        })
      }

      const targetDate = new Date(timestamp)
      if (isNaN(targetDate.getTime())) {
        return response.status(400).json({
          success: false,
          message: 'Invalid timestamp format'
        })
      }

      const shapes = await ShapeService.getShapesHistoricalState(request.user.id, targetDate)

      const shapesWithHistoricalPollution = await Promise.all(
        shapes.map(async (shape) => {
          try {
            const historicalSensorsInShape = await ShapeService.getSensorsInShapeAtTime(shape.id, targetDate)
            
            const detailedSensors = await Promise.all(
              historicalSensorsInShape.map(async (sensor) => {
                try {
                  const sensorDetails = await SensorService.getSensorHistoricalStateById(sensor.sensorId, request.user!.id, targetDate)
                  const closestReading = await SensorReadingService.getClosestReading(sensor.sensorId, targetDate)
                  
                  return {
                    id: sensor.sensorId,
                    sensorId: sensor.sensorName,
                    type: sensorDetails?.type || 'AIR_QUALITY',
                    active: sensorDetails?.active || false,
                    latitude: sensorDetails?.latitude,
                    longitude: sensorDetails?.longitude,
                    currentReading: closestReading,
                    historicalTimestamp: targetDate.toISOString()
                  }
                } catch (error) {
                  return {
                    id: sensor.sensorId,
                    sensorId: sensor.sensorName,
                    type: 'AIR_QUALITY',
                    active: false,
                    currentReading: null,
                    historicalTimestamp: targetDate.toISOString()
                  }
                }
              })
            )

            const historicalPollutionAnalysis = await PollutionAnalysisService.analyzeHistoricalShapePollution(
              shape.id,
              shape.name,
              detailedSensors,
              targetDate
            )

            return {
              ...shape,
              pollutionLevel: historicalPollutionAnalysis.overallPollutionLevel,
              riskScore: historicalPollutionAnalysis.riskScore,
              alertLevel: historicalPollutionAnalysis.alertLevel,
              sensorCount: detailedSensors.length,
              activeSensorCount: detailedSensors.filter(s => s.active).length,
              historicalTimestamp: targetDate.toISOString(),
              sensors: detailedSensors
            }
          } catch (error) {
            console.warn(`Failed to analyze historical pollution for shape ${shape.id}:`, error)
            return {
              ...shape,
              pollutionLevel: 'no-data',
              riskScore: 0,
              alertLevel: 'none',
              sensorCount: 0,
              activeSensorCount: 0,
              historicalTimestamp: targetDate.toISOString(),
              sensors: []
            }
          }
        })
      )

      return response.json({
        success: true,
        data: {
          shapes: shapesWithHistoricalPollution,
          timestamp: targetDate.toISOString(),
          count: shapesWithHistoricalPollution.length
        }
      })
    } catch (error) {
      console.error('Failed to get historical shapes:', error)
      return response.status(500).json({
        success: false,
        message: 'Failed to get historical shapes',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      })
    }
  }
}