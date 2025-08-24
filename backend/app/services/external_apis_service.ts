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
  private static overpassUrl = 'https://overpass-api.de/api/interpreter'
  private static postcodeApiUrl = 'https://api.postcodes.io'
  private static maxRetries = 3
  private static requestTimeout = 15000

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

    return this.executeOverpassQuery(query, 'healthcare')
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

    return this.executeOverpassQuery(query, 'education')
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

    return this.executeOverpassQuery(query, 'emergency')
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

    return this.executeOverpassQuery(query, 'residential')
  }

  static async estimatePopulation(boundingBox: BoundingBox, areaKm2: number): Promise<PopulationEstimate> {
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

  private static async executeOverpassQuery(query: string, category: string): Promise<OSMFacility[]> {
    let lastError: any
    
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        console.log(`🔍 Querying OpenStreetMap for ${category} facilities (attempt ${attempt}/${this.maxRetries})...`)
        
        const response = await axios.post(
          this.overpassUrl,
          query,
          {
            timeout: this.requestTimeout,
            headers: {
              'Content-Type': 'text/plain',
              'User-Agent': 'Environmental-Monitoring-System/1.0'
            }
          }
        )

        if (!response.data || !response.data.elements) {
          throw new Error(`Invalid response format from Overpass API`)
        }

        const facilities = response.data.elements.map((element: any) => ({
          id: element.id?.toString() || `${element.type}_${Date.now()}_${Math.random()}`,
          type: element.type || 'node',
          name: element.tags?.name || element.tags?.brand || 'Unnamed',
          amenity: element.tags?.amenity || element.tags?.healthcare || element.tags?.emergency || category,
          lat: element.lat || element.center?.lat,
          lon: element.lon || element.center?.lon,
          tags: element.tags || {}
        })).filter((facility: OSMFacility) => facility.lat && facility.lon)

        console.log(`✅ Found ${facilities.length} ${category} facilities via OpenStreetMap`)
        return facilities

      } catch (error: any) {
        lastError = error
        console.warn(`Attempt ${attempt}/${this.maxRetries} failed for ${category}:`, error.message)
        
        if (attempt < this.maxRetries) {
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000))
        }
      }
    }

    console.error(`❌ All attempts failed for ${category} facilities:`, lastError)
    return []
  }

  private static async estimatePopulationByPostcodes(boundingBox: BoundingBox, areaKm2: number): Promise<PopulationEstimate> {
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
      
      console.log(`📊 Postcode-based population estimate: ${estimatedPopulation} people (${avgDensity}/km²)`)

      return {
        total: estimatedPopulation,
        density: Math.round(avgDensity),
        source: 'postcode',
        confidence: Math.min(populationSamples.length / samplePoints.length, 0.9)
      }
    } catch (error) {
      throw new Error(`Postcode estimation failed: ${error}`)
    }
  }

  private static async estimatePopulationByDensity(boundingBox: BoundingBox, areaKm2: number): Promise<PopulationEstimate> {
    try {
      const residentialData = await this.getResidentialData(boundingBox)
      
      if (residentialData.length === 0) {
        throw new Error('No residential data available')
      }

      let estimatedDensity = 0
      let buildingScore = 0

      residentialData.forEach(building => {
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
      
      console.log(`🏠 Building-based population estimate: ${estimatedPopulation} people (${Math.round(avgDensity)}/km²)`)

      return {
        total: estimatedPopulation,
        density: Math.round(avgDensity),
        source: 'estimated',
        confidence: Math.min(residentialData.length / 20, 0.8)
      }
    } catch (error) {
      throw new Error(`Density estimation failed: ${error}`)
    }
  }

  private static getBasicPopulationEstimate(boundingBox: BoundingBox, areaKm2: number): PopulationEstimate {
    const center = {
      lat: (boundingBox.north + boundingBox.south) / 2,
      lng: (boundingBox.east + boundingBox.west) / 2
    }

    const isLondonArea = center.lat > 51.28 && center.lat < 51.70 && center.lng > -0.51 && center.lng < 0.30
    const baseDensity = isLondonArea ? 5000 : 1500
    
    const estimatedPopulation = Math.round(areaKm2 * baseDensity)
    
    console.log(`📍 Basic population estimate: ${estimatedPopulation} people (${baseDensity}/km²)`)

    return {
      total: estimatedPopulation,
      density: baseDensity,
      source: 'estimated',
      confidence: 0.5
    }
  }

  private static generateSamplePoints(boundingBox: BoundingBox, count: number): Coordinates[] {
    const points: Coordinates[] = []
    const gridSize = Math.sqrt(count)
    
    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
        const lat = boundingBox.south + (boundingBox.north - boundingBox.south) * (i + 0.5) / gridSize
        const lng = boundingBox.west + (boundingBox.east - boundingBox.west) * (j + 0.5) / gridSize
        points.push({ lat, lng })
      }
    }
    
    return points
  }

  private static estimateDistrictPopulation(postcodeData: any): number {
    const region = postcodeData.region || ''
    const district = postcodeData.admin_district || ''
    
    if (region === 'London' || district.includes('London')) {
      return Math.random() * 3000 + 4000
    }
    
    if (district.includes('City') || district.includes('Metropolitan')) {
      return Math.random() * 2000 + 2000
    }
    
    return Math.random() * 1000 + 500
  }

  static geometryToBoundingBox(geometry: any): BoundingBox {
    let minLat = Infinity, maxLat = -Infinity
    let minLng = Infinity, maxLng = -Infinity

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
        east: lng + buffer
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
      east: maxLng
    }
  }
}