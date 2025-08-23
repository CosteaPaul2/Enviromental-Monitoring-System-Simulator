# 🌍 Environmental Monitoring System

> A comprehensive real-time environmental monitoring platform with advanced geospatial analysis capabilities

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![AdonisJS](https://img.shields.io/badge/AdonisJS-220052?style=for-the-badge&logo=adonisjs&logoColor=white)](https://adonisjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white)](https://redis.io/)

## 📋 Table of Contents

- [✨ Features](#-features)
- [🏗️ Architecture](#️-architecture)
- [🚀 Quick Start](#-quick-start)
- [🛠️ Tech Stack](#️-tech-stack)
- [📁 Project Structure](#-project-structure)
- [🌐 API Documentation](#-api-documentation)
- [🗃️ Database Schema](#️-database-schema)
- [🎯 Key Components](#-key-components)
- [🧪 Testing](#-testing)
- [🚀 Deployment](#-deployment)
- [📈 Performance](#-performance)
- [🤝 Contributing](#-contributing)
- [📄 License](#-license)

## ✨ Features

### 🔥 **Real-Time Monitoring**
- **Live sensor data streaming** via Redis pub/sub
- **Interactive maps** with real-time pollution visualization
- **Smart notifications** with intelligent alert filtering
- **Historical data analysis** with time-travel capabilities

### 🗺️ **Advanced Geospatial Analysis**
- **Interactive drawing tools** (circles, rectangles, polygons)
- **Geometric operations** (union, intersection, buffer zones, containment)
- **Population impact analysis** with affected area calculations
- **Regulatory compliance checking** for environmental standards

### 📊 **Environmental Intelligence**
- **Multi-sensor support** (Temperature, Humidity, Air Quality, Light, Noise, CO2)
- **Pollution risk scoring** with severity classification
- **Environmental compliance monitoring**
- **Comprehensive analytics dashboard**

### 👥 **Multi-Tenant Architecture**
- **Role-based access control** (User/Admin)
- **User isolation** with secure data segregation
- **Admin dashboard** for system-wide management
- **JWT-based authentication** with token management

### 🎨 **Modern UI/UX**
- **Responsive design** with mobile support
- **Dark/Light theme support**
- **Smooth animations** with Framer Motion
- **Intuitive map interactions**
- **Real-time status indicators**

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   Database      │
│   React + Vite  │◄──►│  AdonisJS API   │◄──►│ PostgreSQL +    │
│   Leaflet Maps  │    │  Redis Pub/Sub  │    │    PostGIS      │
│   TanStack Query│    │  JWT Auth       │    │    Redis        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### **Data Flow**
1. **Sensors** → **Backend API** → **Database Storage**
2. **Real-time events** → **Redis** → **WebSocket** → **Frontend**
3. **Geospatial queries** → **PostGIS** → **Map Visualization**
4. **User interactions** → **API calls** → **Database updates**

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18+ 
- **PostgreSQL** 14+ with PostGIS extension
- **Redis** 6+
- **pnpm** (recommended) or npm

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/environmental-monitoring-system.git
cd environmental-monitoring-system
```

### 2. Database Setup
```bash
# Start PostgreSQL and Redis with Docker
cd backend
docker-compose up -d

# Run database migrations
pnpm prisma migrate deploy
pnpm prisma generate
```

### 3. Backend Setup
```bash
cd backend
pnpm install

# Configure environment variables
cp .env.example .env
# Edit .env with your database and Redis credentials

# Start the API server
pnpm dev
```

### 4. Frontend Setup
```bash
cd frontend
pnpm install

# Start the development server
pnpm dev
```

### 5. Sensor Simulator (Optional)
```bash
cd sensor-simulator
pnpm install
pnpm dev
```

🎉 **Visit http://localhost:5173 to see your Environmental Monitoring System!**

## 🛠️ Tech Stack

### **Frontend**
| Technology | Purpose | Version |
|------------|---------|---------|
| **React** | UI Framework | 18.x |
| **TypeScript** | Type Safety | 5.x |
| **Vite** | Build Tool | 5.x |
| **TailwindCSS** | Styling | 4.x |
| **HeroUI** | UI Components | 2.x |
| **Leaflet** | Interactive Maps | 1.9.x |
| **Turf.js** | Geospatial Analysis | 7.x |
| **TanStack Query** | Server State | 5.x |
| **Framer Motion** | Animations | 11.x |
| **Recharts** | Data Visualization | 3.x |

### **Backend**
| Technology | Purpose | Version |
|------------|---------|---------|
| **AdonisJS** | Node.js Framework | 6.x |
| **TypeScript** | Type Safety | 5.x |
| **Prisma** | Database ORM | 5.x |
| **PostgreSQL** | Primary Database | 14+ |
| **PostGIS** | Geospatial Extension | 3.x |
| **Redis** | Caching & Pub/Sub | 6+ |
| **Bcrypt** | Password Hashing | - |
| **JWT** | Authentication | - |

### **DevOps & Tools**
- **Docker** - Containerization
- **ESLint & Prettier** - Code Quality
- **Vercel** - Frontend Deployment
- **GitHub Actions** - CI/CD (ready)

## 📁 Project Structure

```
environmental-monitoring-system/
├── 🎨 frontend/                 # React application
│   ├── src/
│   │   ├── components/          # Reusable UI components
│   │   │   ├── Map.tsx         # Interactive Leaflet map
│   │   │   ├── SensorPanel.tsx # Sensor management
│   │   │   └── monitoring/     # Real-time monitoring
│   │   ├── contexts/           # React contexts
│   │   │   ├── AuthContext.tsx # Authentication
│   │   │   └── HistoricalDataContext.tsx
│   │   ├── hooks/              # Custom React hooks
│   │   │   ├── useSensorData.ts
│   │   │   └── usePollutionMonitor.ts
│   │   ├── lib/                # Utilities & API
│   │   │   ├── sensorsApi.ts   # API integration
│   │   │   └── simpleTurfGeometry.ts # Geospatial ops
│   │   ├── pages/              # Application pages
│   │   └── types/              # TypeScript definitions
├── 🔧 backend/                  # AdonisJS API server
│   ├── app/
│   │   ├── controllers/        # HTTP request handlers
│   │   ├── services/           # Business logic
│   │   │   ├── auth_service.ts
│   │   │   ├── sensor_service.ts
│   │   │   └── pollution_analysis_service.ts
│   │   └── middleware/         # Request middleware
│   ├── prisma/
│   │   ├── schema.prisma       # Database schema
│   │   └── migrations/         # DB migrations
│   └── start/                  # App configuration
├── 📡 sensor-simulator/         # Development tool
└── 📋 docs/                    # Documentation
```

## 🌐 API Documentation

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

## 🗃️ Database Schema

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

-- IoT Sensors with geospatial location
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
  unit: Enum [CELSIUS, FAHRENHEIT, RH_PERCENTAGE, PPM, LUX, DB]
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

## 🎯 Key Components

### **🗺️ Interactive Map System**
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

### **📊 Geometry Operations**
```typescript
// Advanced geospatial analysis
const result = performGeometryOperation('intersection', [zone1, zone2]);
// Returns: intersection area with environmental analysis
```

### **🔴 Real-Time Pollution Monitoring**
```typescript
// Smart pollution alerts
const { alerts, stats } = usePollutionMonitor({
  refreshInterval: 20000, // 20 seconds
  alertThreshold: 'moderate'
});
```

### **📡 Sensor Data Management**
```typescript
// Live sensor data with WebSocket
const { sensorData, isLoading } = useSensorData(sensorId, {
  realTime: true,
  historical: true
});
```

## 🧪 Testing

### **Run Tests**
```bash
# Backend tests
cd backend && pnpm test

# Frontend tests (when available)
cd frontend && pnpm test

# Type checking
pnpm run typecheck
```

### **Test Coverage**
- ✅ **API endpoints** - Authentication, sensors, shapes
- ✅ **Database operations** - CRUD, geospatial queries
- ✅ **Business logic** - Pollution analysis, geometry ops
- 🔄 **Frontend components** - Coming soon

## 🚀 Deployment

### **Production Build**
```bash
# Build frontend
cd frontend && pnpm build

# Build backend
cd backend && pnpm build

# Database migration
cd backend && pnpm prisma migrate deploy
```

### **Environment Variables**
```bash
# Backend (.env)
DATABASE_URL="postgresql://user:pass@host:5432/dbname"
REDIS_URL="redis://localhost:6379"
JWT_SECRET="your-secret-key"
CORS_ORIGIN="https://your-frontend-domain.com"

# Frontend (.env)
VITE_API_URL="https://your-api-domain.com"
```

### **Deployment Options**
- **Frontend**: Vercel, Netlify, AWS S3 + CloudFront
- **Backend**: Railway, Render, AWS ECS, DigitalOcean
- **Database**: Railway, Supabase, AWS RDS, DigitalOcean

## 📈 Performance

### **Optimization Features**
- ✅ **Database indexing** on geospatial queries (GIST indexes)
- ✅ **Redis caching** for frequently accessed data
- ✅ **Smart polling** to prevent notification spam
- ✅ **Efficient re-rendering** with React optimization
- ✅ **Connection pooling** through Prisma
- ✅ **Asset optimization** with Vite bundling

### **Monitoring**
- 📊 **Real-time metrics** via admin dashboard
- 🔍 **Error tracking** with comprehensive logging
- ⚡ **Performance monitoring** for API response times
- 📈 **Usage analytics** for system optimization

## 🤝 Contributing

We welcome contributions! Here's how to get started:

### **Development Workflow**
1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### **Contribution Guidelines**
- ✅ Follow TypeScript best practices
- ✅ Write comprehensive tests
- ✅ Update documentation
- ✅ Follow conventional commits
- ✅ Ensure all checks pass

### **Development Setup**
```bash
# Install all dependencies
pnpm install --recursive

# Start all services in development
pnpm dev:all

# Run linting and type checking
pnpm lint && pnpm typecheck
```

## 🐛 Known Issues & Roadmap

### **Current Limitations**
- 🔄 **Mobile app** - Web-only currently
- 🔄 **Offline support** - Requires internet connection
- 🔄 **Advanced ML** - Basic analytics currently

### **Roadmap**
- 🎯 **Q1 2024**: Machine learning pollution predictions
- 🎯 **Q2 2024**: Mobile app (React Native)
- 🎯 **Q3 2024**: Advanced reporting system
- 🎯 **Q4 2024**: Multi-language support

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Turf.js** - Geospatial analysis capabilities
- **Leaflet** - Interactive mapping functionality  
- **HeroUI** - Beautiful UI components
- **AdonisJS** - Robust backend framework
- **PostGIS** - Advanced geospatial database features

---

<div align="center">

**Built with ❤️ for environmental monitoring and public health**

[⭐ Star this repo](https://github.com/yourusername/environmental-monitoring-system) | [🐛 Report Bug](https://github.com/yourusername/environmental-monitoring-system/issues) | [✨ Request Feature](https://github.com/yourusername/environmental-monitoring-system/issues)

Made with 🌍 by [Your Team Name]

</div>
