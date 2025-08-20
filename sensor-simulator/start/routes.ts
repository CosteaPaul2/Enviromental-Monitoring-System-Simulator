/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import router from '@adonisjs/core/services/router'

router.get('/', async () => {
  return {
    service: 'sensor-simulator',
    status: 'running',
    timestamp: new Date().toISOString()
  }
})

router.get('/health', async () => {
  try {
    const RedisService = (await import('#services/redis_service')).default
    const SensorSimulatorService = (await import('#services/sensor_simulator_service')).default
    
    const simulatorService = SensorSimulatorService.getInstance()
    const redisStatus = await RedisService.getConnectionStatus()
    const stats = simulatorService.getStats()
    
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        redis: redisStatus ? 'connected' : 'disconnected',
        simulator: stats.isRunning ? 'running' : 'stopped'
      },
      stats
    }
  } catch (error) {
    return {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    }
  }
})

router.get('/sensors', async () => {
  try {
    const SensorSimulatorService = (await import('#services/sensor_simulator_service')).default
    const simulatorService = SensorSimulatorService.getInstance()
    
    const activeSensors = simulatorService.getActiveSensors()
    const sensors = Array.from(activeSensors.values()).map(sensor => ({
      id: sensor.databaseId,
      sensorId: sensor.sensorName,
      type: sensor.type,
      userId: sensor.userId,
      isActive: true,
      errorCount: sensor.errorCount,
      lastReading: sensor.lastReading?.toISOString()
    }))
    
    return {
      count: sensors.length,
      sensors
    }
  } catch (error) {
    return {
      error: error.message,
      count: 0,
      sensors: []
    }
  }
})

router.get('/sensor/:id', async ({ params }) => {
  try {
    const SensorSimulatorService = (await import('#services/sensor_simulator_service')).default
    const simulatorService = SensorSimulatorService.getInstance()
    
    const sensorId = parseInt(params.id)
    const sensor = simulatorService.getSensorStatus(sensorId)
    
    if (!sensor) {
      return {
        error: `Sensor ${sensorId} not found`,
        sensor: null
      }
    }
    
    return {
      sensor: {
        id: sensor.databaseId,
        sensorId: sensor.sensorName,
        type: sensor.type,
        userId: sensor.userId,
        isActive: true,
        errorCount: sensor.errorCount,
        lastReading: sensor.lastReading?.toISOString()
      }
    }
  } catch (error) {
    return {
      error: error.message,
      sensor: null
    }
  }
})
