import { HttpContext } from '@adonisjs/core/http'
import PrismaService from '#services/prisma_service'
import bcrypt from 'bcrypt'

export default class AdminController {
  private prisma = PrismaService.client

  // Dashboard Stats
  public async getDashboardStats({ response }: HttpContext) {
    try {
      await PrismaService.ensureConnection()

      const [totalUsers, totalSensors, activeSensors, totalShapes, totalReadings, adminUsers] =
        await Promise.all([
          this.prisma.user.count(),
          this.prisma.sensor.count(),
          this.prisma.sensor.count({ where: { active: true } }),
          this.prisma.shape.count(),
          this.prisma.sensorReading.count(),
          this.prisma.user.count({ where: { role: 'ADMIN' } }),
        ])

      // Get recent activity (last 24 hours)
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
      const [newUsersToday, newSensorsToday, newShapesToday, readingsToday] = await Promise.all([
        this.prisma.user.count({ where: { createdAt: { gte: yesterday } } }),
        this.prisma.sensor.count({ where: { createdAt: { gte: yesterday } } }),
        this.prisma.shape.count({ where: { createdAt: { gte: yesterday } } }),
        this.prisma.sensorReading.count({ where: { timestamp: { gte: yesterday } } }),
      ])

      return response.json({
        success: true,
        data: {
          overview: {
            totalUsers,
            totalSensors,
            activeSensors,
            inactiveSensors: totalSensors - activeSensors,
            totalShapes,
            totalReadings,
            adminUsers,
          },
          activity: {
            newUsersToday,
            newSensorsToday,
            newShapesToday,
            readingsToday,
          },
        },
      })
    } catch (error) {
      console.error('Failed to get dashboard stats:', error)
      return response.status(500).json({
        success: false,
        message: 'Failed to fetch dashboard statistics',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      })
    }
  }

  // User Management
  public async getUsers({ request, response }: HttpContext) {
    try {
      await PrismaService.ensureConnection()

      const page = parseInt(request.qs().page || '1')
      const limit = parseInt(request.qs().limit || '10')
      const search = request.qs().search || ''
      const role = request.qs().role || ''

      const where: any = {}
      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ]
      }
      if (role && (role === 'USER' || role === 'ADMIN')) {
        where.role = role
      }

      const [users, total] = await Promise.all([
        this.prisma.user.findMany({
          where,
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            createdAt: true,
            updatedAt: true,
            _count: {
              select: {
                sensors: true,
                shapes: true,
                accessTokens: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
        }),
        this.prisma.user.count({ where }),
      ])

      return response.json({
        success: true,
        data: {
          users,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
          },
        },
      })
    } catch (error) {
      console.error('Failed to get users:', error)
      return response.status(500).json({
        success: false,
        message: 'Failed to fetch users',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      })
    }
  }

  public async createUser({ request, response }: HttpContext) {
    try {
      const {
        email,
        password,
        name,
        role = 'USER',
      } = request.only(['email', 'password', 'name', 'role'])

      if (!email || !password || !name) {
        return response.status(400).json({
          success: false,
          message: 'Email, password, and name are required',
        })
      }

      if (role !== 'USER' && role !== 'ADMIN') {
        return response.status(400).json({
          success: false,
          message: 'Role must be either USER or ADMIN',
        })
      }

      const existingUser = await this.prisma.user.findUnique({
        where: { email },
      })

      if (existingUser) {
        return response.status(400).json({
          success: false,
          message: 'User with this email already exists',
        })
      }

      const hashedPassword = await bcrypt.hash(password, 10)
      const user = await this.prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          role,
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
        },
      })

      return response.status(201).json({
        success: true,
        message: 'User created successfully',
        data: { user },
      })
    } catch (error) {
      console.error('Failed to create user:', error)
      return response.status(500).json({
        success: false,
        message: 'Failed to create user',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      })
    }
  }

  public async updateUser({ request, response, params }: HttpContext) {
    try {
      const userId = params.id
      const { email, name, role } = request.only(['email', 'name', 'role'])

      if (role && role !== 'USER' && role !== 'ADMIN') {
        return response.status(400).json({
          success: false,
          message: 'Role must be either USER or ADMIN',
        })
      }

      const updateData: any = {}
      if (email) updateData.email = email
      if (name) updateData.name = name
      if (role) updateData.role = role

      const user = await this.prisma.user.update({
        where: { id: userId },
        data: updateData,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          updatedAt: true,
        },
      })

      return response.json({
        success: true,
        message: 'User updated successfully',
        data: { user },
      })
    } catch (error) {
      if (error.code === 'P2025') {
        return response.status(404).json({
          success: false,
          message: 'User not found',
        })
      }
      console.error('Failed to update user:', error)
      return response.status(500).json({
        success: false,
        message: 'Failed to update user',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      })
    }
  }

  public async deleteUser({ request, response, params }: HttpContext) {
    try {
      const userId = params.id

      // Prevent admin from deleting themselves
      if (userId === request.user?.id) {
        return response.status(400).json({
          success: false,
          message: 'Cannot delete your own account',
        })
      }

      await this.prisma.user.delete({
        where: { id: userId },
      })

      return response.json({
        success: true,
        message: 'User deleted successfully',
      })
    } catch (error) {
      if (error.code === 'P2025') {
        return response.status(404).json({
          success: false,
          message: 'User not found',
        })
      }
      console.error('Failed to delete user:', error)
      return response.status(500).json({
        success: false,
        message: 'Failed to delete user',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      })
    }
  }

  // Sensor Management
  public async getAllSensors({ request, response }: HttpContext) {
    try {
      await PrismaService.ensureConnection()

      const page = parseInt(request.qs().page || '1')
      const limit = parseInt(request.qs().limit || '20')
      const search = request.qs().search || ''
      const type = request.qs().type || ''
      const active = request.qs().active

      const where: any = {}
      if (search) {
        where.sensorId = { contains: search, mode: 'insensitive' }
      }
      if (type) {
        where.type = type
      }
      if (active !== undefined) {
        where.active = active === 'true'
      }

      const [sensors, total] = await Promise.all([
        this.prisma.sensor.findMany({
          where,
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
                role: true,
              },
            },
            _count: {
              select: {
                readings: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
        }),
        this.prisma.sensor.count({ where }),
      ])

      return response.json({
        success: true,
        data: {
          sensors,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
          },
        },
      })
    } catch (error) {
      console.error('Failed to get all sensors:', error)
      return response.status(500).json({
        success: false,
        message: 'Failed to fetch sensors',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      })
    }
  }

  public async deleteSensor({ response, params }: HttpContext) {
    try {
      const sensorId = parseInt(params.id)

      await this.prisma.sensor.delete({
        where: { id: sensorId },
      })

      return response.json({
        success: true,
        message: 'Sensor deleted successfully',
      })
    } catch (error) {
      if (error.code === 'P2025') {
        return response.status(404).json({
          success: false,
          message: 'Sensor not found',
        })
      }
      console.error('Failed to delete sensor:', error)
      return response.status(500).json({
        success: false,
        message: 'Failed to delete sensor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      })
    }
  }

  // Shape Management
  public async getAllShapes({ request, response }: HttpContext) {
    try {
      await PrismaService.ensureConnection()

      const page = parseInt(request.qs().page || '1')
      const limit = parseInt(request.qs().limit || '20')
      const search = request.qs().search || ''
      const type = request.qs().type || ''

      // Build WHERE conditions for raw query
      let whereConditions = '1=1'
      const queryParams: any[] = []
      let paramIndex = 1

      if (search) {
        whereConditions += ` AND sh.name ILIKE $${paramIndex}`
        queryParams.push(`%${search}%`)
        paramIndex++
      }
      if (type) {
        whereConditions += ` AND sh.type = $${paramIndex}`
        queryParams.push(type)
        paramIndex++
      }

      // Add pagination parameters
      const offsetParam = (page - 1) * limit

      const [shapes, totalResult] = await Promise.all([
        this.prisma.$queryRawUnsafe(
          `
          SELECT 
            sh.id,
            sh.name,
            sh.type,
            sh."userId",
            sh."createdAt",
            sh."updatedAt",
            u.id as "user_id",
            u.email as "user_email", 
            u.name as "user_name",
            u.role as "user_role",
            COALESCE(sensor_count.count, 0)::int as "sensorsInside"
          FROM "Shape" sh
          INNER JOIN "User" u ON sh."userId" = u.id
          LEFT JOIN (
            SELECT 
              sh_sub.id as shape_id,
              COUNT(s.id) as count
            FROM "Shape" sh_sub
            LEFT JOIN "Sensor" s ON s.location IS NOT NULL 
              AND ST_Contains(sh_sub.geometry, s.location)
            GROUP BY sh_sub.id
          ) sensor_count ON sensor_count.shape_id = sh.id
          WHERE ${whereConditions}
          ORDER BY sh."createdAt" DESC
          LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
        `,
          ...queryParams,
          limit,
          offsetParam
        ),

        this.prisma.$queryRawUnsafe(
          `
          SELECT COUNT(*)::int as total
          FROM "Shape" sh
          WHERE ${whereConditions}
        `,
          ...queryParams
        ),
      ])

      // Transform the result to match the expected format
      const formattedShapes = (shapes as any[]).map((shape: any) => ({
        id: shape.id,
        name: shape.name,
        type: shape.type,
        userId: shape.userId,
        createdAt: shape.createdAt,
        updatedAt: shape.updatedAt,
        user: {
          id: shape.user_id,
          email: shape.user_email,
          name: shape.user_name,
          role: shape.user_role,
        },
        _count: {
          sensorsInside: shape.sensorsInside,
        },
      }))

      const total = (totalResult as any[])[0]?.total || 0

      return response.json({
        success: true,
        data: {
          shapes: formattedShapes,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
          },
        },
      })
    } catch (error) {
      console.error('Failed to get all shapes:', error)
      return response.status(500).json({
        success: false,
        message: 'Failed to fetch shapes',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      })
    }
  }

  public async getShapeDetails({ response, params }: HttpContext) {
    try {
      const shapeId = parseInt(params.id)

      const shape = await this.prisma.shape.findUnique({
        where: { id: shapeId },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              role: true,
            },
          },
        },
      })

      if (!shape) {
        return response.status(404).json({
          success: false,
          message: 'Shape not found',
        })
      }

      // Get sensors within this shape with detailed info
      const sensorsInShape = (await this.prisma.$queryRaw`
        SELECT 
          s.id,
          s."sensorId",
          s.type,
          s.active,
          s."createdAt",
          u.name as "ownerName",
          u.email as "ownerEmail",
          u.role as "ownerRole",
          ST_X(s.location) as longitude,
          ST_Y(s.location) as latitude
        FROM "Sensor" s
        INNER JOIN "User" u ON s."userId" = u.id
        INNER JOIN "Shape" sh ON sh.id = ${shapeId}
        WHERE s.location IS NOT NULL
        AND ST_Contains(sh.geometry, s.location)
        ORDER BY s."createdAt" DESC
      `) as any[]

      // Get geometry
      const shapeWithGeometry = (await this.prisma.$queryRaw`
        SELECT ST_AsGeoJSON(geometry) as geometry
        FROM "Shape"
        WHERE id = ${shapeId}
      `) as any[]

      return response.json({
        success: true,
        data: {
          shape: {
            ...shape,
            geometry: shapeWithGeometry[0]?.geometry
              ? JSON.parse(shapeWithGeometry[0].geometry)
              : null,
            sensorsInside: sensorsInShape,
            _count: {
              sensorsInside: sensorsInShape.length,
            },
          },
        },
      })
    } catch (error) {
      console.error('Failed to get shape details:', error)
      return response.status(500).json({
        success: false,
        message: 'Failed to fetch shape details',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      })
    }
  }

  public async deleteShape({ response, params }: HttpContext) {
    try {
      const shapeId = parseInt(params.id)

      await this.prisma.shape.delete({
        where: { id: shapeId },
      })

      return response.json({
        success: true,
        message: 'Shape deleted successfully',
      })
    } catch (error) {
      if (error.code === 'P2025') {
        return response.status(404).json({
          success: false,
          message: 'Shape not found',
        })
      }
      console.error('Failed to delete shape:', error)
      return response.status(500).json({
        success: false,
        message: 'Failed to delete shape',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      })
    }
  }

  // System Analytics
  public async getSystemAnalytics({ response }: HttpContext) {
    try {
      await PrismaService.ensureConnection()

      // Get sensor readings over time (last 30 days)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

      const readingsOverTime = await this.prisma.$queryRaw`
        SELECT 
          DATE(timestamp) as date,
          COUNT(*) as count
        FROM "SensorReading"
        WHERE timestamp >= ${thirtyDaysAgo}
        GROUP BY DATE(timestamp)
        ORDER BY date ASC
      `

      // Get sensor type distribution
      const sensorTypes = await this.prisma.sensor.groupBy({
        by: ['type'],
        _count: {
          type: true,
        },
      })

      // Get user registration over time (last 30 days)
      const userRegistrations = await this.prisma.$queryRaw`
        SELECT 
          DATE("createdAt") as date,
          COUNT(*) as count
        FROM "User"
        WHERE "createdAt" >= ${thirtyDaysAgo}
        GROUP BY DATE("createdAt")
        ORDER BY date ASC
      `

      return response.json({
        success: true,
        data: {
          readingsOverTime,
          sensorTypes,
          userRegistrations,
        },
      })
    } catch (error) {
      console.error('Failed to get system analytics:', error)
      return response.status(500).json({
        success: false,
        message: 'Failed to fetch system analytics',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      })
    }
  }
}
