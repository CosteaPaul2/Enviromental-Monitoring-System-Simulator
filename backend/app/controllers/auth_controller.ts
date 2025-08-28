import { HttpContext } from '@adonisjs/core/http'
import AuthService from '../services/auth_service.js'

export default class AuthController {
  private authService = AuthService.getInstance()

  public async register({ request, response }: HttpContext) {
    try {
      const { email, password, name } = request.only(['email', 'password', 'name'])

      const user = await this.authService.register(email, password, name)

      return response.status(201).json({
        message: 'User registered successfully',
        user,
      })
    } catch (error) {
      return response.status(400).json({
        message: 'Registration failed',
        error: error.message,
      })
    }
  }

  public async login({ request, response }: HttpContext) {
    try {
      const { email, password } = request.only(['email', 'password'])

      const result = await this.authService.login(email, password)

      return response.json({
        message: 'Login successful',
        ...result,
      })
    } catch (error) {
      return response.status(401).json({
        message: 'Login failed',
        error: error.message,
      })
    }
  }

  public async logout({ request, response }: HttpContext) {
    try {
      const token = request.header('Authorization')?.replace('Bearer ', '')

      if (!token) {
        return response.status(401).json({ message: 'No token provided' })
      }

      await this.authService.logout(token)

      return response.json({ message: 'Logout successful' })
    } catch (error) {
      return response.status(400).json({
        message: 'Logout failed',
        error: error.message,
      })
    }
  }

  public async me({ request, response }: HttpContext) {
    try {
      const token = request.header('Authorization')?.replace('Bearer ', '')

      if (!token) {
        return response.status(401).json({ message: 'No token provided' })
      }

      const user = await this.authService.validateToken(token)

      if (!user) {
        return response.status(401).json({ message: 'Invalid or expired token' })
      }

      return response.json({ user })
    } catch (error) {
      return response.status(401).json({
        message: 'Unauthorized',
        error: error.message,
      })
    }
  }
}
