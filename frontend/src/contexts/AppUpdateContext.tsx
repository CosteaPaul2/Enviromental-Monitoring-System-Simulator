import { createContext, useContext, useState, ReactNode } from 'react'

interface AppUpdateContextType {
  // Triggers for different types of updates
  sensorUpdateTrigger: number
  shapeUpdateTrigger: number
  
  // Functions to trigger updates
  triggerSensorUpdate: () => void
  triggerShapeUpdate: () => void
  triggerAllUpdates: () => void
}

const AppUpdateContext = createContext<AppUpdateContextType | undefined>(undefined)

interface AppUpdateProviderProps {
  children: ReactNode
}

export function AppUpdateProvider({ children }: AppUpdateProviderProps) {
  const [sensorUpdateTrigger, setSensorUpdateTrigger] = useState(0)
  const [shapeUpdateTrigger, setShapeUpdateTrigger] = useState(0)

  const triggerSensorUpdate = () => {
    setSensorUpdateTrigger(prev => prev + 1)
    console.log('🔄 Triggered sensor update')
  }

  const triggerShapeUpdate = () => {
    setShapeUpdateTrigger(prev => prev + 1)
    console.log('🔄 Triggered shape update')
  }

  const triggerAllUpdates = () => {
    setSensorUpdateTrigger(prev => prev + 1)
    setShapeUpdateTrigger(prev => prev + 1)
    console.log('🔄 Triggered all updates')
  }

  const value: AppUpdateContextType = {
    sensorUpdateTrigger,
    shapeUpdateTrigger,
    triggerSensorUpdate,
    triggerShapeUpdate,
    triggerAllUpdates
  }

  return (
    <AppUpdateContext.Provider value={value}>
      {children}
    </AppUpdateContext.Provider>
  )
}

export function useAppUpdates() {
  const context = useContext(AppUpdateContext)
  if (context === undefined) {
    throw new Error('useAppUpdates must be used within an AppUpdateProvider')
  }
  return context
}