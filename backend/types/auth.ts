import type { AuthenticatedUser } from './request.js'

declare module '@adonisjs/core/http' {
  interface HttpContext {
    user?: AuthenticatedUser | null
  }
}

export {}
