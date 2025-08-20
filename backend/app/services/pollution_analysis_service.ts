import { SensorType, SensorUnit } from '@prisma/client'
import SensorReadingService from '#services/sensor_reading_service'

export interface PollutionThreshold {
  good: { min: number; max: number }
  moderate: { min: number; max: number }
  unhealthy: { min: number; max: number }
  dangerous: { min: number; max: number }
}

export interface SensorPollutionData {
  sensorId: number
  sensorName: string
  type: SensorType
  latestValue?: number
  unit?: SensorUnit
  pollutionLevel: 'good' | 'moderate' | 'unhealthy' | 'dangerous' | 'no-data'
  timestamp?: Date
  active: boolean
}

export interface ShapePollutionAnalysis {
  shapeId: number
  shapeName: string
  overallPollutionLevel: 'good' | 'moderate' | 'unhealthy' | 'dangerous' | 'no-data'
  sensors: SensorPollutionData[]
  pollutionFactors: string[]
  riskScore: number
  recommendations: string[]
  alertLevel: 'none' | 'low' | 'medium' | 'high' | 'critical'
}

export default class PollutionAnalysisService {
  private static readonly POLLUTION_THRESHOLDS: Record<SensorType, PollutionThreshold> = {
    TEMPERATURE: {
      good: { min: 18, max: 26 },
      moderate: { min: 15, max: 30 },
      unhealthy: { min: 10, max: 35 },
      dangerous: { min: -10, max: 45 }
    },
    HUMIDITY: {
      good: { min: 40, max: 60 },
      moderate: { min: 30, max: 70 },
      unhealthy: { min: 20, max: 80 },
      dangerous: { min: 0, max: 100 }
    },
    AIR_QUALITY: {
      good: { min: 0, max: 50 }, 
      moderate: { min: 51, max: 100 }, 
      unhealthy: { min: 101, max: 200 }, 
      dangerous: { min: 201, max: 1000 } 
    },
    CO2: {
      good: { min: 350, max: 1000 }, 
      moderate: { min: 1001, max: 2000 },
      unhealthy: { min: 2001, max: 5000 }, 
      dangerous: { min: 5001, max: 50000 } 
    },
    NOISE: {
      good: { min: 0, max: 55 }, 
      moderate: { min: 56, max: 70 }, 
      unhealthy: { min: 71, max: 85 }, 
      dangerous: { min: 86, max: 140 } 
    },
    LIGHT: {
      good: { min: 200, max: 1000 },     
      moderate: { min: 100, max: 2000 }, 
      unhealthy: { min: 50, max: 5000 }, 
      dangerous: { min: 0, max: 100000 } 
    }
  }

  static async analyzeSensorPollution(sensorId: number, sensorType: SensorType, active: boolean, sensorName?: string): Promise<SensorPollutionData> {
    try {
      const displayName = sensorName || `Sensor ${sensorId}`
      
      if (!active) {
        return {
          sensorId,
          sensorName: displayName,
          type: sensorType,
          pollutionLevel: 'no-data',
          active: false
        }
      }

      const latestReading = await SensorReadingService.getLatestReading(sensorId)
      
      if (!latestReading) {
        return {
          sensorId,
          sensorName: displayName,
          type: sensorType,
          pollutionLevel: 'no-data',
          active: true
        }
      }

      const pollutionLevel = this.calculatePollutionLevel(sensorType, latestReading.value)

      return {
        sensorId,
        sensorName: displayName,
        type: sensorType,
        latestValue: latestReading.value,
        unit: latestReading.unit,
        pollutionLevel,
        timestamp: new Date(latestReading.timestamp),
        active: true
      }
    } catch (error) {
      console.error(`Error analyzing sensor pollution for sensor ${sensorId}:`, error)
      return {
        sensorId,
        sensorName: sensorName || `Sensor ${sensorId}`,
        type: sensorType,
        pollutionLevel: 'no-data',
        active: false
      }
    }
  }

  static calculatePollutionLevel(sensorType: SensorType, value: number): 'good' | 'moderate' | 'unhealthy' | 'dangerous' {
    const thresholds = this.POLLUTION_THRESHOLDS[sensorType]
    
    if (value >= thresholds.good.min && value <= thresholds.good.max) {
      return 'good'
    } else if (value >= thresholds.moderate.min && value <= thresholds.moderate.max) {
      return 'moderate'
    } else if (value >= thresholds.unhealthy.min && value <= thresholds.unhealthy.max) {
      return 'unhealthy'
    } else {
      return 'dangerous'
    }
  }

  static async analyzeShapePollution(shapeId: number, shapeName: string, sensorsInShape: any[]): Promise<ShapePollutionAnalysis> {
    const sensorAnalyses: SensorPollutionData[] = []
    
    for (const sensor of sensorsInShape) {
      const analysis = await this.analyzeSensorPollution(
        sensor.id || sensor.sensorId, 
        sensor.type || SensorType.AIR_QUALITY,
        sensor.active !== false,
        sensor.sensorId 
      )
      sensorAnalyses.push(analysis)
    }

    const overallLevel = this.calculateOverallPollutionLevel(sensorAnalyses)
    
    const pollutionFactors = this.identifyPollutionFactors(sensorAnalyses)
    const recommendations = this.generateRecommendations(sensorAnalyses, overallLevel)
    
    const riskScore = this.calculateRiskScore(sensorAnalyses)
    
    const alertLevel = this.determineAlertLevel(overallLevel, riskScore)

    return {
      shapeId,
      shapeName,
      overallPollutionLevel: overallLevel,
      sensors: sensorAnalyses,
      pollutionFactors,
      riskScore,
      recommendations,
      alertLevel
    }
  }

  static calculateOverallPollutionLevel(sensors: SensorPollutionData[]): 'good' | 'moderate' | 'unhealthy' | 'dangerous' | 'no-data' {
    const activeSensors = sensors.filter(s => s.active && s.pollutionLevel !== 'no-data')
    
    if (activeSensors.length === 0) {
      return 'no-data'
    }

    const levelCounts = {
      dangerous: activeSensors.filter(s => s.pollutionLevel === 'dangerous').length,
      unhealthy: activeSensors.filter(s => s.pollutionLevel === 'unhealthy').length,
      moderate: activeSensors.filter(s => s.pollutionLevel === 'moderate').length,
      good: activeSensors.filter(s => s.pollutionLevel === 'good').length
    }

    const totalSensors = activeSensors.length
    

    const dangerousPercent = (levelCounts.dangerous / totalSensors) * 100
    const unhealthyPercent = (levelCounts.unhealthy / totalSensors) * 100
    const moderatePercent = (levelCounts.moderate / totalSensors) * 100
    const goodPercent = (levelCounts.good / totalSensors) * 100
    
    const problemPercent = dangerousPercent + unhealthyPercent
    if (dangerousPercent >= 50 || problemPercent >= 80) {
      return 'dangerous'
    }
    
    if (dangerousPercent >= 25 || problemPercent >= 50) {
      return 'unhealthy'
    }
 
    const concernPercent = dangerousPercent + unhealthyPercent + moderatePercent
    if (dangerousPercent > 0 || unhealthyPercent >= 25 || concernPercent >= 50) {
      return 'moderate'
    }
    
    if (goodPercent >= 70) {
      return 'good'
    }

    return 'moderate'
  }

  static identifyPollutionFactors(sensors: SensorPollutionData[]): string[] {
    const factors: string[] = []
    
    sensors.forEach(sensor => {
      if (sensor.pollutionLevel === 'dangerous' || sensor.pollutionLevel === 'unhealthy') {
        switch (sensor.type) {
          case SensorType.CO2:
            factors.push(`High CO2 levels (${sensor.latestValue} PPM)`)
            break
          case SensorType.AIR_QUALITY:
            factors.push(`Poor air quality (${sensor.latestValue} AQI)`)
            break
          case SensorType.NOISE:
            factors.push(`Excessive noise (${sensor.latestValue} dB)`)
            break
          case SensorType.TEMPERATURE:
            if (sensor.latestValue && sensor.latestValue > 30) {
              factors.push(`High temperature (${sensor.latestValue}°C)`)
            } else if (sensor.latestValue) {
              factors.push(`Low temperature (${sensor.latestValue}°C)`)
            }
            break
          case SensorType.HUMIDITY:
            if (sensor.latestValue && sensor.latestValue > 70) {
              factors.push(`High humidity (${sensor.latestValue}%)`)
            } else if (sensor.latestValue) {
              factors.push(`Low humidity (${sensor.latestValue}%)`)
            }
            break
          case SensorType.LIGHT:
            if (sensor.latestValue && sensor.latestValue < 100) {
              factors.push(`Insufficient lighting (${sensor.latestValue} LUX)`)
            } else if (sensor.latestValue) {
              factors.push(`Excessive brightness (${sensor.latestValue} LUX)`)
            }
            break
        }
      }
    })

    return factors
  }

  static generateRecommendations(sensors: SensorPollutionData[], overallLevel: string): string[] {
    const recommendations: string[] = []
    
    switch (overallLevel) {
      case 'dangerous':
        recommendations.push('⚠️ Immediate evacuation recommended')
        recommendations.push('Contact emergency services if health symptoms occur')
        break
      case 'unhealthy':
        recommendations.push('⚠️ Limit outdoor activities')
        recommendations.push('Use protective equipment if necessary')
        break
      case 'moderate':
        recommendations.push('Monitor conditions closely')
        recommendations.push('Consider reducing prolonged exposure')
        break
      case 'good':
        recommendations.push('✅ Safe environmental conditions')
        break
      default:
        recommendations.push('Install more sensors for better monitoring')
    }
 
    sensors.forEach(sensor => {
      if (sensor.pollutionLevel === 'dangerous' || sensor.pollutionLevel === 'unhealthy') {
        switch (sensor.type) {
          case SensorType.CO2:
            recommendations.push('Improve ventilation in the area')
            break
          case SensorType.AIR_QUALITY:
            recommendations.push('Check for pollution sources nearby')
            recommendations.push('Consider air filtration systems')
            break
          case SensorType.NOISE:
            recommendations.push('Implement noise reduction measures')
            break
          case SensorType.TEMPERATURE:
            recommendations.push('Adjust heating/cooling systems')
            break
          case SensorType.HUMIDITY:
            recommendations.push('Use dehumidifiers or humidifiers as needed')
            break
          case SensorType.LIGHT:
            recommendations.push('Adjust lighting systems for optimal conditions')
            break
        }
      }
    })

    return [...new Set(recommendations)] 
  }

  static calculateRiskScore(sensors: SensorPollutionData[]): number {
    if (sensors.length === 0) return 0

    const activeSensors = sensors.filter(s => s.active && s.pollutionLevel !== 'no-data')
    if (activeSensors.length === 0) return 0

    const baseScores = {
      'good': 5,
      'moderate': 35,
      'unhealthy': 70,
      'dangerous': 95
    }

    let weightedScore = 0
    let totalWeight = 0

    const sensorsByType = activeSensors.reduce((acc, sensor) => {
      const sensorType = sensor.type as keyof typeof acc
      if (!acc[sensorType]) acc[sensorType] = []
      acc[sensorType].push(sensor)
      return acc
    }, {} as Record<SensorType, SensorPollutionData[]>)

    Object.entries(sensorsByType).forEach(([type, typeSensors]) => {
      const sensorType = type as SensorType
      
      let worstLevel: keyof typeof baseScores = 'good'
      let highestScore = 0
      
      typeSensors.forEach(sensor => {
        if (sensor.pollutionLevel === 'no-data') return
        
        const sensorLevel = sensor.pollutionLevel as keyof typeof baseScores
        const currentScore = baseScores[sensorLevel]
        
        if (currentScore > highestScore) {
          highestScore = currentScore
          worstLevel = sensorLevel
        }
      })

      const typeScore = baseScores[worstLevel]
      
      let typeWeight = 1.0
      switch (sensorType) {
        case SensorType.AIR_QUALITY:
        case SensorType.CO2:
          typeWeight = 1.5 
          break
        case SensorType.NOISE:
        case SensorType.TEMPERATURE:
          typeWeight = 1.2 
          break
        case SensorType.HUMIDITY:
        case SensorType.LIGHT:
          typeWeight = 1.0 
          break
      }
      
      const problemSensorsCount = typeSensors.filter(s => 
        s.pollutionLevel === 'unhealthy' || s.pollutionLevel === 'dangerous'
      ).length
      
      if (problemSensorsCount > 1) {
        typeWeight *= 1.2  
      }
      
      weightedScore += typeScore * typeWeight
      totalWeight += typeWeight
    })

    const averageScore = totalWeight > 0 ? weightedScore / totalWeight : 0
    
    const sensorTypeCount = Object.keys(sensorsByType).length
    let diversityMultiplier = 1.0
    
    if (sensorTypeCount >= 4) {  
      const problemTypes = Object.entries(sensorsByType).filter(([, sensors]) =>
        sensors.some(s => s.pollutionLevel === 'unhealthy' || s.pollutionLevel === 'dangerous')
      ).length
      
      if (problemTypes < sensorTypeCount * 0.5) {
        diversityMultiplier = 0.9 
      }
    } else if (sensorTypeCount <= 2) {
      diversityMultiplier = 1.1
    }

    const finalScore = Math.round(averageScore * diversityMultiplier)
    
    return Math.max(0, Math.min(100, finalScore))
  }

  static determineAlertLevel(overallLevel: string, riskScore: number): 'none' | 'low' | 'medium' | 'high' | 'critical' {
  
    if (riskScore >= 90) return 'critical'   
    if (riskScore >= 80) return 'high'  
    if (riskScore >= 60) return 'medium'     
    if (riskScore >= 35) return 'low'     
    
    switch (overallLevel) {
      case 'dangerous':
        return riskScore >= 70 ? 'critical' : 'high'
        
      case 'unhealthy':
        return riskScore >= 50 ? (riskScore >= 80 ? 'critical' : 'high') : 'medium'
        
      case 'moderate':
        return riskScore >= 60 ? 'medium' : 'low'
        
      case 'good':
        return riskScore >= 40 ? 'low' : 'none'
        
      default:
        return 'none'
    }
  }

  static getPollutionColor(level: 'good' | 'moderate' | 'unhealthy' | 'dangerous' | 'no-data'): string {
    switch (level) {
      case 'good': return '#22c55e' 
      case 'moderate': return '#f59e0b' 
      case 'unhealthy': return '#ef4444'
      case 'dangerous': return '#7c2d12' 
      case 'no-data': return '#6b7280'  
      default: return '#6b7280'
    }
  }

  static getPollutionIcon(level: 'good' | 'moderate' | 'unhealthy' | 'dangerous' | 'no-data'): string {
    switch (level) {
      case 'good': return 'solar:shield-check-bold'
      case 'moderate': return 'solar:shield-warning-bold'
      case 'unhealthy': return 'solar:shield-cross-bold'
      case 'dangerous': return 'solar:danger-triangle-bold'
      case 'no-data': return 'solar:question-circle-bold'
      default: return 'solar:question-circle-bold'
    }
  }

  static async analyzeHistoricalShapePollution(
    shapeId: number,
    shapeName: string,
    sensors: any[],
    targetDate: Date
  ): Promise<ShapePollutionAnalysis> {
    console.log(`🔍 Analyzing historical pollution for shape "${shapeName}" at ${targetDate.toISOString()}`)

    const sensorPollutionData: SensorPollutionData[] = sensors.map(sensor => {
      let pollutionLevel: 'good' | 'moderate' | 'unhealthy' | 'dangerous' | 'no-data' = 'no-data'
      let latestValue: number | undefined
      let unit: SensorUnit | undefined
      let timestamp: Date | undefined

      if (sensor.currentReading && typeof sensor.currentReading.value === 'number') {
        const readingValue = sensor.currentReading.value
        latestValue = readingValue
        unit = sensor.currentReading.unit
        timestamp = new Date(sensor.currentReading.timestamp)
        
        pollutionLevel = PollutionAnalysisService.calculatePollutionLevel(sensor.type, readingValue)
      }

      return {
        sensorId: sensor.id,
        sensorName: sensor.sensorId,
        type: sensor.type,
        latestValue,
        unit,
        pollutionLevel,
        timestamp,
        active: sensor.active
      }
    })

    const overallPollutionLevel = PollutionAnalysisService.calculateOverallPollutionLevel(sensorPollutionData)
    const pollutionFactors = PollutionAnalysisService.identifyPollutionFactors(sensorPollutionData)
    const riskScore = PollutionAnalysisService.calculateRiskScore(sensorPollutionData)
    const recommendations = PollutionAnalysisService.generateRecommendations(sensorPollutionData, overallPollutionLevel)
    const alertLevel = PollutionAnalysisService.determineAlertLevel(overallPollutionLevel, riskScore)

    console.log(`📊 Historical analysis complete for "${shapeName}": ${overallPollutionLevel} (Risk: ${riskScore})`)

    return {
      shapeId,
      shapeName,
      overallPollutionLevel,
      sensors: sensorPollutionData,
      pollutionFactors,
      riskScore,
      recommendations: [
        `Historical data from ${targetDate.toLocaleDateString()} at ${targetDate.toLocaleTimeString()}`,
        ...recommendations
      ],
      alertLevel
    }
  }
}