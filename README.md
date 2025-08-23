# Environmental Monitoring System

Real-time environmental monitoring with interactive maps and sensor data.

## Features

- Real-time sensor monitoring (Temperature, Humidity, Air Quality, Light, Noise, CO2)
- Interactive maps with drawing tools
- Geospatial analysis (union, intersection, buffer zones)
- Historical data with time-travel
- Admin dashboard
- User authentication

## Tech Stack

**Frontend:** React, TypeScript, Vite, Leaflet, Turf.js  
**Backend:** AdonisJS, Prisma, Redis 
**Database:** PostgreSQL, PostGIS

## Setup

1. **Clone:**
```bash
git clone <repo-url>
cd environmental-monitoring-system
```

2. **Backend:**
```bash
cd backend
docker-compose up -d  # Database
pnpm install
pnpm dev
```

3. **Frontend:**
```bash
cd frontend  
pnpm install
pnpm dev
```

Visit `http://localhost:5173`


##  API Documentation

### **Authentication Endpoints**
```http
POST   /auth/register     # User registration
POST   /auth/login        # User login
POST   /auth/logout       # User logout
GET    /auth/me          # Get current user
```

### **Sensor Management**
```http
GET    /sensors          # List user sensors
POST   /sensors          # Create new sensor
PATCH  /sensors/:id/toggle     # Toggle sensor status
PUT    /sensors/:id/location   # Update sensor location
GET    /sensors/:id/readings   # Get sensor readings
```

### **Geospatial Operations**
```http
GET    /shapes           # List user shapes
POST   /shapes           # Create monitoring zone
GET    /shapes/sensors-in-shape  # Sensors within area
GET    /pollution/analyze       # Pollution analysis
```

### **Admin Operations**
```http
GET    /admin/dashboard-stats   # System statistics
GET    /admin/users            # User management
GET    /admin/sensors          # All sensors
GET    /admin/analytics        # System analytics
```

##  Database Schema

### **Core Entities**

```sql
-- Users with role-based access
Users {
  id: UUID (Primary Key)
  email: String (Unique)
  name: String
  password: String (Hashed)
  role: Enum [USER, ADMIN]
  createdAt: DateTime
}

-- Sensors with geospatial location
Sensors {
  id: UUID (Primary Key)
  sensorId: String (Unique)
  name: String
  type: Enum [TEMPERATURE, HUMIDITY, AIR_QUALITY, LIGHT, NOISE, CO2]
  location: Geometry (PostGIS Point)
  isActive: Boolean
  userId: UUID (Foreign Key)
}

-- Time-series sensor data
SensorReadings {
  id: UUID (Primary Key)
  value: Float
  unit: Enum [CELSIUS, RH_PERCENTAGE, PPM, LUX, DB]
  timestamp: DateTime
  sensorId: UUID (Foreign Key)
}

-- Monitoring zones and shapes
Shapes {
  id: UUID (Primary Key)
  name: String
  type: Enum [CIRCLE, RECTANGLE, POLYGON]
  geometry: Geometry (PostGIS)
  userId: UUID (Foreign Key)
}
```

##  Key Components

### ** Interactive Map System**
```typescript
// Real-time map with drawing capabilities
<Map
  selectedTool="polygon"
  onShapeCreated={handleShapeCreated}
  savedShapes={shapes}
  showSensors={true}
  clientZones={geometryResults}
/>
```

### ** Geometry Operations**
```typescript
// Advanced geospatial analysis
const result = performGeometryOperation('intersection', [zone1, zone2]);
// Returns: intersection area with environmental analysis
```

### ** Real-Time Pollution Monitoring**
```typescript
// Smart pollution alerts
const { alerts, stats } = usePollutionMonitor({
  refreshInterval: 20000, // 20 seconds
  alertThreshold: 'moderate'
});
```

### ** Sensor Data Management**
```typescript
// Live sensor data with WebSocket
const { sensorData, isLoading } = useSensorData(sensorId, {
  realTime: true,
  historical: true
});
```

### **Environment Variables**
```bash
# Backend (.env)
DATABASE_URL="postgresql://user:pass@host:5432/dbname"
REDIS_URL="redis://localhost:6379"
CORS_ORIGIN="https://your-frontend-domain.com"

# Frontend (.env)
VITE_API_URL="https://your-api-domain.com"
```

### **Development Setup**
```bash
# Install all dependencies
pnpm install --recursive

# Start all services in development
pnpm dev:all

# Run linting and type checking
pnpm lint && pnpm typecheck
```
<div align="center">

</div>
