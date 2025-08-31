export enum SensorType {
  TEMPERATURE = 'TEMPERATURE',
  HUMIDITY = 'HUMIDITY',
  AIR_QUALITY = 'AIR_QUALITY',
  LIGHT = 'LIGHT',
  NOISE = 'NOISE',
  CO2 = 'CO2'
}

export enum SensorUnit {
  CELSIUS = 'CELSIUS',
  FAHRENHEIT = 'FAHRENHEIT',
  RH_PERCENTAGE = 'RH_PERCENTAGE',
  PPM = 'PPM',
  LUX = 'LUX',
  DB = 'DB'
}

export interface SensorReading {
  value: number
  unit: SensorUnit
  timestamp: Date
}

export interface SensorConfig {
  baseValue: number
  variance: number
  min: number
  max: number
  unit: SensorUnit
  updateInterval: number
  drift: number
}

export default class SensorDataGenerator {
  private static readonly SENSOR_CONFIGS: Record<SensorType, SensorConfig> = {
    [SensorType.TEMPERATURE]: {
      baseValue: 22.5,  
      variance: 10.0,   
      min: 5,         
      max: 45,    
      unit: SensorUnit.CELSIUS,
      updateInterval: 5000,
      drift: 0.1 
    },
    [SensorType.HUMIDITY]: {
      baseValue: 50,   
      variance: 30,  
      min: 10,        
      max: 95,       
      unit: SensorUnit.RH_PERCENTAGE,
      updateInterval: 8000,
      drift: 0.15   
    },
    [SensorType.AIR_QUALITY]: {
      baseValue: 100,   
      variance: 150,   
      min: 0,         
      max: 500,      
      unit: SensorUnit.PPM,
      updateInterval: 10000,
      drift: 3.0      
    },
    [SensorType.LIGHT]: {
      baseValue: 500,  
      variance: 400,   
      min: 0,           
      max: 2000,     
      unit: SensorUnit.LUX,
      updateInterval: 7000,
      drift: 5.0     
    },
    [SensorType.NOISE]: {
      baseValue: 50,    
      variance: 25,     
      min: 20,         
      max: 110,       
      unit: SensorUnit.DB,
      updateInterval: 6000,
      drift: 0.8      
    },
    [SensorType.CO2]: {
      baseValue: 600,  
      variance: 500,    
      min: 300,        
      max: 2500,     
      unit: SensorUnit.PPM,
      updateInterval: 12000,
      drift: 10.0     
    }
  }

  private static sensorStates: Map<string, { lastValue: number; trend: number; pollutionScenario?: string }> = new Map()

  static generateReading(sensorType: SensorType, sensorId: string): SensorReading {
    const config = this.SENSOR_CONFIGS[sensorType]
    const sensorKey = `${sensorType}_${sensorId}`
    
    let state = this.sensorStates.get(sensorKey)
    if (!state) {
   
      const scenarios = ['clean', 'clean', 'moderate', 'moderate', 'moderate', 'polluted', 'critical']
      const scenario = scenarios[Math.floor(Math.random() * scenarios.length)]
      
      let initialValue = config.baseValue
      
  
      switch (scenario) {
        case 'clean':
          initialValue = config.min + (config.baseValue - config.min) * (0.2 + Math.random() * 0.3)
          break
        case 'moderate': 
          initialValue = config.min + (config.max - config.min) * (0.3 + Math.random() * 0.4)
          break
        case 'polluted':
          initialValue = config.min + (config.max - config.min) * (0.6 + Math.random() * 0.25)
          break
        case 'critical':
          initialValue = config.min + (config.max - config.min) * (0.8 + Math.random() * 0.2)
          break
      }
      
      state = {
        lastValue: initialValue,
        trend: (Math.random() - 0.5) * 0.3,  
        pollutionScenario: scenario
      }
      this.sensorStates.set(sensorKey, state)
    }
    
    if (Math.random() < 0.02) {
      const scenarios = ['clean', 'clean', 'moderate', 'moderate', 'polluted', 'critical']
      const newScenario = scenarios[Math.floor(Math.random() * scenarios.length)]
      if (newScenario !== state.pollutionScenario) {
        state.pollutionScenario = newScenario
      }
    }
    
    const timeOfDay = new Date().getHours()
    let timeModifier = 0

    switch (sensorType) {
      case SensorType.TEMPERATURE:
        timeModifier = Math.sin((timeOfDay - 6) * Math.PI / 12) * 5  
        break
      case SensorType.LIGHT:
        timeModifier = timeOfDay >= 6 && timeOfDay <= 18 
          ? Math.sin((timeOfDay - 6) * Math.PI / 12) * 300  
          : 0
        break
      case SensorType.NOISE:
        timeModifier = timeOfDay >= 7 && timeOfDay <= 22 ? 15 : -10 
        break
      case SensorType.CO2:
        timeModifier = timeOfDay >= 8 && timeOfDay <= 18 ? 200 : -100  
        break
      case SensorType.AIR_QUALITY:
        timeModifier = timeOfDay >= 7 && timeOfDay <= 9 || timeOfDay >= 17 && timeOfDay <= 19 ? 50 : 0
        break
      case SensorType.HUMIDITY:
        timeModifier = Math.sin((timeOfDay - 3) * Math.PI / 12) * 8 
        break
    }
    let pollutionEvent = 0
    if (Math.random() < 0.05) {
      const eventIntensity = Math.random() * 0.5 + 0.5 
      pollutionEvent = config.variance * eventIntensity * (Math.random() > 0.5 ? 1 : -1)
    }

    const trendChange = (Math.random() - 0.5) * 0.1 
    state.trend = Math.max(-0.4, Math.min(0.4, state.trend + trendChange))
    
    const randomVariation = (Math.random() - 0.5) * config.variance * 0.6  
    const drift = config.drift * state.trend
    
    let newValue = state.lastValue + drift + randomVariation + timeModifier * 0.2 + pollutionEvent  
    switch (state.pollutionScenario) {
      case 'clean':
        if (newValue > config.min + (config.max - config.min) * 0.6) {
          newValue *= 0.85 
        }
        break
      case 'moderate':
        if (newValue < config.min + (config.max - config.min) * 0.2) {
          newValue *= 1.15  
        } else if (newValue > config.min + (config.max - config.min) * 0.8) {
          newValue *= 0.95 
        }
        break
      case 'polluted':
        if (newValue < config.min + (config.max - config.min) * 0.4) {
          newValue *= 1.25 
        }
        break
      case 'critical':
        if (newValue < config.min + (config.max - config.min) * 0.6) {
          newValue *= 1.3 
        }
        break
    }
    
    newValue = Math.max(config.min, Math.min(config.max, newValue))
    
    state.lastValue = newValue
    
    return {
      value: Math.round(newValue * 100) / 100,
      unit: config.unit,
      timestamp: new Date()
    }
  }

  static getUpdateInterval(sensorType: SensorType): number {
    return this.SENSOR_CONFIGS[sensorType].updateInterval
  }

  static getSensorConfig(sensorType: SensorType): SensorConfig {
    return this.SENSOR_CONFIGS[sensorType]
  }

  static resetSensorState(sensorId: string): void {
    for (const key of this.sensorStates.keys()) {
      if (key.endsWith(`_${sensorId}`)) {
        this.sensorStates.delete(key)
      }
    }
  }

  static getAllSensorStates(): Map<string, { lastValue: number; trend: number; pollutionScenario?: string }> {
    return new Map(this.sensorStates)
  }

  static generateBatchReadings(sensorType: SensorType, sensorId: string, count: number): SensorReading[] {
    const readings: SensorReading[] = []
    const interval = this.getUpdateInterval(sensorType)
    
    for (let i = 0; i < count; i++) {
      const reading = this.generateReading(sensorType, sensorId)
      reading.timestamp = new Date(Date.now() - (count - i) * interval)
      readings.push(reading)
    }
    
    return readings
  }
} 