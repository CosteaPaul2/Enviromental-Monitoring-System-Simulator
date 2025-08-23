import { v4 as uuidv4 } from 'uuid'
import bcrypt from 'bcrypt'
import PrismaService from './prisma_service.js'

export default class AuthService {
  private static instance: AuthService
  private prisma = PrismaService.client

  private constructor() {}

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService()
    }
    return AuthService.instance
  }

  public async register(email: string, password: string, name: string, role: 'USER' | 'ADMIN' = 'USER') {
    try {
      const existingUser = await this.prisma.user.findUnique({
        where: { email },
      })

      if (existingUser) {
        throw new Error('User already exists')
      }

      const hashedPassword = await bcrypt.hash(password, 10)
      const user = await this.prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          role,
        },
      })

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      }
    } catch (error) {
      console.error('Error during user registration:', error)
      throw error
    }
  }

  public async login(email: string, password: string) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { email },
      })

      if (!user) {
        throw new Error('Invalid credentials')
      }

      const isValidPassword = await bcrypt.compare(password, user.password)
      if (!isValidPassword) {
        throw new Error('Invalid credentials')
      }

      const accessToken = uuidv4()
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) 

      await this.prisma.accessToken.create({
        data: {
          hash: accessToken,
          name: 'Login Token',
          abilities: [],
          userId: user.id,
          expiresAt,
        },
      })

      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
        accessToken,
      }
    } catch (error) {
      console.error('Error during user login:', error)
      throw error
    }
  }

  public async validateToken(accessToken: string) {
    try {
      const tokenRecord = await this.prisma.accessToken.findUnique({
        where: { hash: accessToken },
        include: { user: true },
      })

      if (!tokenRecord) {
        return null
      }

      if (tokenRecord.expiresAt && new Date() > tokenRecord.expiresAt) {
        await this.prisma.accessToken.delete({
          where: { hash: accessToken },
        })
        return null
      }
      await this.prisma.accessToken.update({
        where: { hash: accessToken },
        data: { lastUsedAt: new Date() },
      })

      return {
        id: tokenRecord.user.id,
        email: tokenRecord.user.email,
        name: tokenRecord.user.name,
        role: tokenRecord.user.role,
      }
    } catch (error) {
      console.error('Error during token validation:', error)
      return null
    }
  }

  public async logout(accessToken: string): Promise<boolean> {
    try {
      await this.prisma.accessToken.delete({
        where: { hash: accessToken },
      })
      return true
    } catch (error) {
      console.error('Error during logout:', error)
      return false
    }
  }
}
