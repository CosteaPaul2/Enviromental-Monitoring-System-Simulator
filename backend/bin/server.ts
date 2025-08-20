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
      // Initialize Prisma connection when app is ready
      const PrismaService = (await import('#services/prisma_service')).default
      const RedisService = (await import('#services/redis_service')).default
      const SensorReadingSubscriber = (await import('#services/sensor_reading_subscriber')).default

      try {
        await PrismaService.connect()

        // Check Redis connection
        const redisStatus = await RedisService.getConnectionStatus()
        if (redisStatus) {
          console.log('✅ Redis connected successfully')
        } else {
          console.warn('⚠️ Redis connection failed - some features may not work')
        }

        // Start sensor reading subscriber
        const readingSubscriber = SensorReadingSubscriber.getInstance()
        await readingSubscriber.start()

        console.log('🚀 All services initialized successfully')
      } catch (error) {
        console.error('❌ Failed to initialize services:', error)
        process.exit(1)
      }
    })

    app.terminating(async () => {
      // Gracefully disconnect services when app terminates
      const PrismaService = (await import('#services/prisma_service')).default
      const SensorReadingSubscriber = (await import('#services/sensor_reading_subscriber')).default

      try {
        const readingSubscriber = SensorReadingSubscriber.getInstance()
        await readingSubscriber.stop()

        await PrismaService.disconnect()
        console.log('👋 Application shutdown complete')
      } catch (error) {
        console.error('❌ Error during shutdown:', error)
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
