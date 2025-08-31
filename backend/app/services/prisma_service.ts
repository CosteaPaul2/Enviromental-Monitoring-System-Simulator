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
    }
  }

  public async disconnect(): Promise<void> {
    try {
      if (this.isConnected) {
        await this.client.$disconnect()
        this.isConnected = false
      }
    } catch (error) {
      throw error
    }
  }

  public async healthCheck(): Promise<boolean> {
    try {
      await this.client.$queryRaw`SELECT 1`
      return true
    } catch (error) {
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
