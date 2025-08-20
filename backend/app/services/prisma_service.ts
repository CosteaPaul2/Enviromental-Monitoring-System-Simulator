import { PrismaClient } from '@prisma/client'

class PrismaService {
  public client: PrismaClient
  private isConnected: boolean = false

  constructor() {
    this.client = new PrismaClient({
      log: ['error', 'warn'],
      errorFormat: 'pretty',
    })
  }

  public async connect(): Promise<void> {
    try {
      if (!this.isConnected) {
        await this.client.$connect()
        this.isConnected = true
      }
    } catch (error) {
      console.error('Failed to connect to Prisma:', error)
    }
  }

  public async disconnect(): Promise<void> {
    try {
      if (this.isConnected) {
        await this.client.$disconnect()
        this.isConnected = false
        console.log('🔌 Prisma disconnected')
      }
    } catch (error) {
      console.error('Error disconnecting Prisma:', error)
      throw error
    }
  }

  public async healthCheck(): Promise<boolean> {
    try {
      await this.client.$queryRaw`SELECT 1`
      return true
    } catch (error) {
      console.error('Database health check failed:', error)
      return false
    }
  }

  public getConnectionStatus(): boolean {
    return this.isConnected
  }

  public async ensureConnection(): Promise<void> {
    if (!this.isConnected) {
      await this.connect()
    }
  }
}

export default new PrismaService()
