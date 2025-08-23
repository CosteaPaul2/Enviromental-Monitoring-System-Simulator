export interface ClientZone {
  id: string;
  name: string;
  type: "rectangle" | "polygon" | "circle";
  geometry: any;
  selected: boolean;
  color: string;
  created: Date;
  radius?: number; // For circles - radius in meters
  environmentalAnalysis?: {
    totalArea: number;
    riskLevel: "low" | "moderate" | "high" | "critical";
    affectedPopulation: number;
    complianceStatus: "compliant" | "warning" | "violation";
    recommendations: string[];
  };
}
