
import SensorService from '#services/sensor_service'
import SensorReadingService from '#services/sensor_reading_service'
import { HttpContext } from '@adonisjs/core/http'
import { SensorType } from '@prisma/client'


export default class SensorController {
  async index({ request, response }: HttpContext) {
    try {
      if (!request.user) {
        return response.status(401).json({
          success: false,
          message: 'Unauthorized access',
        })
      }
      const sensors = await SensorService.getSensorsByUserId(request.user.id)

      return response.json({
        success: true,
        data: {
          sensors,
        },
      })
    } catch (error) {
      return response.status(500).json({
        success: false,
        message: 'Failed to fetch sensors',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      })
    }
  }

  async store({ request, response }: HttpContext) {
    try {
      if (!request.user) {
        return response.status(401).json({
          success: false,
          message: 'Unauthorized access',
        })
      }
      const { sensorId, type } = request.only(['sensorId', 'type'])

      if (!sensorId || !type) {
        return response.status(400).json({
          success: false,
          message: 'sensorId and type are required',
          errors: {
            sensorId: !sensorId ? 'SensorId is required' : undefined,
            type: !type ? 'Type is required' : undefined,
          },
        })
      }

      if (!Object.values(SensorType).includes(type)) {
        return response.status(400).json({
          success: false,
          message: 'Invalid sensor type',
          validTypes: Object.values(SensorType),
        })
      }

      const sensor = await SensorService.createSensor({
        sensorId,
        type,
        userId: request.user.id,
      })

      return response.status(201).json({
        success: true,
        message: 'Sensor created successfully',
        data: { sensor },
      })
    } catch (error) {
      return response.status(500).json({
        success: false,
        message: 'Failed to create sensor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      })
    }
  }

  async toggle({ request, response }: HttpContext) {
    try {
      if (!request.user) {
        return response.status(401).json({
          success: false,
          message: 'Unauthorized access',
        })
      }

      const { sensorId } = request.only(['sensorId'])

      if (!sensorId) {
        return response.status(400).json({
          success: false,
          message: 'sensorId is required',
        })
      }

      if (typeof sensorId !== 'string' || sensorId.trim() === '') {
        return response.status(400).json({
          success: false,
          message: 'sensorId must be a valid string',
        })
      }

      const result = await SensorService.toggleSensor(sensorId, request.user.id)

      if (!result) {
        return response.status(404).json({
          success: false,
          message: 'Sensor not found',
        })
      }
      return response.json({
        success: true,
        message: 'Sensor status toggled successfully',
      })
    } catch (error) {
      console.log('Failed to toggle sensor', error)
      
      if (error.message && error.message.includes('not found')) {
        return response.status(404).json({
          success: false,
          message: 'Sensor not found for this user',
        })
      }
      
      return response.status(500).json({
        success: false,
        message: 'Failed to toggle sensor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      })
    }
  }

  async getActiveSensors({ response }: HttpContext) {
    try {
      const sensors = await SensorService.getAllActiveSensors()

      return response.json({
        success: true,
        data: {
          sensors,
          count: sensors.length,
        },
      })
    } catch (error) {
      return response.status(500).json({
        success: false,
        message: 'Failed to fetch active sensors',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      })
    }
  }

  async setSensorLocation({ request, response }: HttpContext) {
    try {
      if (!request.user) {
        return response.status(401).json({
          success: false,
          message: 'Unauthorized access'
        })
      }

      const { sensorId, latitude, longitude } = request.only(['sensorId', 'latitude', 'longitude'])

      if (!sensorId || latitude === undefined || longitude === undefined) {
        return response.status(400).json({
          success: false,
          message: 'Missing required fields'
        })
      }

      const result = await SensorService.setSensorLocation(sensorId, request.user.id, latitude, longitude)

      if (!result) {
        return response.status(400).json({
          success: false,
          message: 'sensorId, userId, latitude and longitude are required fields'
        })
      }

      return response.status(200).json({
        success: true
      })

    } catch (error) {
      return response.status(500).json({
        success: false,
      })
    }
  }

  async getReadings({ request, response, params }: HttpContext) {
    try {
      if (!request.user) {
        return response.status(401).json({
          success: false,
          message: 'Unauthorized access',
        })
      }

      const sensorIdParam = params.id

      if (!sensorIdParam) {
        return response.status(400).json({
          success: false,
          message: 'sensor ID is required',
        })
      }

      const sensorId = parseInt(sensorIdParam, 10)
      
      if (isNaN(sensorId)) {
        return response.status(400).json({
          success: false,
          message: 'Invalid sensor ID format',
        })
      }

      const sensor = await SensorService.getSensorByDbId(sensorId, request.user.id)

      if (!sensor) {
        return response.status(404).json({
          success: false,
          message: 'Sensor not found',
        })
      }

      const { startDate, endDate } = request.qs()
      const readings = await SensorReadingService.getReadings(sensor.id, startDate, endDate)

      return response.json({
        success: true,
        data: {
          readings,
        },
      })
    } catch (error) {
      return response.status(500).json({
        success: false,
        message: 'Failed to fetch readings',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      })
    }
  }

  async getLatestReading({ request, response, params }: HttpContext) {
    try {
      if (!request.user) {
        return response.status(401).json({
          success: false,
          message: 'Unauthorized access',
        })
      }

      const sensorIdParam = params.id

      if (!sensorIdParam) {
        return response.status(400).json({
          success: false,
          message: 'sensor ID is required',
        })
      }

      const sensorId = parseInt(sensorIdParam, 10)
      
      if (isNaN(sensorId)) {
        return response.status(400).json({
          success: false,
          message: 'Invalid sensor ID format',
        })
      }

      const sensor = await SensorService.getSensorByDbId(sensorId, request.user.id)

      if (!sensor) {
        return response.status(404).json({
          success: false,
          message: 'Sensor not found',
        })
      }

      const latestReading = await SensorReadingService.getLatestReading(sensor.id)

      return response.json({
        success: true,
        data: {
          reading: latestReading,
        },
      })
    } catch (error) {
      return response.status(500).json({
        success: false,
        message: 'Failed to fetch latest reading',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      })
    }
  }

  async getHistoricalSensors({ request, response }: HttpContext) {
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

      const sensors = await SensorService.getSensorsHistoricalState(request.user.id, targetDate)

      const sensorsWithReadings = await Promise.all(
        sensors.map(async (sensor) => {
          const closestReading = await SensorReadingService.getClosestReading(sensor.id, targetDate)
          return {
            ...sensor,
            currentReading: closestReading,
            historicalTimestamp: targetDate.toISOString()
          }
        })
      )

      return response.json({
        success: true,
        data: {
          sensors: sensorsWithReadings,
          timestamp: targetDate.toISOString(),
          count: sensorsWithReadings.length
        }
      })
    } catch (error) {
      return response.status(500).json({
        success: false,
        message: 'Failed to fetch historical sensors',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      })
    }
  }
}
