import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

export default class AdminMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const { request, response } = ctx

    try {
      if (!request.user) {
        return response.status(401).json({
          message: 'Authentication required',
          code: 'UNAUTHENTICATED',
        })
      }

      if (request.user.role !== 'ADMIN') {
        return response.status(403).json({
          message: 'Admin access required',
          code: 'INSUFFICIENT_PRIVILEGES',
        })
      }

      await next()
    } catch (error) {
      return response.status(403).json({
        message: 'Access denied',
        code: 'ACCESS_DENIED',
        error: error.message,
      })
    }
  }
}
