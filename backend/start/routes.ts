import router from '@adonisjs/core/services/router'
import { middleware } from './kernel.js'

router.get('/', async () => {
  return { message: 'Welcome to the Environmental Monitoring System API' }
})

// Public routes
router.post('/register', '#controllers/auth_controller.register')
router.post('/login', '#controllers/auth_controller.login')
router.get('/sensors/active', '#controllers/sensor_controller.getActiveSensors')

// Protected routes
router
  .group(() => {
    router.get('/me', '#controllers/auth_controller.me')
    router.post('/logout', '#controllers/auth_controller.logout')
    
    // Sensor routes
    router.get('/sensors', '#controllers/sensor_controller.index')
    router.get('/sensors/historical', '#controllers/sensor_controller.getHistoricalSensors')
    router.post('/sensor', '#controllers/sensor_controller.store')
    router.post('/sensorToggle', '#controllers/sensor_controller.toggle')
    router.post('/sensorLocation', '#controllers/sensor_controller.setSensorLocation')
    router.get('/sensors/:id/readings', '#controllers/sensor_controller.getReadings')
    router.get('/sensors/:id/latest', '#controllers/sensor_controller.getLatestReading')
    
    // Shape routes
    router.get('/shapes', '#controllers/shape_controller.index')
    router.get('/shapes/geometry', '#controllers/shape_controller.indexWithGeometry')
    router.get('/shapes/historical', '#controllers/shape_controller.getHistoricalShapes')
    router.get('/shapes/:id', '#controllers/shape_controller.show')
    router.get('/shapes/:id/geometry', '#controllers/shape_controller.showWithGeometry')
    router.get('/shapes/:id/details', '#controllers/shape_controller.getShapeDetails')
    router.post('/shapes', '#controllers/shape_controller.store')
    router.put('/shapes/:id', '#controllers/shape_controller.update')
    router.delete('/shapes/:id', '#controllers/shape_controller.destroy')
    
    // Spatial query routes
    router.get('/shapes/:id/sensors', '#controllers/shape_controller.getSensorsInShape')
    router.get('/sensors/:sensorId/shapes', '#controllers/shape_controller.getShapesContainingSensor')
  })
  .use(middleware.auth())
