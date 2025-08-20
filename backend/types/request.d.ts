import type { Request } from '@adonisjs/core/http'

export interface AuthenticatedUser {
  id: string
  email: string
  name: string
}

declare module '@adonisjs/core/http' {
  interface Request {
    user?: AuthenticatedUser
  }
}
