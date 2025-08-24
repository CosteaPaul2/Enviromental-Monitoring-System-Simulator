import axios from "axios";
import Cookies from "js-cookie";

const api = axios.create({
  baseURL: "http://localhost:3333",
  timeout: 15000, // Longer timeout for spatial analysis
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = Cookies.get("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface Demographics {
  children: number;
  adults: number;
  elderly: number;
  vulnerable: number;
}

export interface PopulationData {
  total: number;
  density: number;
  area: number;
  demographics: Demographics;
}

export interface Healthcare {
  hospitals: number;
  clinics: number;
  pharmacies: number;
  emergencyServices: number;
}

export interface Education {
  schools: number;
  daycares: number;
  universities: number;
}

export interface Emergency {
  fireStations: number;
  policeStations: number;
  emergencyExits: number;
}

export interface Residential {
  housingUnits: number;
  apartmentBuildings: number;
  commercialBuildings: number;
}

export interface Infrastructure {
  healthcare: Healthcare;
  education: Education;
  emergency: Emergency;
  residential: Residential;
}

export interface EnvironmentalContext {
  urbanDensity: 'low' | 'medium' | 'high';
  zoneClassification: string;
  accessibilityIndex: number;
  vulnerabilityIndex: number;
}

export interface SensorInfo {
  id: number;
  sensorId: string;
  type: string;
  active: boolean;
  createdAt: string;
  ownerName: string;
  ownerEmail: string;
  longitude: number;
  latitude: number;
}

export interface SensorsData {
  total: number;
  active: number;
  sensors: SensorInfo[];
}

export interface RiskAssessment {
  level: 'low' | 'medium' | 'high' | 'critical';
  score: number;
  factors: string[];
  recommendations: string[];
}

export interface ZoneAnalysis {
  population: PopulationData;
  infrastructure: Infrastructure;
  environmental: EnvironmentalContext;
  sensors: SensorsData;
  riskAssessment: RiskAssessment;
}

export interface ClientZoneAnalysis {
  zoneName: string;
  geometry: any; // GeoJSON geometry
  analysis: ZoneAnalysis;
}

export interface AnalyzeZoneRequest {
  geometry: any; // GeoJSON geometry object
  name?: string; // Optional name for the analysis zone
}

export const spatialAnalysisApi = {
  analyzeClientZone: async (
    request: AnalyzeZoneRequest
  ): Promise<{
    success: boolean;
    data?: ClientZoneAnalysis;
    message?: string;
  }> => {
    try {
      const response = await api.post("/analysis/zone", request);
      return response.data;
    } catch (error: any) {
      console.error("Failed to analyze client zone:", error);
      return {
        success: false,
        message: error.response?.data?.message || "Failed to analyze zone",
      };
    }
  },
};

// Helper functions for formatting and displaying data
export const formatPopulation = (population: PopulationData): string => {
  if (population.total > 1000) {
    return `${(population.total / 1000).toFixed(1)}K people`;
  }
  return `${population.total} people`;
};

export const formatDensity = (density: number): string => {
  return `${density.toLocaleString()} people/km²`;
};

export const formatArea = (area: number): string => {
  if (area >= 1) {
    return `${area.toFixed(2)} km²`;
  }
  return `${(area * 1000).toFixed(0)} m²`;
};

export const getRiskColor = (level: RiskAssessment['level']): string => {
  switch (level) {
    case 'low': return '#22c55e';      // Green
    case 'medium': return '#f59e0b';   // Yellow/Orange  
    case 'high': return '#ef4444';     // Red
    case 'critical': return '#7c2d12'; // Dark red
    default: return '#6b7280';         // Gray
  }
};

export const getRiskIcon = (level: RiskAssessment['level']): string => {
  switch (level) {
    case 'low': return 'tabler:shield-check';
    case 'medium': return 'tabler:shield-exclamation';
    case 'high': return 'tabler:shield-x';
    case 'critical': return 'tabler:alert-triangle';
    default: return 'tabler:shield';
  }
};

export const getUrbanDensityIcon = (density: EnvironmentalContext['urbanDensity']): string => {
  switch (density) {
    case 'low': return 'tabler:building';
    case 'medium': return 'tabler:buildings';
    case 'high': return 'tabler:building-skyscraper';
    default: return 'tabler:building';
  }
};

export const getUrbanDensityColor = (density: EnvironmentalContext['urbanDensity']): string => {
  switch (density) {
    case 'low': return '#22c55e';     // Green
    case 'medium': return '#f59e0b';  // Yellow
    case 'high': return '#ef4444';    // Red  
    default: return '#6b7280';        // Gray
  }
};

// Generate summary text for quick overview
export const generateAnalysisSummary = (analysis: ZoneAnalysis): string => {
  const { population, infrastructure, riskAssessment } = analysis;
  
  const popText = formatPopulation(population);
  const riskText = riskAssessment.level.charAt(0).toUpperCase() + riskAssessment.level.slice(1);
  const healthcareText = infrastructure.healthcare.hospitals > 0 
    ? `${infrastructure.healthcare.hospitals} hospital${infrastructure.healthcare.hospitals > 1 ? 's' : ''}`
    : `${infrastructure.healthcare.clinics} clinic${infrastructure.healthcare.clinics !== 1 ? 's' : ''}`;
    
  return `${popText} • ${riskText} risk • ${healthcareText} • ${infrastructure.education.schools} school${infrastructure.education.schools !== 1 ? 's' : ''}`;
};

// Check if analysis indicates high-priority areas
export const isHighPriorityArea = (analysis: ZoneAnalysis): boolean => {
  return analysis.riskAssessment.level === 'high' || 
         analysis.riskAssessment.level === 'critical' ||
         analysis.population.demographics.vulnerable / analysis.population.total > 0.25;
};

// Get priority alert message for high-priority areas
export const getPriorityAlertMessage = (analysis: ZoneAnalysis): string | null => {
  if (!isHighPriorityArea(analysis)) return null;
  
  const { population, riskAssessment } = analysis;
  const vulnerableCount = population.demographics.vulnerable;
  
  if (riskAssessment.level === 'critical') {
    return `Critical area with ${vulnerableCount} vulnerable people - immediate attention required`;
  } else if (riskAssessment.level === 'high') {
    return `High-risk area affecting ${population.total} people - enhanced monitoring recommended`;
  } else {
    return `${vulnerableCount} vulnerable people in this area - consider targeted safety measures`;
  }
};