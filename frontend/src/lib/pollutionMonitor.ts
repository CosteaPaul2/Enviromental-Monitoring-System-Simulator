import { shapesApi } from './sensorsApi'

export interface PollutionAlert {
  id: string
  shapeId: number
  shapeName: string
  area: string
  type: string
  level: 'good' | 'moderate' | 'unhealthy' | 'dangerous'
  alertLevel: 'none' | 'low' | 'medium' | 'high' | 'critical'
  riskScore: number
  pollutionFactors: string[]
  recommendations: string[]
  sensorCount: number
  activeSensorCount: number
  timestamp: string
  persistent?: boolean
}

export interface ShapeWithPollution {
  id: number
  name: string
  type: string
  pollutionLevel: 'good' | 'moderate' | 'unhealthy' | 'dangerous' | 'no-data'
  riskScore: number
  alertLevel: 'none' | 'low' | 'medium' | 'high' | 'critical'
  sensorCount: number
  activeSensorCount: number
  createdAt: string
  updatedAt: string
  geometry?: any
}

export interface PollutionMonitorStats {
  totalShapes: number
  shapesWithAlerts: number
  criticalAlerts: number
  highAlerts: number
  mediumAlerts: number
  lowAlerts: number
  totalSensors: number
  activeSensors: number
  averageRiskScore: number
}

class PollutionMonitorService {
  private static instance: PollutionMonitorService
  private pollutionCache = new Map<number, ShapeWithPollution>()
  private alertsCache: PollutionAlert[] = []
  private lastUpdate: Date | null = null
  private updateInterval: NodeJS.Timeout | null = null

  private constructor() {}

  public static getInstance(): PollutionMonitorService {
    if (!PollutionMonitorService.instance) {
      PollutionMonitorService.instance = new PollutionMonitorService()
    }
    return PollutionMonitorService.instance
  }

  async fetchPollutionData(): Promise<ShapeWithPollution[]> {
    try {
      const response = await shapesApi.getShapesWithGeometry()
      if (response.success && response.data?.shapes) {
        const shapes = response.data.shapes.map((shape: any) => ({
          id: shape.id,
          name: shape.name,
          type: shape.type,
          pollutionLevel: shape.pollutionLevel || 'no-data',
          riskScore: shape.riskScore || 0,
          alertLevel: shape.alertLevel || 'none',
          sensorCount: shape.sensorCount || 0,
          activeSensorCount: shape.activeSensorCount || 0,
          createdAt: shape.createdAt,
          updatedAt: shape.updatedAt,
          geometry: shape.geometry
        }))

        // Update cache
        this.pollutionCache.clear()
        shapes.forEach((shape: ShapeWithPollution) => {
          this.pollutionCache.set(shape.id, shape)
        })
        
        this.lastUpdate = new Date()
        return shapes
      }
      return []
    } catch (error) {
      console.error('Failed to fetch pollution data:', error)
      return Array.from(this.pollutionCache.values())
    }
  }

  generateAlertsFromShapes(shapes: ShapeWithPollution[]): PollutionAlert[] {
    const alerts: PollutionAlert[] = []
    const now = new Date().toISOString()

    shapes.forEach(shape => {
      // Only generate alerts for high-priority issues (critical, high, or dangerous pollution)
      if ((shape.alertLevel === 'critical' || shape.alertLevel === 'high' || shape.pollutionLevel === 'dangerous') && 
          shape.pollutionLevel !== 'no-data') {
        const alertId = `alert-${shape.id}-${Date.now()}`
        
        // Determine primary pollution type from shape data
        let primaryType = 'Environmental Condition'
        if (shape.pollutionLevel === 'dangerous') {
          primaryType = 'Critical Pollution'
        } else if (shape.pollutionLevel === 'unhealthy') {
          primaryType = 'Unhealthy Air Quality'
        } else if (shape.pollutionLevel === 'moderate') {
          primaryType = 'Moderate Pollution'
        }

        alerts.push({
          id: alertId,
          shapeId: shape.id,
          shapeName: shape.name,
          area: shape.name,
          type: primaryType,
          level: shape.pollutionLevel,
          alertLevel: shape.alertLevel,
          riskScore: shape.riskScore,
          pollutionFactors: [], // Will be populated when detailed data is fetched
          recommendations: [], // Will be populated when detailed data is fetched
          sensorCount: shape.sensorCount,
          activeSensorCount: shape.activeSensorCount,
          timestamp: now,
          persistent: shape.alertLevel === 'critical' || shape.alertLevel === 'high'
        })
      }
    })

    this.alertsCache = alerts
    return alerts
  }

  async getDetailedAlerts(): Promise<PollutionAlert[]> {
    const shapes = await this.fetchPollutionData()
    const basicAlerts = this.generateAlertsFromShapes(shapes)
    
    // Enhance alerts with detailed pollution analysis
    const detailedAlerts = await Promise.all(
      basicAlerts.map(async (alert) => {
        try {
          const detailResponse = await shapesApi.getShapeDetails(alert.shapeId)
          if (detailResponse.success && detailResponse.data?.pollutionAnalysis) {
            const analysis = detailResponse.data.pollutionAnalysis
            return {
              ...alert,
              pollutionFactors: analysis.pollutionFactors || [],
              recommendations: analysis.recommendations || []
            }
          }
        } catch (error) {
          console.warn(`Failed to get detailed data for shape ${alert.shapeId}:`, error)
        }
        return alert
      })
    )

    return detailedAlerts
  }

  getCurrentAlerts(): PollutionAlert[] {
    return this.alertsCache
  }

  getCachedShapes(): ShapeWithPollution[] {
    return Array.from(this.pollutionCache.values())
  }

  generateStats(shapes?: ShapeWithPollution[]): PollutionMonitorStats {
    const data = shapes || Array.from(this.pollutionCache.values())
    
    const totalShapes = data.length
    const shapesWithAlerts = data.filter(s => s.alertLevel !== 'none').length
    const criticalAlerts = data.filter(s => s.alertLevel === 'critical').length
    const highAlerts = data.filter(s => s.alertLevel === 'high').length
    const mediumAlerts = data.filter(s => s.alertLevel === 'medium').length
    const lowAlerts = data.filter(s => s.alertLevel === 'low').length
    
    const totalSensors = data.reduce((sum, s) => sum + s.sensorCount, 0)
    const activeSensors = data.reduce((sum, s) => sum + s.activeSensorCount, 0)
    
    const averageRiskScore = totalSensors > 0 
      ? data.reduce((sum, s) => sum + s.riskScore, 0) / data.length
      : 0

    return {
      totalShapes,
      shapesWithAlerts,
      criticalAlerts,
      highAlerts,
      mediumAlerts,
      lowAlerts,
      totalSensors,
      activeSensors,
      averageRiskScore: Math.round(averageRiskScore)
    }
  }

  startMonitoring(intervalMs: number = 30000): void {
    this.stopMonitoring()
    
    // Initial fetch
    this.fetchPollutionData()
    
    // Set up recurring fetch
    this.updateInterval = setInterval(() => {
      this.fetchPollutionData()
    }, intervalMs)
  }

  stopMonitoring(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval)
      this.updateInterval = null
    }
  }

  getLastUpdateTime(): Date | null {
    return this.lastUpdate
  }

  isDataStale(maxAgeMs: number = 60000): boolean {
    if (!this.lastUpdate) return true
    return Date.now() - this.lastUpdate.getTime() > maxAgeMs
  }

  // Filter alerts by severity level
  getAlertsByLevel(level: PollutionAlert['alertLevel']): PollutionAlert[] {
    return this.alertsCache.filter(alert => alert.alertLevel === level)
  }

  // Get most recent alerts
  getRecentAlerts(limit: number = 5): PollutionAlert[] {
    return this.alertsCache
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit)
  }

  // Get high priority alerts (critical + high)
  getHighPriorityAlerts(): PollutionAlert[] {
    return this.alertsCache.filter(alert => 
      alert.alertLevel === 'critical' || alert.alertLevel === 'high'
    )
  }
}

export default PollutionMonitorService