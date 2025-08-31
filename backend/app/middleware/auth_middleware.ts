import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import AuthService from '#services/auth_service'

export default class AuthMiddleware {
  private authService = AuthService.getInstance()

  async handle(ctx: HttpContext, next: NextFn) {
    const { request, response } = ctx

    try {
      const authHeader = request.header('Authorization')

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return response.status(401).json({
          message: 'No valid authorization header provided',
          code: 'MISSING_TOKEN',
        })
      }

      const token = authHeader.replace('Bearer ', '')

      if (!token) {
        return response.status(401).json({
          message: 'No token provided',
          code: 'MISSING_TOKEN',
        })
      }

      const user = await this.authService.validateToken(token)

      if (!user) {
        return response.status(401).json({
          message: 'Invalid or expired token',
          code: 'INVALID_TOKEN',
        })
      }
      request.user = user

      await next()
    } catch (error) {
      return response.status(401).json({
        message: 'Authentication failed',
        code: 'AUTH_ERROR',
        error: error.message,
      })
    }
  }
}
