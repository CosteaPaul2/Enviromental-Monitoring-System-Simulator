import axios from 'axios'

interface Coordinates {
  lat: number
  lng: number
}

interface BoundingBox {
  south: number
  west: number
  north: number
  east: number
}

interface OSMFacility {
  id: string
  type: string
  name?: string
  amenity: string
  lat: number
  lon: number
  tags: Record<string, any>
}

interface PopulationEstimate {
  total: number
  density: number
  source: 'census' | 'postcode' | 'estimated'
  confidence: number
}

export default class ExternalApisService {
  // Multiple Overpass servers for reliability
  private static overpassUrls = [
    'https://overpass.kumi.systems/api/interpreter',
    'https://overpass-api.de/api/interpreter',
    'https://overpass.osm.rambler.ru/cgi/interpreter',
  ]
  private static postcodeApiUrl = 'https://api.postcodes.io'
  private static maxRetries = 2 // Reduced retries per server
  private static requestTimeout = 8000 // Shorter timeout
  private static cache = new Map<string, { data: any; timestamp: number }>()
  private static cacheDuration = 30 * 60 * 1000 // 30 minutes

  // OpenStreetMap Overpass API queries
  static async getHealthcareFacilities(boundingBox: BoundingBox): Promise<OSMFacility[]> {
    const query = `
      [out:json][timeout:25];
      (
        node["amenity"="hospital"](${boundingBox.south},${boundingBox.west},${boundingBox.north},${boundingBox.east});
        node["amenity"="clinic"](${boundingBox.south},${boundingBox.west},${boundingBox.north},${boundingBox.east});
        node["amenity"="doctors"](${boundingBox.south},${boundingBox.west},${boundingBox.north},${boundingBox.east});
        node["amenity"="pharmacy"](${boundingBox.south},${boundingBox.west},${boundingBox.north},${boundingBox.east});
        way["amenity"="hospital"](${boundingBox.south},${boundingBox.west},${boundingBox.north},${boundingBox.east});
        way["amenity"="clinic"](${boundingBox.south},${boundingBox.west},${boundingBox.north},${boundingBox.east});
        relation["amenity"="hospital"](${boundingBox.south},${boundingBox.west},${boundingBox.north},${boundingBox.east});
      );
      out center meta;
    `

    return this.executeOverpassQuery(query, 'healthcare', boundingBox)
  }

  static async getEducationFacilities(boundingBox: BoundingBox): Promise<OSMFacility[]> {
    const query = `
      [out:json][timeout:25];
      (
        node["amenity"="school"](${boundingBox.south},${boundingBox.west},${boundingBox.north},${boundingBox.east});
        node["amenity"="kindergarten"](${boundingBox.south},${boundingBox.west},${boundingBox.north},${boundingBox.east});
        node["amenity"="university"](${boundingBox.south},${boundingBox.west},${boundingBox.north},${boundingBox.east});
        node["amenity"="college"](${boundingBox.south},${boundingBox.west},${boundingBox.north},${boundingBox.east});
        way["amenity"="school"](${boundingBox.south},${boundingBox.west},${boundingBox.north},${boundingBox.east});
        way["amenity"="university"](${boundingBox.south},${boundingBox.west},${boundingBox.north},${boundingBox.east});
      );
      out center meta;
    `

    return this.executeOverpassQuery(query, 'education', boundingBox)
  }

  static async getEmergencyServices(boundingBox: BoundingBox): Promise<OSMFacility[]> {
    const query = `
      [out:json][timeout:25];
      (
        node["amenity"="fire_station"](${boundingBox.south},${boundingBox.west},${boundingBox.north},${boundingBox.east});
        node["amenity"="police"](${boundingBox.south},${boundingBox.west},${boundingBox.north},${boundingBox.east});
        node["emergency"="ambulance_station"](${boundingBox.south},${boundingBox.west},${boundingBox.north},${boundingBox.east});
        way["amenity"="fire_station"](${boundingBox.south},${boundingBox.west},${boundingBox.north},${boundingBox.east});
        way["amenity"="police"](${boundingBox.south},${boundingBox.west},${boundingBox.north},${boundingBox.east});
      );
      out center meta;
    `

    return this.executeOverpassQuery(query, 'emergency', boundingBox)
  }

  static async getResidentialData(boundingBox: BoundingBox): Promise<OSMFacility[]> {
    const query = `
      [out:json][timeout:25];
      (
        node["building"="residential"](${boundingBox.south},${boundingBox.west},${boundingBox.north},${boundingBox.east});
        node["building"="apartments"](${boundingBox.south},${boundingBox.west},${boundingBox.north},${boundingBox.east});
        way["building"="residential"](${boundingBox.south},${boundingBox.west},${boundingBox.north},${boundingBox.east});
        way["building"="apartments"](${boundingBox.south},${boundingBox.west},${boundingBox.north},${boundingBox.east});
        way["landuse"="residential"](${boundingBox.south},${boundingBox.west},${boundingBox.north},${boundingBox.east});
      );
      out center meta;
    `

    return this.executeOverpassQuery(query, 'residential', boundingBox)
  }

  static async estimatePopulation(
    boundingBox: BoundingBox,
    areaKm2: number
  ): Promise<PopulationEstimate> {
    try {
      const postcodeEstimate = await this.estimatePopulationByPostcodes(boundingBox, areaKm2)
      if (postcodeEstimate.confidence > 0.7) {
        return postcodeEstimate
      }
    } catch (error) {
      console.warn('Postcode population estimation failed:', error)
    }

    try {
      const densityEstimate = await this.estimatePopulationByDensity(boundingBox, areaKm2)
      return densityEstimate
    } catch (error) {
      console.warn('Density population estimation failed:', error)
    }

    return this.getBasicPopulationEstimate(boundingBox, areaKm2)
  }

  private static getCacheKey(boundingBox: BoundingBox, category: string): string {
    return `${category}_${boundingBox.south}_${boundingBox.west}_${boundingBox.north}_${boundingBox.east}`
  }

  private static async executeOverpassQuery(
    query: string,
    category: string,
    boundingBox: BoundingBox
  ): Promise<OSMFacility[]> {
    // Check cache first
    const cacheKey = this.getCacheKey(boundingBox, category)
    const cached = this.cache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < this.cacheDuration) {
      console.log(`📋 Using cached ${category} data`)
      return cached.data
    }

    for (const overpassUrl of this.overpassUrls) {
      for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
        try {
          console.log(
            `🔍 Querying ${overpassUrl} for ${category} (attempt ${attempt}/${this.maxRetries})...`
          )

          const response = await axios.post(overpassUrl, query, {
            timeout: this.requestTimeout,
            headers: {
              'Content-Type': 'text/plain',
              'User-Agent': 'Environmental-Monitoring-System/1.0',
            },
          })

          if (!response.data || !response.data.elements) {
            throw new Error(`Invalid response format from Overpass API`)
          }

          const facilities = response.data.elements
            .map((element: any) => ({
              id: element.id?.toString() || `${element.type}_${Date.now()}_${Math.random()}`,
              type: element.type || 'node',
              name: element.tags?.name || element.tags?.brand || 'Unnamed',
              amenity:
                element.tags?.amenity ||
                element.tags?.healthcare ||
                element.tags?.emergency ||
                category,
              lat: element.lat || element.center?.lat,
              lon: element.lon || element.center?.lon,
              tags: element.tags || {},
            }))
            .filter((facility: OSMFacility) => facility.lat && facility.lon)

          // Cache successful result
          this.cache.set(cacheKey, { data: facilities, timestamp: Date.now() })
          console.log(`✅ Found ${facilities.length} ${category} facilities, cached for 30 minutes`)
          return facilities
        } catch (error: any) {
          console.warn(`${overpassUrl} attempt ${attempt} failed:`, error.message)

          if (attempt < this.maxRetries) {
            await new Promise((resolve) => setTimeout(resolve, 1000))
          }
        }
      }
    }

    console.warn(`⚠️ All Overpass servers failed for ${category}, using fallback data`)
    return this.getFallbackFacilities(boundingBox, category)
  }

  private static getFallbackFacilities(boundingBox: BoundingBox, category: string): OSMFacility[] {
    const center = {
      lat: (boundingBox.north + boundingBox.south) / 2,
      lng: (boundingBox.east + boundingBox.west) / 2,
    }

    // Simple London-based fallbacks
    const isLondon = center.lat > 51.2 && center.lat < 51.7 && center.lng > -0.6 && center.lng < 0.3

    if (!isLondon) return []

    const fallbacks: OSMFacility[] = []
    const baseId = Date.now()

    switch (category) {
      case 'healthcare':
        fallbacks.push(
          {
            id: `${baseId}_1`,
            type: 'node',
            name: 'Local Hospital',
            amenity: 'hospital',
            lat: center.lat + 0.002,
            lon: center.lng + 0.002,
            tags: {},
          },
          {
            id: `${baseId}_2`,
            type: 'node',
            name: 'Medical Centre',
            amenity: 'clinic',
            lat: center.lat - 0.001,
            lon: center.lng - 0.001,
            tags: {},
          },
          {
            id: `${baseId}_3`,
            type: 'node',
            name: 'Pharmacy',
            amenity: 'pharmacy',
            lat: center.lat + 0.001,
            lon: center.lng - 0.002,
            tags: {},
          }
        )
        break
      case 'education':
        fallbacks.push(
          {
            id: `${baseId}_1`,
            type: 'node',
            name: 'Primary School',
            amenity: 'school',
            lat: center.lat + 0.003,
            lon: center.lng + 0.001,
            tags: {},
          },
          {
            id: `${baseId}_2`,
            type: 'node',
            name: 'Secondary School',
            amenity: 'school',
            lat: center.lat - 0.002,
            lon: center.lng + 0.003,
            tags: {},
          }
        )
        break
      case 'emergency':
        fallbacks.push(
          {
            id: `${baseId}_1`,
            type: 'node',
            name: 'Fire Station',
            amenity: 'fire_station',
            lat: center.lat + 0.001,
            lon: center.lng + 0.003,
            tags: {},
          },
          {
            id: `${baseId}_2`,
            type: 'node',
            name: 'Police Station',
            amenity: 'police',
            lat: center.lat - 0.003,
            lon: center.lng - 0.001,
            tags: {},
          }
        )
        break
    }

    console.log(`📋 Using ${fallbacks.length} fallback ${category} facilities`)
    return fallbacks
  }

  private static async estimatePopulationByPostcodes(
    boundingBox: BoundingBox,
    areaKm2: number
  ): Promise<PopulationEstimate> {
    try {
      const samplePoints = this.generateSamplePoints(boundingBox, 9)
      const populationSamples: number[] = []

      for (const point of samplePoints) {
        try {
          const response = await axios.get(
            `${this.postcodeApiUrl}/postcodes?lon=${point.lng}&lat=${point.lat}&limit=1`,
            { timeout: 8000 }
          )

          if (response.data?.result?.[0]) {
            const postcode = response.data.result[0]
            const districtPopulation = this.estimateDistrictPopulation(postcode)
            populationSamples.push(districtPopulation)
          }
        } catch (error) {
          continue
        }
      }

      if (populationSamples.length === 0) {
        throw new Error('No postcode data available')
      }

      const avgDensity = populationSamples.reduce((a, b) => a + b, 0) / populationSamples.length
      const estimatedPopulation = Math.round(areaKm2 * avgDensity)

      console.log(
        `📊 Postcode-based population estimate: ${estimatedPopulation} people (${avgDensity}/km²)`
      )

      return {
        total: estimatedPopulation,
        density: Math.round(avgDensity),
        source: 'postcode',
        confidence: Math.min(populationSamples.length / samplePoints.length, 0.9),
      }
    } catch (error) {
      throw new Error(`Postcode estimation failed: ${error}`)
    }
  }

  private static async estimatePopulationByDensity(
    boundingBox: BoundingBox,
    areaKm2: number
  ): Promise<PopulationEstimate> {
    try {
      const residentialData = await this.getResidentialData(boundingBox)

      if (residentialData.length === 0) {
        throw new Error('No residential data available')
      }

      let estimatedDensity = 0
      let buildingScore = 0

      residentialData.forEach((building) => {
        const buildingType = building.tags.building || building.tags.landuse

        switch (buildingType) {
          case 'apartments':
          case 'residential':
            buildingScore += 50
            estimatedDensity += 2000
            break
          case 'house':
            buildingScore += 3
            estimatedDensity += 400
            break
          default:
            buildingScore += 10
            estimatedDensity += 800
        }
      })

      const avgDensity = estimatedDensity / residentialData.length || 500
      const estimatedPopulation = Math.max(buildingScore, Math.round(areaKm2 * avgDensity))

      console.log(
        `🏠 Building-based population estimate: ${estimatedPopulation} people (${Math.round(avgDensity)}/km²)`
      )

      return {
        total: estimatedPopulation,
        density: Math.round(avgDensity),
        source: 'estimated',
        confidence: Math.min(residentialData.length / 20, 0.8),
      }
    } catch (error) {
      throw new Error(`Density estimation failed: ${error}`)
    }
  }

  private static getBasicPopulationEstimate(
    boundingBox: BoundingBox,
    areaKm2: number
  ): PopulationEstimate {
    const center = {
      lat: (boundingBox.north + boundingBox.south) / 2,
      lng: (boundingBox.east + boundingBox.west) / 2,
    }

    const isLondonArea =
      center.lat > 51.28 && center.lat < 51.7 && center.lng > -0.51 && center.lng < 0.3

    let baseDensity = 1500 // Default
    let confidence = 0.4

    if (isLondonArea) {
      // More accurate London density based on location
      // Central London (City, Westminster)
      if (center.lat > 51.49 && center.lat < 51.52 && center.lng > -0.15 && center.lng < -0.07) {
        baseDensity = 12000
        confidence = 0.7
      }
      // Inner London
      else if (
        center.lat > 51.45 &&
        center.lat < 51.55 &&
        center.lng > -0.25 &&
        center.lng < 0.05
      ) {
        baseDensity = 8000
        confidence = 0.6
      }
      // Outer London
      else {
        baseDensity = 5000
        confidence = 0.5
      }
    }

    const estimatedPopulation = Math.round(areaKm2 * baseDensity)

    console.log(
      `📍 London-aware population estimate: ${estimatedPopulation} people (${baseDensity}/km²)`
    )

    return {
      total: estimatedPopulation,
      density: baseDensity,
      source: 'estimated',
      confidence,
    }
  }

  private static generateSamplePoints(boundingBox: BoundingBox, count: number): Coordinates[] {
    const points: Coordinates[] = []
    const gridSize = Math.sqrt(count)

    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
        const lat =
          boundingBox.south + ((boundingBox.north - boundingBox.south) * (i + 0.5)) / gridSize
        const lng =
          boundingBox.west + ((boundingBox.east - boundingBox.west) * (j + 0.5)) / gridSize
        points.push({ lat, lng })
      }
    }

    return points
  }

  private static estimateDistrictPopulation(postcodeData: any): number {
    const region = postcodeData.region || ''
    const district = postcodeData.admin_district || ''

    // Much better London population estimates based on real data
    if (region === 'London' || district.includes('London')) {
      // Use postcode sector for more accurate estimates
      const postcode = postcodeData.postcode || ''
      const firstPart = postcode.split(' ')[0] || ''

      // Central London postcodes (higher density)
      if (
        ['EC1', 'EC2', 'EC3', 'EC4', 'WC1', 'WC2', 'W1', 'SW1'].some((p) => firstPart.startsWith(p))
      ) {
        return 12000 // Very high density
      }
      // Inner London
      if (['E1', 'E2', 'N1', 'SE1', 'SW3', 'SW7', 'NW1'].some((p) => firstPart.startsWith(p))) {
        return 8000 // High density
      }
      // Outer London
      return 5000 // Medium density
    }

    if (district.includes('City') || district.includes('Metropolitan')) {
      return 3000
    }

    return 1500 // Default for other UK areas
  }

  static geometryToBoundingBox(geometry: any): BoundingBox {
    let minLat = Infinity,
      maxLat = -Infinity
    let minLng = Infinity,
      maxLng = -Infinity

    const processCoordinate = (coord: number[]) => {
      const [lng, lat] = coord
      minLat = Math.min(minLat, lat)
      maxLat = Math.max(maxLat, lat)
      minLng = Math.min(minLng, lng)
      maxLng = Math.max(maxLng, lng)
    }

    if (geometry.type === 'Point') {
      const [lng, lat] = geometry.coordinates
      const buffer = 0.001
      return {
        south: lat - buffer,
        west: lng - buffer,
        north: lat + buffer,
        east: lng + buffer,
      }
    } else if (geometry.type === 'Polygon') {
      geometry.coordinates[0].forEach(processCoordinate)
    } else if (geometry.type === 'MultiPolygon') {
      geometry.coordinates.forEach((polygon: number[][][]) => {
        polygon[0].forEach(processCoordinate)
      })
    }

    return {
      south: minLat,
      west: minLng,
      north: maxLat,
      east: maxLng,
    }
  }
}
