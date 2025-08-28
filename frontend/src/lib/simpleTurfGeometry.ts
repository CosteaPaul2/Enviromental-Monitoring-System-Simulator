import * as turf from "@turf/turf";

import { ClientZone } from "../types/geometry";

// Convert ClientZone to Turf Feature (handles all your shape types)
function zoneToTurfFeature(zone: ClientZone): any {
  console.log(
    "Converting zone to turf feature:",
    zone.type,
    zone.geometry?.type,
  );

  if (zone.type === "circle" && zone.geometry?.type === "Point") {
    const [lng, lat] = zone.geometry.coordinates;
    const radiusKm = (zone.radius || 1000) / 1000; // Convert meters to km
    const circle = turf.circle([lng, lat], radiusKm, { units: "kilometers" });

    console.log("Created circle feature:", circle);

    return circle;
  }

  if (zone.geometry?.type === "Polygon") {
    const polygon = turf.polygon(zone.geometry.coordinates);

    console.log("Created polygon feature:", polygon);

    return polygon;
  }

  throw new Error(`Unsupported zone type: ${zone.type}`);
}

// Simple environmental analysis
function createAnalysis(feature: any, operation: string, _zoneCount: number) {
  const area = turf.area(feature) / 1000000; // Convert to km²

  const analysis = {
    totalArea: area,
    affectedPopulation: Math.round(area * 500), // Rough estimate: 500 people per km²
    riskLevel: (area > 10 ? "high" : area > 2 ? "moderate" : "low") as
      | "low"
      | "moderate"
      | "high"
      | "critical",
    complianceStatus: "compliant" as "compliant" | "warning" | "violation",
    recommendations: [] as string[],
  };

  // Add operation-specific recommendations
  switch (operation) {
    case "union":
      if (area > 25) {
        analysis.riskLevel = "critical";
        analysis.complianceStatus = "violation";
        analysis.recommendations.push("🚨 Emergency response required");
      } else if (area > 10) {
        analysis.recommendations.push("📊 Monitor combined impact");
      } else {
        analysis.recommendations.push("✅ Combined area acceptable");
      }
      break;
    case "intersection":
      if (area > 5) {
        analysis.recommendations.push("👥 High population exposure");
      } else {
        analysis.recommendations.push("✅ Limited overlap");
      }
      break;
    case "buffer":
      analysis.recommendations.push("🛡️ Safety zone established");
      break;
  }

  return analysis;
}

// Main geometry operations using Turf.js - SIMPLE VERSION
export function performGeometryOperation(
  operation: string,
  zones: ClientZone[],
): ClientZone | null {
  if (zones.length === 0) return null;

  try {
    let result: any = null;

    switch (operation) {
      case "union":
        if (zones.length < 2) return null;
        const unionFeatures = zones.map(zoneToTurfFeature);

        result = turf.union(turf.featureCollection(unionFeatures) as any);
        break;

      case "intersection":
        if (zones.length < 2) return null;
        console.log("Starting intersection with", zones.length, "zones");

        // For Turf.js v7+, intersect expects a FeatureCollection
        const intersectionFeatures = zones.map(zoneToTurfFeature);

        console.log("Features to intersect:", intersectionFeatures);

        try {
          // Create FeatureCollection and call intersect
          const featureCollection =
            turf.featureCollection(intersectionFeatures);

          console.log(
            "About to call turf.intersect with FeatureCollection:",
            featureCollection,
          );

          result = turf.intersect(featureCollection as any);
          console.log("Intersection result:", result);

          if (!result) {
            console.log("No intersection found between the shapes");

            return null;
          }
        } catch (error) {
          console.log("Intersection failed:", error);

          return null;
        }
        break;

      case "buffer-1km":
        if (zones.length < 1) return null;
        const baseFeature = zoneToTurfFeature(zones[0]);

        result = turf.buffer(baseFeature, 1, { units: "kilometers" });
        break;

      case "contains":
        if (zones.length < 2) return null;
        const container = zoneToTurfFeature(zones[0]);
        let containedCount = 0;

        for (let i = 1; i < zones.length; i++) {
          const testZone = zoneToTurfFeature(zones[i]);

          if (turf.booleanContains(container as any, testZone as any)) {
            containedCount++;
          }
        }

        const total = zones.length - 1;
        const compliant = containedCount === total;

        // Return updated original zone with analysis
        return {
          ...zones[0],
          name: compliant
            ? `✅ All ${total} areas protected`
            : `⚠️ Only ${containedCount}/${total} areas protected`,
          color: compliant ? "#00cc66" : "#ff4444",
          id: `contains-${Date.now()}`,
          environmentalAnalysis: {
            totalArea: turf.area(container) / 1000000,
            affectedPopulation: Math.round(
              (turf.area(container) / 1000000) * 500,
            ),
            riskLevel: compliant ? "low" : "high",
            complianceStatus: compliant ? "compliant" : "violation",
            recommendations: compliant
              ? ["✅ Full compliance achieved"]
              : ["🚨 Expand protection zone"],
          },
        };

      default:
        return null;
    }

    if (!result) return null;

    // Create result ClientZone - your Map component will render it automatically!
    const colors: Record<string, string> = {
      union: "#ff4444",
      intersection: "#ff8800",
      "buffer-1km": "#0088ff",
    };

    const names: Record<string, string> = {
      union: `Combined Zone (${zones.length} areas)`,
      intersection: `Overlap Area (${zones.length} zones)`,
      "buffer-1km": "1km Safety Buffer",
    };

    return {
      id: `${operation}-${Date.now()}`,
      name: names[operation] || "Geometry Result",
      type: "polygon",
      geometry: result.geometry, // This is already in GeoJSON format!
      selected: false,
      color: colors[operation] || "#10b981",
      created: new Date(),
      environmentalAnalysis: createAnalysis(result, operation, zones.length),
    };
  } catch (error) {
    console.error("Geometry operation failed:", error);

    return null;
  }
}

// 🆕 BONUS: Population Analysis Functions
export function analyzePopulationImpact(
  pollutionZones: ClientZone[],
  populationCenters: Array<{
    lat: number;
    lng: number;
    population: number;
    name: string;
  }>,
): {
  totalAffected: number;
  affectedCenters: Array<{ name: string; population: number; risk: string }>;
  recommendations: string[];
} {
  let totalAffected = 0;
  const affectedCenters = [];

  for (const zone of pollutionZones) {
    const turfZone = zoneToTurfFeature(zone);

    for (const center of populationCenters) {
      const point = turf.point([center.lng, center.lat]);

      if (turf.booleanPointInPolygon(point, turfZone)) {
        totalAffected += center.population;
        affectedCenters.push({
          name: center.name,
          population: center.population,
          risk:
            center.population > 10000
              ? "high"
              : center.population > 1000
                ? "moderate"
                : "low",
        });
      }
    }
  }

  const recommendations = [];

  if (totalAffected > 50000) {
    recommendations.push(
      "🚨 Large population at risk - immediate action required",
    );
  } else if (totalAffected > 10000) {
    recommendations.push("⚠️ Significant population impact - monitor closely");
  } else {
    recommendations.push("✅ Limited population impact");
  }

  return { totalAffected, affectedCenters, recommendations };
}
