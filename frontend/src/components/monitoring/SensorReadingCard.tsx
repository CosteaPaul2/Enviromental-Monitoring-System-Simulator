import { Card, CardBody } from '@heroui/card';
import { Chip } from '@heroui/chip';
import { Icon } from '@iconify/react';
import { motion } from 'framer-motion';

interface SensorReading {
  id: number;
  value: number;
  unit: string;
  timestamp: string;
}

interface Sensor {
  id: number;
  sensorId: string;
  type: string;
  active: boolean;
  location?: { lat: number; lng: number };
}

interface SensorReadingCardProps {
  sensor: Sensor;
  reading?: SensorReading;
  compact?: boolean;
}

export function SensorReadingCard({ sensor, reading, compact = false }: SensorReadingCardProps) {
  const getTypeInfo = (type: string) => {
    switch (type) {
      case 'TEMPERATURE':
        return {
          icon: 'tabler:temperature',
          color: '#ef4444',
          unit: '°C',
          label: 'Temperature'
        };
      case 'HUMIDITY':
        return {
          icon: 'tabler:droplet',
          color: '#3b82f6',
          unit: '%',
          label: 'Humidity'
        };
      case 'AIR_QUALITY':
        return {
          icon: 'tabler:wind',
          color: '#10b981',
          unit: 'AQI',
          label: 'Air Quality'
        };
      case 'NOISE':
        return {
          icon: 'tabler:volume-2',
          color: '#f59e0b',
          unit: 'dB',
          label: 'Noise Level'
        };
      case 'LIGHT':
        return {
          icon: 'tabler:sun',
          color: '#f97316',
          unit: 'lux',
          label: 'Light'
        };
      case 'CO2':
        return {
          icon: 'tabler:alert-triangle',
          color: '#8b5cf6',
          unit: 'ppm',
          label: 'CO₂'
        };
      default:
        return {
          icon: 'tabler:layout-dashboard',
          color: '#6b7280',
          unit: '',
          label: type
        };
    }
  };

  const typeInfo = getTypeInfo(sensor.type);
  
  const getStatusColor = (value?: number, type?: string): 'success' | 'warning' | 'danger' | 'default' => {
    if (!value || !type) return 'default';
    
    switch (type) {
      case 'TEMPERATURE':
        if (value < 10 || value > 30) return 'danger';
        if (value < 15 || value > 25) return 'warning';
        return 'success';
      case 'HUMIDITY':
        if (value < 30 || value > 70) return 'danger';
        if (value < 40 || value > 60) return 'warning';
        return 'success';
      case 'AIR_QUALITY':
        if (value > 100) return 'danger';
        if (value > 50) return 'warning';
        return 'success';
      case 'CO2':
        if (value > 1000) return 'danger';
        if (value > 600) return 'warning';
        return 'success';
      default:
        return 'default';
    }
  };

  const statusColor = getStatusColor(reading?.value, sensor.type);
  const timeAgo = reading ? new Date(reading.timestamp).toLocaleTimeString() : 'No data';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className={`w-full ${compact ? 'h-24' : 'h-32'} ${!sensor.active ? 'opacity-60' : ''}`}>
        <CardBody className="p-4">
          <div className="flex items-center justify-between h-full">
            <div className="flex items-center gap-3">
              <div 
                className="p-2 rounded-lg flex-shrink-0"
                style={{ backgroundColor: `${typeInfo.color}20` }}
              >
                <Icon 
                  icon={typeInfo.icon} 
                  className="text-xl"
                  style={{ color: typeInfo.color }}
                />
              </div>
              
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className={`font-semibold truncate ${compact ? 'text-sm' : 'text-base'}`}>
                    {typeInfo.label}
                  </h3>
                  <Chip 
                    size="sm" 
                    color={sensor.active ? 'success' : 'default'}
                    variant="flat"
                    className={compact ? 'scale-75' : ''}
                  >
                    {sensor.active ? 'Active' : 'Inactive'}
                  </Chip>
                </div>
                
                <p className="text-xs text-default-500 truncate">
                  ID: {sensor.sensorId}
                </p>
                
                {!compact && (
                  <p className="text-xs text-default-400 mt-1">
                    {timeAgo}
                  </p>
                )}
              </div>
            </div>
            
            <div className="text-right flex-shrink-0">
              {reading ? (
                <>
                  <div className={`font-bold ${compact ? 'text-lg' : 'text-2xl'} mb-1`}>
                    {reading.value.toFixed(1)}
                  </div>
                  <div className="flex items-center gap-1 justify-end">
                    <span className={`text-xs ${compact ? 'text-xs' : 'text-sm'} text-default-500`}>
                      {typeInfo.unit}
                    </span>
                    <Chip 
                      size="sm" 
                      color={statusColor}
                      variant="dot"
                      className={compact ? 'scale-75' : ''}
                    />
                  </div>
                </>
              ) : (
                <div className="text-center">
                  <Icon icon="tabler:alert-triangle" className="text-warning text-xl mb-1" />
                  <p className="text-xs text-default-500">No data</p>
                </div>
              )}
            </div>
          </div>
        </CardBody>
      </Card>
    </motion.div>
  );
}