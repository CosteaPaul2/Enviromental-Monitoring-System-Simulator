import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { Icon } from '@iconify/react'

export interface NotificationData {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message: string
  icon?: string
  duration?: number
  persistent?: boolean
}

interface NotificationContextType {
  notifications: NotificationData[]
  addNotification: (notification: Omit<NotificationData, 'id'>) => void
  removeNotification: (id: string) => void
  clearAllNotifications: () => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export const useNotifications = () => {
  const context = useContext(NotificationContext)
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}

interface NotificationProviderProps {
  children: ReactNode
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<NotificationData[]>([])

  const addNotification = useCallback((notification: Omit<NotificationData, 'id'>) => {
    const id = `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const newNotification: NotificationData = {
      ...notification,
      id,
      duration: notification.duration ?? 5000,
      persistent: notification.persistent ?? false
    }

    setNotifications(prev => [...prev, newNotification])

    // Auto remove if not persistent
    if (!newNotification.persistent && newNotification.duration! > 0) {
      setTimeout(() => {
        removeNotification(id)
      }, newNotification.duration)
    }
  }, [])

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }, [])

  const clearAllNotifications = useCallback(() => {
    setNotifications([])
  }, [])

  return (
    <NotificationContext.Provider value={{
      notifications,
      addNotification,
      removeNotification,
      clearAllNotifications
    }}>
      {children}
      <NotificationContainer 
        notifications={notifications}
        onRemove={removeNotification}
      />
    </NotificationContext.Provider>
  )
}

interface NotificationContainerProps {
  notifications: NotificationData[]
  onRemove: (id: string) => void
}

const NotificationContainer: React.FC<NotificationContainerProps> = ({ notifications, onRemove }) => {
  if (notifications.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 max-w-sm sm:max-w-md">
      {notifications.map((notification) => (
        <NotificationToast
          key={notification.id}
          notification={notification}
          onRemove={() => onRemove(notification.id)}
        />
      ))}
    </div>
  )
}

interface NotificationToastProps {
  notification: NotificationData
  onRemove: () => void
}

const NotificationToast: React.FC<NotificationToastProps> = ({ notification, onRemove }) => {
  const getTypeStyles = (type: NotificationData['type']) => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-success/15 dark:bg-success/10',
          border: 'border-success/30 dark:border-success/20',
          icon: 'text-success-600 dark:text-success-400',
          text: 'text-success-700 dark:text-success-300',
          gradient: 'from-success/5 to-success/15 dark:from-success/5 dark:to-success/10'
        }
      case 'error':
        return {
          bg: 'bg-danger/15 dark:bg-danger/10',
          border: 'border-danger/30 dark:border-danger/20',
          icon: 'text-danger-600 dark:text-danger-400',
          text: 'text-danger-700 dark:text-danger-300',
          gradient: 'from-danger/5 to-danger/15 dark:from-danger/5 dark:to-danger/10'
        }
      case 'warning':
        return {
          bg: 'bg-warning/15 dark:bg-warning/10',
          border: 'border-warning/30 dark:border-warning/20',
          icon: 'text-warning-600 dark:text-warning-400',
          text: 'text-warning-700 dark:text-warning-300',
          gradient: 'from-warning/5 to-warning/15 dark:from-warning/5 dark:to-warning/10'
        }
      case 'info':
        return {
          bg: 'bg-primary/15 dark:bg-primary/10',
          border: 'border-primary/30 dark:border-primary/20',
          icon: 'text-primary-600 dark:text-primary-400',
          text: 'text-primary-700 dark:text-primary-300',
          gradient: 'from-primary/5 to-primary/15 dark:from-primary/5 dark:to-primary/10'
        }
      default:
        return {
          bg: 'bg-content2/80 dark:bg-content1/50',
          border: 'border-divider/50 dark:border-divider/30',
          icon: 'text-default-600 dark:text-default-400',
          text: 'text-default-700 dark:text-default-300',
          gradient: 'from-content2/30 to-content2/60 dark:from-content1/20 dark:to-content1/40'
        }
    }
  }

  const getDefaultIcon = (type: NotificationData['type']) => {
    switch (type) {
      case 'success':
        return 'tabler:check-circle'
      case 'error':
        return 'tabler:x-circle'
      case 'warning':
        return 'tabler:alert-triangle'
      case 'info':
        return 'tabler:info-circle'
      default:
        return 'tabler:bell'
    }
  }

  const styles = getTypeStyles(notification.type)
  const iconName = notification.icon || getDefaultIcon(notification.type)

  return (
    <div className={`
      animate-in slide-in-from-right duration-300 ease-out
      backdrop-blur-xl backdrop-saturate-200
      bg-gradient-to-br ${styles.gradient}
      border ${styles.border}
      rounded-2xl shadow-2xl shadow-black/5 dark:shadow-black/20
      p-4 min-w-[320px] max-w-sm
      ring-1 ring-white/10 dark:ring-white/5
      hover:shadow-3xl hover:scale-[1.02] transition-all duration-200
    `}>
      <div className="flex items-start gap-3">
        <div className={`
          flex-shrink-0 p-2 rounded-xl ${styles.bg} border ${styles.border}
          ${styles.icon} shadow-sm
        `}>
          <Icon icon={iconName} className="text-lg" />
        </div>
        
        <div className="flex-1 min-w-0">
          <h4 className={`font-semibold text-sm ${styles.text} leading-tight`}>
            {notification.title}
          </h4>
          <p className="text-xs text-foreground/75 dark:text-foreground/70 mt-1.5 leading-relaxed">
            {notification.message}
          </p>
        </div>

        <button
          onClick={onRemove}
          className="
            flex-shrink-0 p-1.5 rounded-lg
            text-foreground/50 hover:text-foreground/80 dark:text-foreground/40 dark:hover:text-foreground/70
            hover:bg-content2/50 dark:hover:bg-content1/30
            transition-all duration-150 ease-out
            focus:outline-none focus:ring-2 focus:ring-primary/30
          "
        >
          <Icon icon="tabler:x" className="text-sm" />
        </button>
      </div>
      
      {/* Progress bar for timed notifications */}
      {!notification.persistent && notification.duration && notification.duration > 0 && (
        <div className="mt-3 h-1 bg-foreground/10 dark:bg-foreground/5 rounded-full overflow-hidden">
          <div 
            className={`h-full ${styles.bg} rounded-full animate-shrink-width`}
            style={{ 
              animationDuration: `${notification.duration}ms`,
              animationTimingFunction: 'linear',
              animationFillMode: 'forwards'
            }}
          />
        </div>
      )}
    </div>
  )
}

// Helper hooks for common notification patterns
export const useSuccessNotification = () => {
  const { addNotification } = useNotifications()
  return useCallback((title: string, message: string, options?: Partial<NotificationData>) => {
    addNotification({ type: 'success', title, message, ...options })
  }, [addNotification])
}

export const useErrorNotification = () => {
  const { addNotification } = useNotifications()
  return useCallback((title: string, message: string, options?: Partial<NotificationData>) => {
    addNotification({ type: 'error', title, message, ...options })
  }, [addNotification])
}

export const useWarningNotification = () => {
  const { addNotification } = useNotifications()
  return useCallback((title: string, message: string, options?: Partial<NotificationData>) => {
    addNotification({ type: 'warning', title, message, ...options })
  }, [addNotification])
}

export const useInfoNotification = () => {
  const { addNotification } = useNotifications()
  return useCallback((title: string, message: string, options?: Partial<NotificationData>) => {
    addNotification({ type: 'info', title, message, ...options })
  }, [addNotification])
}

// Pollution-specific notification helper
export const usePollutionNotification = () => {
  const { addNotification } = useNotifications()
  
  return useCallback((level: 'good' | 'moderate' | 'unhealthy' | 'dangerous', area: string, details: string, options?: Partial<NotificationData>) => {
    // Only show notifications for dangerous conditions
    // This prevents notification spam for minor pollution changes
    if (level !== 'dangerous' && level !== 'unhealthy') {
      return
    }
    
    const typeMap = {
      'good': 'success' as const,
      'moderate': 'warning' as const,
      'unhealthy': 'warning' as const,
      'dangerous': 'error' as const
    }
    
    const iconMap = {
      'good': 'tabler:shield-check',
      'moderate': 'tabler:shield-exclamation', 
      'unhealthy': 'tabler:shield-x',
      'dangerous': 'tabler:alert-triangle'
    }

    const titleMap = {
      'good': `✅ Good Air Quality`,
      'moderate': `⚠️ Moderate Pollution`,
      'unhealthy': `🔶 Unhealthy Conditions`,
      'dangerous': `🚨 Critical Pollution Alert`
    }

    addNotification({
      type: typeMap[level],
      title: titleMap[level],
      message: `${area}: ${details}`,
      icon: iconMap[level],
      persistent: level === 'dangerous',
      duration: level === 'dangerous' ? 0 : 10000, // Longer duration for serious alerts
      ...options
    })
  }, [addNotification])
}