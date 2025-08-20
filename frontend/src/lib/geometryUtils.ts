import { ClientZone } from '@/components/GeometryOperationsPanel'

interface Point {
  lat: number
  lng: number
}

interface GeoJSONGeometry {
  type: 'Point' | 'Polygon' | 'MultiPolygon'
  coordinates: number[] | number[][] | number[][][]
  properties?: {
    radius?: number
    [key: string]: any
  }
}

interface EnvironmentalAnalysis {
  totalArea: number 
  riskLevel: 'low' | 'moderate' | 'high' | 'critical'
  affectedPopulation: number 
  complianceStatus: 'compliant' | 'warning' | 'violation'
  recommendations: string[]
}



function normalizeGeoJSON(geometry: any): GeoJSONGeometry | null {
  if (!geometry || !geometry.type) return null
  
  if (geometry.type === 'Point' && geometry.coordinates) {
    console.warn('Circle geometry should be converted to polygon before processing')
    return null
  }
  
  if (geometry.type === 'Polygon') {
    if (!geometry.coordinates || !Array.isArray(geometry.coordinates[0])) {
      console.error('Invalid Polygon coordinates structure')
      return null
    }
    
    const outerRing = geometry.coordinates[0]
    const first = outerRing[0]
    const last = outerRing[outerRing.length - 1]
    
    if (first[0] !== last[0] || first[1] !== last[1]) {
      outerRing.push([first[0], first[1]]) 
    }
    
    return {
      type: 'Polygon',
      coordinates: geometry.coordinates
    }
  }
  
  return geometry as GeoJSONGeometry
}

function extractPolygonPoints(geometry: GeoJSONGeometry): Point[] {
  if (geometry.type !== 'Polygon') return []
  
  const coordinates = geometry.coordinates as number[][][]
  return coordinates[0].slice(0, -1).map(([lng, lat]) => ({ lat, lng }))
}

function convertCircleToPolygon(center: [number, number], radiusMeters: number, segments: number = 64): GeoJSONGeometry {
  const [lng, lat] = center
  const points: number[][] = []
  
  const radiusLat = radiusMeters / 111320 
  const radiusLng = radiusMeters / (111320 * Math.cos(lat * Math.PI / 180))
  
  for (let i = 0; i < segments; i++) {
    const angle = (i * 2 * Math.PI) / segments
    const pointLng = lng + radiusLng * Math.cos(angle)
    const pointLat = lat + radiusLat * Math.sin(angle)
    points.push([pointLng, pointLat])
  }
  
  points.push(points[0])
  
  return {
    type: 'Polygon',
    coordinates: [points]
  }
}


function calculatePolygonArea(points: Point[]): number {
  if (points.length < 3) return 0
  
  let area = 0
  for (let i = 0; i < points.length; i++) {
    const j = (i + 1) % points.length
    area += points[i].lng * points[j].lat
    area -= points[j].lng * points[i].lat
  }
  
  const areaKm2 = Math.abs(area) * 111320 * 111320 / (2 * 1000000)
  return Math.round(areaKm2 * 100) / 100
}

function pointInPolygon(point: Point, polygon: Point[]): boolean {
  const { lat, lng } = point
  let inside = false
  
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].lng, yi = polygon[i].lat
    const xj = polygon[j].lng, yj = polygon[j].lat
    
    if (((yi > lat) !== (yj > lat)) && (lng < (xj - xi) * (lat - yi) / (yj - yi) + xi)) {
      inside = !inside
    }
  }
  
  return inside
}

function createBuffer(points: Point[], bufferMeters: number): Point[] {
  if (points.length === 0) return []
  
  const center = points.reduce(
    (acc, p) => ({ lat: acc.lat + p.lat / points.length, lng: acc.lng + p.lng / points.length }),
    { lat: 0, lng: 0 }
  )
  
  const bufferLat = bufferMeters / 111320
  const bufferLng = bufferMeters / (111320 * Math.cos(center.lat * Math.PI / 180))
  
  return points.map(point => {
    const dx = point.lng - center.lng
    const dy = point.lat - center.lat
    const distance = Math.sqrt(dx * dx + dy * dy)
    
    if (distance === 0) return point
    
    const factor = (distance + Math.sqrt(bufferLat * bufferLat + bufferLng * bufferLng)) / distance
    
    return {
      lat: center.lat + dy * factor,
      lng: center.lng + dx * factor
    }
  })
}


function polygonIntersection(poly1: Point[], poly2: Point[]): Point[] {
  const intersectionPoints: Point[] = []
  
  poly1.forEach(point => {
    if (pointInPolygon(point, poly2)) {
      intersectionPoints.push(point)
    }
  })
  
  poly2.forEach(point => {
    if (pointInPolygon(point, poly1)) {
      intersectionPoints.push(point)
    }
  })
  
  for (let i = 0; i < poly1.length; i++) {
    const p1 = poly1[i]
    const p2 = poly1[(i + 1) % poly1.length]
    
    for (let j = 0; j < poly2.length; j++) {
      const p3 = poly2[j]
      const p4 = poly2[(j + 1) % poly2.length]
      
      const intersection = lineIntersection(p1, p2, p3, p4)
      if (intersection) {
        intersectionPoints.push(intersection)
      }
    }
  }
  
  if (intersectionPoints.length < 3) return []
  
  return convexHull(intersectionPoints)
}

function lineIntersection(p1: Point, p2: Point, p3: Point, p4: Point): Point | null {
  const x1 = p1.lng, y1 = p1.lat
  const x2 = p2.lng, y2 = p2.lat
  const x3 = p3.lng, y3 = p3.lat
  const x4 = p4.lng, y4 = p4.lat
  
  const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4)
  if (Math.abs(denom) < 0.000001) return null
  
  const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom
  const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / denom
  
  if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
    return {
      lng: x1 + t * (x2 - x1),
      lat: y1 + t * (y2 - y1)
    }
  }
  
  return null
}

function convexHull(points: Point[]): Point[] {
  if (points.length < 3) return points
  
  points.sort((a, b) => a.lng === b.lng ? a.lat - b.lat : a.lng - b.lng)
  
  const lower = []
  for (const point of points) {
    while (lower.length >= 2 && 
           crossProduct(lower[lower.length - 2], lower[lower.length - 1], point) <= 0) {
      lower.pop()
    }
    lower.push(point)
  }
  
  const upper = []
  for (let i = points.length - 1; i >= 0; i--) {
    const point = points[i]
    while (upper.length >= 2 && 
           crossProduct(upper[upper.length - 2], upper[upper.length - 1], point) <= 0) {
      upper.pop()
    }
    upper.push(point)
  }
  
  upper.pop()
  lower.pop()
  return lower.concat(upper)
}

function crossProduct(o: Point, a: Point, b: Point): number {
  return (a.lng - o.lng) * (b.lat - o.lat) - (a.lat - o.lat) * (b.lng - o.lng)
}


function analyzeEnvironmentalImpact(geometry: GeoJSONGeometry, operation: string): EnvironmentalAnalysis {
  const points = extractPolygonPoints(geometry)
  const area = calculatePolygonArea(points)
  
  const affectedPopulation = Math.round(area * 1000)
  
  let riskLevel: EnvironmentalAnalysis['riskLevel'] = 'low'
  let complianceStatus: EnvironmentalAnalysis['complianceStatus'] = 'compliant'
  const recommendations: string[] = []
  
  if (operation === 'pollution-source-analysis') {
    if (area > 10) {
      riskLevel = 'critical'
      complianceStatus = 'violation'
      recommendations.push('⚠️ Large pollution impact zone detected')
      recommendations.push('📋 Immediate regulatory notification required')
      recommendations.push('🏃 Consider evacuation protocols for affected areas')
    } else if (area > 5) {
      riskLevel = 'high'
      complianceStatus = 'warning'
      recommendations.push('🚨 Significant pollution exposure area')
      recommendations.push('📊 Deploy additional air quality sensors')
      recommendations.push('👥 Issue public health advisory')
    } else if (area > 1) {
      riskLevel = 'moderate'
      recommendations.push('📈 Monitor pollution levels closely')
      recommendations.push('🏭 Inspect pollution source controls')
    }
  }
  
  if (operation === 'regulatory-buffer') {
    recommendations.push('📏 Regulatory buffer zone established')
    recommendations.push('🏫 All sensitive facilities protected')
    recommendations.push('📋 Compliant with environmental regulations')
  }
  
  if (operation === 'multi-source-overlap') {
    if (area > 8) {
      riskLevel = 'critical'
      recommendations.push('💥 Multiple pollution sources creating compound effect')
      recommendations.push('🚨 Cumulative pollution exceeds safe thresholds')
    } else if (area > 3) {
      riskLevel = 'high'
      recommendations.push('⚡ Multi-source pollution overlap detected')
      recommendations.push('🔄 Coordinate pollution control across sources')
    }
  }
  
  return {
    totalArea: area,
    riskLevel,
    affectedPopulation,
    complianceStatus,
    recommendations
  }
}


export function performGeometryOperation(
  operation: string,
  zones: ClientZone[]
): ClientZone | null {
  
  if (zones.length < 1) return null
  
  try {
    const normalizedZones = zones.map(zone => {
      let geometry = normalizeGeoJSON(zone.geometry)
      
      if (zone.type === 'circle' && zone.geometry?.type === 'Point') {
        const center = zone.geometry.coordinates as [number, number]
        let radius = 1000
        
        if (zone.geometry.properties?.radius) {
          radius = zone.geometry.properties.radius
        } else if ((zone as any).properties?.radius) {
          radius = (zone as any).properties.radius
        } else if ((zone as any).radius) {
          radius = (zone as any).radius
        }
        
        console.log(`🔄 Converting circle to polygon: center=[${center[1]}, ${center[0]}], radius=${radius}m`)
        geometry = convertCircleToPolygon(center, radius)
      }
      
      return {
        ...zone,
        geometry,
        points: geometry ? extractPolygonPoints(geometry) : []
      }
    }).filter(zone => zone.geometry && zone.points.length > 0)
    
    if (normalizedZones.length === 0) {
      console.error('No valid geometries found')
      return null
    }
    
    let resultPoints: Point[] = []
    let operationName = ''
    let color = '#10b981'
    let environmentalOp = ''
    
    switch (operation) {
      case 'union':
        environmentalOp = 'multi-source-overlap'
        const allPoints = normalizedZones.map(z => z.points).flat()
        resultPoints = convexHull(allPoints)
        
        const totalOriginalArea = normalizedZones.reduce((sum, zone) => sum + calculatePolygonArea(zone.points), 0)
        const unionArea = calculatePolygonArea(resultPoints)
        const overlapReduction = Math.max(0, Math.round(((totalOriginalArea - unionArea) / totalOriginalArea) * 100))
        
        operationName = `🏭 Multi-Source Pollution Zone (${normalizedZones.length} sources, ${overlapReduction}% overlap detected)`
        color = overlapReduction > 30 ? '#ef4444' : overlapReduction > 15 ? '#f59e0b' : '#10b981'
        break
        
      case 'intersection':
        if (normalizedZones.length >= 2) {
          environmentalOp = 'pollution-source-analysis'
          let intersection = normalizedZones[0].points
          for (let i = 1; i < normalizedZones.length; i++) {
            intersection = polygonIntersection(intersection, normalizedZones[i].points)
            if (intersection.length === 0) break
          }
          resultPoints = intersection
          
          if (resultPoints.length > 0) {
            const riskArea = calculatePolygonArea(resultPoints)
            const affectedPop = Math.round(riskArea * 1000) 
            
            operationName = `☢️ Population at Risk Zone (${riskArea.toFixed(1)} km², ~${affectedPop.toLocaleString()} people)`
            color = riskArea > 5 ? '#dc2626' : riskArea > 2 ? '#f59e0b' : '#ef4444'
          } else {
            operationName = `✅ No Population Impact - Pollution zones don't overlap residential areas`
            return null 
          }
        }
        break
        
      case 'contains':
        if (normalizedZones.length >= 2) {
          environmentalOp = 'regulatory-buffer'
          const primaryZone = normalizedZones[0]
          const protectedZones = normalizedZones.slice(1)
          
          let allProtected = true
          let partiallyProtected = 0
          let fullyProtected = 0
          
          protectedZones.forEach(zone => {
            const isFullyInside = zone.points.every(point => pointInPolygon(point, primaryZone.points))
            const hasAnyInside = zone.points.some(point => pointInPolygon(point, primaryZone.points))
            
            if (isFullyInside) {
              fullyProtected++
            } else if (hasAnyInside) {
              partiallyProtected++
              allProtected = false
            } else {
              allProtected = false
            }
          })
          
          const bufferArea = calculatePolygonArea(primaryZone.points)
          
          if (allProtected && fullyProtected === protectedZones.length) {
            operationName = `🛡️ COMPLIANT: All ${protectedZones.length} sensitive areas protected (${bufferArea.toFixed(1)} km² buffer)`
            color = '#10b981'
          } else if (partiallyProtected > 0) {
            operationName = `⚠️ PARTIAL COMPLIANCE: ${fullyProtected + partiallyProtected}/${protectedZones.length} areas covered`
            color = '#f59e0b'
          } else {
            operationName = `🚨 VIOLATION: Buffer zone doesn't protect sensitive areas`
            color = '#ef4444'
          }
          
          resultPoints = primaryZone.points
        }
        break
        
      case 'buffer-1km':
        environmentalOp = 'regulatory-buffer'
        resultPoints = createBuffer(normalizedZones[0].points, 1000)
        operationName = `🛡️ 1km Safety Protection Buffer (regulatory compliance)`
        color = '#3b82f6'
        break
        
      default:
        console.error('Unknown operation:', operation)
        return null
    }
    
    if (resultPoints.length === 0) {
      return null
    }
    
    const coordinates = resultPoints.map(p => [p.lng, p.lat])
    coordinates.push(coordinates[0]) 
    
    const resultGeometry: GeoJSONGeometry = {
      type: 'Polygon',
      coordinates: [coordinates]
    }
    
    const analysis = analyzeEnvironmentalImpact(resultGeometry, environmentalOp)
    
    const riskIcon = {
      'low': '✅',
      'moderate': '⚠️',
      'high': '🚨',
      'critical': '💀'
    }[analysis.riskLevel]
    
    const enhancedName = `${operationName} ${riskIcon} Risk: ${analysis.riskLevel.toUpperCase()}`
    
    const result: ClientZone = {
      id: `env-analysis-${Date.now()}`,
      name: enhancedName,
      type: 'polygon',
      geometry: resultGeometry,
      selected: false,
      color,
      created: new Date(),
      environmentalAnalysis: analysis
    }
    
    console.log('🌍 Environmental Analysis Results:', {
      operation: environmentalOp,
      area: analysis.totalArea,
      riskLevel: analysis.riskLevel,
      affectedPopulation: analysis.affectedPopulation,
      recommendations: analysis.recommendations
    })
    
    return result
    
  } catch (error) {
    console.error('Geometry operation failed:', error)
    return null
  }
}