/*
|--------------------------------------------------------------------------
| HTTP server entrypoint
|--------------------------------------------------------------------------
|
| The "server.ts" file is the entrypoint for starting the AdonisJS HTTP
| server. Either you can run this file directly or use the "serve"
| command to run this file and monitor file changes
|
*/

import 'reflect-metadata'
import { Ignitor, prettyPrintError } from '@adonisjs/core'

/**
 * URL to the application root. AdonisJS need it to resolve
 * paths to file and directories for scaffolding commands
 */
const APP_ROOT = new URL('../', import.meta.url)

/**
 * The importer is used to import files in context of the
 * application.
 */
const IMPORTER = (filePath: string) => {
  if (filePath.startsWith('./') || filePath.startsWith('../')) {
    return import(new URL(filePath, APP_ROOT).href)
  }
  return import(filePath)
}

new Ignitor(APP_ROOT, { importer: IMPORTER })
  .tap((app) => {
    app.booting(async () => {
      await import('#start/env')
    })

    app.ready(async () => {
      // Initialize services when app is ready
      const RedisService = (await import('#services/redis_service')).default
      const SensorSimulatorService = (await import('#services/sensor_simulator_service')).default
      
      try {
        // Check Redis connection
        const redisStatus = await RedisService.getConnectionStatus()
        if (redisStatus) {
          // Redis connected successfully
        } else {
          // Redis connection failed - simulator will not work properly
          process.exit(1)
        }
        
        // Start the sensor simulator service
        const simulatorService = SensorSimulatorService.getInstance()
        await simulatorService.start()
        
        // All services initialized successfully
      } catch (error) {
        // Failed to initialize services
        process.exit(1)
      }
    })

    app.terminating(async () => {
      // Gracefully shutdown sensor simulator when app terminates
      try {
        const SensorSimulatorService = (await import('#services/sensor_simulator_service')).default
        const simulatorService = SensorSimulatorService.getInstance()
        await simulatorService.stop()
        // Application shutdown complete
      } catch (error) {
        // Error during shutdown
      }
    })

    app.listen('SIGTERM', () => app.terminate())
    app.listenIf(app.managedByPm2, 'SIGINT', () => app.terminate())
  })
  .httpServer()
  .start()
  .catch((error) => {
    process.exitCode = 1
    prettyPrintError(error)
  })
