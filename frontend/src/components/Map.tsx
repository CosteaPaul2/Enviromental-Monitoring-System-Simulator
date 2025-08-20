import { useEffect, useRef, useState, useCallback } from 'react'
import { MapContainer, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Sensor, sensorsApi, getSensorTypeInfo, shapesApi, getPollutionColor } from '@/lib/sensorsApi'
import ShapeCard from './ShapeCard'
import { ClientZone } from './GeometryOperationsPanel'
import { Icon } from '@iconify/react'
import { useSuccessNotification, useErrorNotification } from '@/contexts/NotificationContext'


delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

interface MapProps {
  selectedTool: string | null
  onShapeCreated: (shape: any) => void
  savedShapes: any[]
  className?: string
  showSensors?: boolean
  selectedSensor?: Sensor | null
  onSensorPlaced?: (sensor: Sensor, lat: number, lng: number) => void
  refreshSensors?: () => void
  clientZones?: ClientZone[]
  onClientZoneCreated?: (zone: ClientZone) => void
  onClientZoneClick?: (zoneId: string) => void
}

interface DrawingControlsProps {
  selectedTool: string | null
  onShapeCreated: (shape: any) => void
  savedShapes: any[]
  onShapeClick?: (shapeId: number) => void
  selectedSensor?: Sensor | null
  clientZones?: ClientZone[]
  onClientZoneCreated?: (zone: ClientZone) => void
  onClientZoneClick?: (zoneId: string) => void
}

interface SensorControlsProps {
  sensors: Sensor[]
}

interface SensorPlacementControlsProps {
  selectedSensor: Sensor | null
  onSensorPlaced: (sensor: Sensor, lat: number, lng: number) => void
  sensors: Sensor[]
}

function DrawingControls({ selectedTool, onShapeCreated, savedShapes, onShapeClick, selectedSensor, clientZones, onClientZoneCreated, onClientZoneClick }: DrawingControlsProps) {
  const map = useMap()
  const drawnItemsRef = useRef<L.FeatureGroup>(new L.FeatureGroup())
  const isDrawingRef = useRef(false)

  useEffect(() => {
    if (!map) return

    const drawnItems = drawnItemsRef.current
    map.addLayer(drawnItems)

    return () => {
      if (map.hasLayer(drawnItems)) {
        map.removeLayer(drawnItems)
      }
    }
  }, [map])

  useEffect(() => {
    if (!map) return

    map.off('mousedown')
    map.off('mousemove') 
    map.off('mouseup')
    map.off('click')

    if (selectedTool) {
      console.log(`Setting up custom drawing for ${selectedTool}`)
      
      map.getContainer().style.cursor = 'crosshair'
      

      map.dragging.disable()
      map.doubleClickZoom.disable()
      
      if (selectedTool === 'rectangle') {
        setupRectangleDrawing()
      } else if (selectedTool === 'polygon') {
        setupPolygonDrawing()
      } else if (selectedTool === 'circle') {
        setupCircleDrawing()
      } else if (selectedTool === 'geo-rectangle') {
        setupClientRectangleDrawing()
      } else if (selectedTool === 'geo-polygon') {
        setupClientPolygonDrawing()
      } else if (selectedTool === 'geo-circle') {
        setupClientCircleDrawing()
      }
    } else {

      map.getContainer().style.cursor = ''
      map.dragging.enable()
      map.doubleClickZoom.enable()
      isDrawingRef.current = false
    }

    return () => {
      map.off('mousedown')
      map.off('mousemove')
      map.off('mouseup') 
      map.off('click')
      map.getContainer().style.cursor = ''
      map.dragging.enable()
      map.doubleClickZoom.enable()
    }

    function setupRectangleDrawing() {
      let startLatLng: L.LatLng | null = null
      let rectangle: L.Rectangle | null = null

      const onMouseDown = (e: L.LeafletMouseEvent) => {
        startLatLng = e.latlng
        isDrawingRef.current = true
        console.log('Rectangle drawing started at:', startLatLng)
      }

      const onMouseMove = (e: L.LeafletMouseEvent) => {
        if (!isDrawingRef.current || !startLatLng) return

        if (rectangle) {
          drawnItemsRef.current.removeLayer(rectangle)
        }

        const bounds = L.latLngBounds(startLatLng, e.latlng)
        rectangle = L.rectangle(bounds, {
          color: '#3388ff',
          fillColor: '#3388ff',
          fillOpacity: 0.2,
          weight: 2
        })
        drawnItemsRef.current.addLayer(rectangle)
      }

      const onMouseUp = () => {
        if (!isDrawingRef.current || !startLatLng || !rectangle) return

        console.log('Rectangle drawing completed')
        isDrawingRef.current = false

        const bounds = rectangle.getBounds()
        const coordinates = [[
          [bounds.getSouthWest().lng, bounds.getSouthWest().lat],
          [bounds.getSouthEast().lng, bounds.getSouthEast().lat],
          [bounds.getNorthEast().lng, bounds.getNorthEast().lat],
          [bounds.getNorthWest().lng, bounds.getNorthWest().lat],
          [bounds.getSouthWest().lng, bounds.getSouthWest().lat] 
        ]]

        const shapeData = {
          type: 'Feature',
          geometry: {
            type: 'Polygon',
            coordinates: coordinates
          },
          properties: {
            type: 'rectangle',
            createdAt: new Date().toISOString(),
            id: `shape_${Date.now()}`,
            color: '#3388ff',
            fillColor: '#3388ff',
            fillOpacity: 0.2
          }
        }

        console.log('Rectangle shape created:', shapeData)
        onShapeCreated(shapeData)

        startLatLng = null
        rectangle = null
      }

      map.on('mousedown', onMouseDown)
      map.on('mousemove', onMouseMove)
      map.on('mouseup', onMouseUp)
    }

    function setupPolygonDrawing() {
      let points: L.LatLng[] = []
      let tempLine: L.Polyline | null = null
      let polygon: L.Polygon | null = null
      let markers: L.CircleMarker[] = []

      const onMapClick = (e: L.LeafletMouseEvent) => {
        L.DomEvent.stopPropagation(e.originalEvent)
        
        points.push(e.latlng)
        console.log('Polygon point added:', e.latlng, 'Total points:', points.length)

        if (tempLine) {
          drawnItemsRef.current.removeLayer(tempLine)
        }

        if (points.length > 1) {
          tempLine = L.polyline(points, {
            color: '#3388ff',
            weight: 2,
            dashArray: '5, 5'
          })
          drawnItemsRef.current.addLayer(tempLine)
        }

        const marker = L.circleMarker(e.latlng, {
          radius: 4,
          color: '#3388ff',
          fillColor: '#3388ff',
          fillOpacity: 1
        })
        markers.push(marker)
        drawnItemsRef.current.addLayer(marker)

        if (points.length === 1) {
          console.log('🔷 Polygon started! Click more points, then double-click to finish')
        } else if (points.length >= 3) {
          console.log(`🔷 ${points.length} points added. Double-click to finish polygon.`)
        }
      }

      const onMapDoubleClick = (e: L.LeafletMouseEvent) => {
        L.DomEvent.stopPropagation(e.originalEvent)
        
        if (points.length < 3) {
          console.log('Need at least 3 points for polygon. Current points:', points.length)
          return
        }

        console.log('Polygon drawing completed with', points.length, 'points')

        if (tempLine) drawnItemsRef.current.removeLayer(tempLine)
        markers.forEach(marker => drawnItemsRef.current.removeLayer(marker))

        polygon = L.polygon(points, {
          color: '#3388ff',
          fillColor: '#3388ff',
          fillOpacity: 0.2,
          weight: 2
        })
        drawnItemsRef.current.addLayer(polygon)

        const coordinates = [points.map(p => [p.lng, p.lat])]
        coordinates[0].push(coordinates[0][0]) 

        const shapeData = {
          type: 'Feature',
          geometry: {
            type: 'Polygon',
            coordinates: coordinates
          },
          properties: {
            type: 'polygon',
            createdAt: new Date().toISOString(),
            id: `shape_${Date.now()}`,
            color: '#3388ff',
            fillColor: '#3388ff',
            fillOpacity: 0.2
          }
        }

        console.log('Polygon shape created:', shapeData)
        onShapeCreated(shapeData)

        points = []
        tempLine = null
        polygon = null
        markers = []
      }

      map.on('click', onMapClick)
      map.on('dblclick', onMapDoubleClick)
      
      console.log('Polygon drawing mode active. Click to add points, double-click to finish.')
    }

    function setupCircleDrawing() {
      let centerLatLng: L.LatLng | null = null
      let circle: L.Circle | null = null

      const onMouseDown = (e: L.LeafletMouseEvent) => {
        centerLatLng = e.latlng
        isDrawingRef.current = true
        console.log('Circle drawing started at:', centerLatLng)
      }

      const onMouseMove = (e: L.LeafletMouseEvent) => {
        if (!isDrawingRef.current || !centerLatLng) return

        if (circle) {
          drawnItemsRef.current.removeLayer(circle)
        }

        const radius = centerLatLng.distanceTo(e.latlng)

        circle = L.circle(centerLatLng, {
          radius: radius,
          color: '#3388ff',
          fillColor: '#3388ff',
          fillOpacity: 0.2,
          weight: 2
        })
        drawnItemsRef.current.addLayer(circle)
      }

      const onMouseUp = () => {
        if (!isDrawingRef.current || !centerLatLng || !circle) return

        console.log('Circle drawing completed')
        isDrawingRef.current = false

        const radius = circle.getRadius()

        const shapeData = {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [centerLatLng.lng, centerLatLng.lat]
          },
          properties: {
            type: 'circle',
            radius: radius,
            createdAt: new Date().toISOString(),
            id: `shape_${Date.now()}`,
            color: '#3388ff',
            fillColor: '#3388ff',
            fillOpacity: 0.2
          }
        }

        console.log('Circle shape created:', shapeData)
        onShapeCreated(shapeData)

        centerLatLng = null
        circle = null
      }

      map.on('mousedown', onMouseDown)
      map.on('mousemove', onMouseMove)
      map.on('mouseup', onMouseUp)
    }

  }, [map, selectedTool, onShapeCreated])

  useEffect(() => {
    if (!map) return

    const drawnItems = drawnItemsRef.current
    
    drawnItems.clearLayers()
    console.log('Cleared existing shape layers for update')

    if (!savedShapes.length) {
      console.log('No shapes to render')
      return
    }

    console.log('🎨 Rendering shapes with pollution data:', savedShapes.length)

    savedShapes.forEach(shape => {
      try {
        console.log('Loading shape:', shape)
        

        let geoJsonShape
        let geometry
        
        if (typeof shape.geometry === 'string') {
          try {
            geometry = JSON.parse(shape.geometry)
          } catch (e) {
            console.error('Failed to parse geometry string:', shape.geometry)
            return
          }
        } else {
          geometry = shape.geometry
        }
        
        if (!geometry || !geometry.type || !geometry.coordinates) {
          console.warn('Invalid geometry:', geometry)
          return
        }
        
        if (shape.type === 'Feature') {
          geoJsonShape = shape
        } else {
          geoJsonShape = {
            type: 'Feature',
            geometry: geometry,
            properties: {
              id: shape.id,
              name: shape.name,
              type: shape.type,
              color: '#3388ff',
              fillColor: '#3388ff',
              fillOpacity: 0.2,
              ...shape.properties
            }
          }
        }

        console.log('Processed GeoJSON:', geoJsonShape)

        let layer
        
        const isCircle = shape.type === 'CIRCLE' || geoJsonShape.properties?.type === 'CIRCLE'
        
        if (isCircle) {
          console.log('Loading as circle (legacy fix applied)')
          
          const pollutionColor = shape.pollutionLevel ? getPollutionColor(shape.pollutionLevel) : '#3388ff'
          const isHighAlert = shape.alertLevel === 'high' || shape.alertLevel === 'critical'
          
          if (geometry.type === 'Point') {
            const [lng, lat] = geometry.coordinates
            const radius = shape.radius || geoJsonShape.properties?.radius || 100
            layer = L.circle([lat, lng], {
              radius: radius,
              color: pollutionColor,
              fillColor: pollutionColor,
              fillOpacity: isHighAlert ? 0.3 : 0.2,
              weight: isHighAlert ? 3 : 2,
              dashArray: shape.alertLevel === 'critical' ? '10, 5' : undefined
            })
          } else if (geometry.type === 'Polygon') {
            console.warn('Found circle stored as polygon - fixing legacy data:', shape.name || geoJsonShape.properties?.name || `ID: ${shape.id}`)
            const coords = geometry.coordinates[0]
            
            let minLng = coords[0][0], maxLng = coords[0][0]
            let minLat = coords[0][1], maxLat = coords[0][1]
            
            coords.forEach((coord: number[]) => {
              minLng = Math.min(minLng, coord[0])
              maxLng = Math.max(maxLng, coord[0])
              minLat = Math.min(minLat, coord[1])
              maxLat = Math.max(maxLat, coord[1])
            })
            
            const centerLng = (minLng + maxLng) / 2
            const centerLat = (minLat + maxLat) / 2
            
            const radius = Math.max(
              (maxLng - minLng) * 111320 / 2, 
              (maxLat - minLat) * 111320 / 2
            )
            
            layer = L.circle([centerLat, centerLng], {
              radius: radius,
              color: pollutionColor,
              fillColor: pollutionColor,
              fillOpacity: isHighAlert ? 0.3 : 0.2,
              weight: isHighAlert ? 3 : 2,
              dashArray: shape.alertLevel === 'critical' ? '10, 5' : undefined
            })
            
            console.log(`Legacy circle converted: center [${centerLat}, ${centerLng}], radius ${radius}m`)
          }
        } else {

          const pollutionColor = shape.pollutionLevel ? getPollutionColor(shape.pollutionLevel) : '#3388ff'
          const isHighAlert = shape.alertLevel === 'high' || shape.alertLevel === 'critical'
          
          layer = L.geoJSON(geoJsonShape, {
            style: {
              color: pollutionColor,
              fillColor: pollutionColor,
              fillOpacity: isHighAlert ? 0.3 : 0.2,
              weight: isHighAlert ? 3 : 2,
              dashArray: shape.alertLevel === 'critical' ? '10, 5' : undefined
            }
          })
        }
        
        if (layer) {
          const addClickHandler = (leafletLayer: any) => {
            if (leafletLayer && typeof leafletLayer.on === 'function' && onShapeClick) {
              leafletLayer.on('click', (e: L.LeafletMouseEvent) => {
                L.DomEvent.stopPropagation(e)
                if (selectedSensor) {
                  console.log('🚫 Shape click prevented - sensor placement mode active:', selectedSensor.sensorId)
                  return
                }
                
                console.log('✅ Shape clicked:', shape.id || geoJsonShape.properties?.id)
                onShapeClick(shape.id || geoJsonShape.properties?.id)
              })
            }
          }

          if ('eachLayer' in layer && typeof layer.eachLayer === 'function') {
            layer.eachLayer((l: any) => {
              addClickHandler(l)
              drawnItems.addLayer(l)
            })
          } else {
            addClickHandler(layer)
            drawnItems.addLayer(layer)
          }
        }
      } catch (error) {
        console.error('Error loading saved shape:', error, shape)
      }
    })
  }, [map, savedShapes])

  function setupClientRectangleDrawing() {
    let startPoint: L.LatLng | null = null
    let rectangle: L.Rectangle | null = null

    const onMouseDown = (e: L.LeafletMouseEvent) => {
      startPoint = e.latlng
      isDrawingRef.current = true
    }

    const onMouseMove = (e: L.LeafletMouseEvent) => {
      if (!isDrawingRef.current || !startPoint) return
      
      if (rectangle) {
        drawnItemsRef.current.removeLayer(rectangle)
      }
      
      const bounds = L.latLngBounds(startPoint, e.latlng)
      rectangle = L.rectangle(bounds, { color: '#3b82f6', fillOpacity: 0.2 })
      drawnItemsRef.current.addLayer(rectangle)
    }

    const onMouseUp = () => {
      if (!isDrawingRef.current || !startPoint) return
      
      isDrawingRef.current = false
      
      if (rectangle && onClientZoneCreated) {
        const bounds = rectangle.getBounds()
        const clientZone: ClientZone = {
          id: `client-zone-${Date.now()}`,
          name: `Rectangle ${new Date().toLocaleTimeString()}`,
          type: 'rectangle',
          geometry: {
            type: 'Polygon',
            coordinates: [[
              [bounds.getWest(), bounds.getSouth()],
              [bounds.getEast(), bounds.getSouth()],
              [bounds.getEast(), bounds.getNorth()],
              [bounds.getWest(), bounds.getNorth()],
              [bounds.getWest(), bounds.getSouth()]
            ]]
          },
          selected: false,
          color: '#3b82f6',
          created: new Date()
        }
        onClientZoneCreated(clientZone)
      }
      
      startPoint = null
      rectangle = null
    }

    map.on('mousedown', onMouseDown)
    map.on('mousemove', onMouseMove)
    map.on('mouseup', onMouseUp)
  }

  function setupClientPolygonDrawing() {
    const points: L.LatLng[] = []
    const markers: L.Marker[] = []
    let polygon: L.Polygon | null = null

    const onMapClick = (e: L.LeafletMouseEvent) => {
      points.push(e.latlng)
      
      const marker = L.marker(e.latlng, { 
        icon: L.divIcon({ className: 'client-zone-point', html: '<div style="width:8px;height:8px;background:#3b82f6;border-radius:50%;"></div>' })
      })
      markers.push(marker)
      drawnItemsRef.current.addLayer(marker)
      
      if (points.length >= 2) {
        if (polygon) {
          drawnItemsRef.current.removeLayer(polygon)
        }
        polygon = L.polygon([...points], { color: '#3b82f6', fillOpacity: 0.2 })
        drawnItemsRef.current.addLayer(polygon)
      }
    }

    const onMapDoubleClick = () => {
      if (points.length >= 3 && onClientZoneCreated) {
        const coordinates = points.map(p => [p.lng, p.lat])
        coordinates.push(coordinates[0]) // Close the polygon
        
        const clientZone: ClientZone = {
          id: `client-zone-${Date.now()}`,
          name: `Polygon ${new Date().toLocaleTimeString()}`,
          type: 'polygon',
          geometry: {
            type: 'Polygon',
            coordinates: [coordinates]
          },
          selected: false,
          color: '#3b82f6',
          created: new Date()
        }
        onClientZoneCreated(clientZone)
      }
      
      markers.forEach(m => drawnItemsRef.current.removeLayer(m))
      if (polygon) drawnItemsRef.current.removeLayer(polygon)
      points.length = 0
      markers.length = 0
      polygon = null
    }

    map.on('click', onMapClick)
    map.on('dblclick', onMapDoubleClick)
  }

  function setupClientCircleDrawing() {
    let center: L.LatLng | null = null
    let circle: L.Circle | null = null

    const onMouseDown = (e: L.LeafletMouseEvent) => {
      center = e.latlng
      isDrawingRef.current = true
    }

    const onMouseMove = (e: L.LeafletMouseEvent) => {
      if (!isDrawingRef.current || !center) return
      
      if (circle) {
        drawnItemsRef.current.removeLayer(circle)
      }
      
      const radius = center.distanceTo(e.latlng)
      circle = L.circle(center, { radius, color: '#3b82f6', fillOpacity: 0.2 })
      drawnItemsRef.current.addLayer(circle)
    }

    const onMouseUp = (e: L.LeafletMouseEvent) => {
      if (!isDrawingRef.current || !center) return
      
      isDrawingRef.current = false
      
      if (circle && onClientZoneCreated) {
        const radius = center.distanceTo(e.latlng)
        const clientZone: ClientZone = {
          id: `client-zone-${Date.now()}`,
          name: `Circle ${new Date().toLocaleTimeString()}`,
          type: 'circle',
          geometry: {
            type: 'Point',
            coordinates: [center.lng, center.lat],
            properties: { radius }
          },
          selected: false,
          color: '#3b82f6',
          created: new Date()
        }
        onClientZoneCreated(clientZone)
      }
      
      center = null
      circle = null
    }

    map.on('mousedown', onMouseDown)
    map.on('mousemove', onMouseMove)
    map.on('mouseup', onMouseUp)
  }

  useEffect(() => {
    if (!map || !clientZones) return

    const clientZoneLayer = new L.FeatureGroup()
    map.addLayer(clientZoneLayer)

    clientZones.forEach(zone => {
      try {
        let layer: L.Layer | null = null
        
        if (zone.type === 'rectangle') {
          const coords = zone.geometry.coordinates[0]
          const bounds = L.latLngBounds([
            [coords[0][1], coords[0][0]],
            [coords[2][1], coords[2][0]]
          ])
          layer = L.rectangle(bounds, {
            color: zone.color,
            fillOpacity: zone.selected ? 0.4 : 0.2,
            weight: zone.selected ? 3 : 2
          })
        } else if (zone.type === 'polygon') {
          const coords = zone.geometry.coordinates[0].map(([lng, lat]: [number, number]) => [lat, lng])
          layer = L.polygon(coords, {
            color: zone.color,
            fillOpacity: zone.selected ? 0.4 : 0.2,
            weight: zone.selected ? 3 : 2
          })
        } else if (zone.type === 'circle') {
          const [lng, lat] = zone.geometry.coordinates
          const radius = zone.geometry.properties?.radius || 100
          layer = L.circle([lat, lng], {
            radius,
            color: zone.color,
            fillOpacity: zone.selected ? 0.4 : 0.2,
            weight: zone.selected ? 3 : 2
          })
        }
        
        if (layer && onClientZoneClick) {
          layer.on('click', () => onClientZoneClick(zone.id))
          clientZoneLayer.addLayer(layer)
        }
      } catch (error) {
        console.error('Error rendering client zone:', error, zone)
      }
    })

    return () => {
      map.removeLayer(clientZoneLayer)
    }
  }, [map, clientZones, onClientZoneClick])

  return null
}

function SensorControls({ sensors }: SensorControlsProps) {
  const map = useMap()
  const sensorLayersRef = useRef<L.LayerGroup>(new L.LayerGroup())

  const createSensorIcon = (sensor: Sensor) => {
    const sensorInfo = getSensorTypeInfo(sensor.type)
    const color = sensorInfo?.color || '#3388ff'
    
    
    const iconHtml = `
      <div style="
        width: 46px;
        height: 46px;
        background-color: ${sensor.active ? color : '#9ca3af'};
        border-radius: 50%;
        border: 4px solid white;
        box-shadow: 0 6px 20px rgba(0,0,0,0.3), 0 2px 8px rgba(0,0,0,0.2);
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
        opacity: ${sensor.active ? '1' : '0.75'};
      ">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5">
          ${getSensorIconSvg(sensor.type)}
        </svg>
        <div style="
          position: absolute;
          top: -3px;
          right: -3px;
          width: 16px;
          height: 16px;
          background-color: ${sensor.active ? '#22c55e' : '#ef4444'};
          border: 3px solid white;
          border-radius: 50%;
          box-shadow: 0 2px 8px rgba(0,0,0,0.25);
        "></div>
      </div>
    `

    return L.divIcon({
      html: iconHtml,
      className: 'custom-sensor-icon',
      iconSize: [46, 46],
      iconAnchor: [23, 23],
      popupAnchor: [0, -23]
    })
  }

  const getSensorIconSvg = (type: Sensor['type']) => {
    switch (type) {
      case 'TEMPERATURE':
        return '<path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 13.5a4 4 0 1 0 4 0V5a2 2 0 1 0-4 0v8.5z"/><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 9h4"/>'
      case 'HUMIDITY':
        return '<path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 18a4.6 4.4 0 0 1 0 -9a5 4.5 0 0 1 11 2h1a3.5 3.5 0 0 1 0 7h-12"/><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 13v2m0 3v2m4 -5v2m0 3v2"/>'
      case 'AIR_QUALITY':
        return '<path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 8h8.5a2.5 2.5 0 1 0 -2.34 -3.24"/><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12h15.5a2.5 2.5 0 1 1 -2.34 3.24"/><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16h5.5a2.5 2.5 0 1 1 -2.34 3.24"/>'
      case 'LIGHT':
        return '<path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 12m-4 0a4 4 0 1 0 8 0a4 4 0 1 0 -8 0"/><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12h1m8 -9v1m8 8h1m-9 8v1m-6.4 -15.4l.7 .7m12.1 -.7l-.7 .7m0 11.4l.7 .7m-12.1 -.7l-.7 .7"/>'
      case 'NOISE':
        return '<path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 8a5 5 0 0 1 0 8"/><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.7 5a9 9 0 0 1 0 14"/><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 15h-2a1 1 0 0 1 -1 -1v-4a1 1 0 0 1 1 -1h2l3.5 -4.5a.8 .8 0 0 1 1.5 .5v14a.8 .8 0 0 1 -1.5 .5l-3.5 -4.5"/>'
      case 'CO2':
        return '<path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M3 21h18"/><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 21v-8h6v8m4 0v-10h6v10"/><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M7 10v-4m10 1v-4"/><circle stroke="currentColor" stroke-width="2" fill="currentColor" cx="7" cy="4" r="1"/><circle stroke="currentColor" stroke-width="2" fill="currentColor" cx="17" cy="5" r="1"/>'
      default:
        return '<circle stroke="currentColor" stroke-width="2" fill="none" cx="12" cy="12" r="4"/>'
    }
  }

  useEffect(() => {
    if (!map) return

    const sensorLayers = sensorLayersRef.current
    map.addLayer(sensorLayers)

    return () => {
      if (map.hasLayer(sensorLayers)) {
        map.removeLayer(sensorLayers)
      }
    }
  }, [map])

  useEffect(() => {
    if (!map) return

    const sensorLayers = sensorLayersRef.current
    sensorLayers.clearLayers()

    sensors.forEach(sensor => {
      if (sensor.latitude !== null && sensor.longitude !== null && 
          sensor.latitude !== undefined && sensor.longitude !== undefined) {
        
        const sensorInfo = getSensorTypeInfo(sensor.type)
        const marker = L.marker([sensor.latitude, sensor.longitude], {
          icon: createSensorIcon(sensor)
        })

        const popupContent = `
          <div style="min-width: 200px;">
            <h3 style="margin: 0 0 8px 0; color: ${sensorInfo?.color || '#333'};">
              ${sensorInfo?.label || sensor.type} Sensor
            </h3>
            <p style="margin: 4px 0;"><strong>ID:</strong> ${sensor.sensorId}</p>
            <p style="margin: 4px 0;"><strong>Status:</strong> 
              <span style="color: ${sensor.active ? '#22c55e' : '#ef4444'};">
                ${sensor.active ? 'Active' : 'Inactive'}
              </span>
            </p>
            <p style="margin: 4px 0;"><strong>Location:</strong> ${sensor.latitude.toFixed(6)}, ${sensor.longitude.toFixed(6)}</p>
            <p style="margin: 4px 0;"><strong>Created:</strong> ${new Date(sensor.createdAt).toLocaleDateString()}</p>
          </div>
        `

        marker.bindPopup(popupContent)
        sensorLayers.addLayer(marker)
      }
    })

  }, [map, sensors])

  return null
}

function SensorPlacementControls({ selectedSensor, onSensorPlaced }: SensorPlacementControlsProps) {
  const map = useMap()

  useEffect(() => {
    if (!map || !selectedSensor) return

    console.log('🎯 Activating sensor placement mode for:', selectedSensor.sensorId)
    
    map.getContainer().style.cursor = 'crosshair'

    const onMapClick = (e: L.LeafletMouseEvent) => {
      L.DomEvent.stopPropagation(e)
      console.log('🎯 Sensor placement click detected at:', e.latlng)
      
      if (selectedSensor) {
        onSensorPlaced(selectedSensor, e.latlng.lat, e.latlng.lng)
      }
    }

    map.on('click', onMapClick)
    
    map.dragging.disable()
    map.doubleClickZoom.disable()

    return () => {
      console.log('🎯 Deactivating sensor placement mode')
      map.off('click', onMapClick)
      map.getContainer().style.cursor = ''
      map.dragging.enable()
      map.doubleClickZoom.enable()
    }
  }, [map, selectedSensor, onSensorPlaced])

  return null
}

export default function Map({ 
  selectedTool, 
  onShapeCreated, 
  savedShapes = [],
  className = "h-full w-full",
  showSensors = true,
  selectedSensor,
  onSensorPlaced,
  refreshSensors,
  clientZones = [],
  onClientZoneCreated,
  onClientZoneClick
}: MapProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [sensors, setSensors] = useState<Sensor[]>([])
  const [selectedShapeData, setSelectedShapeData] = useState<any>(null)
  const [loadingShapeDetails, setLoadingShapeDetails] = useState(false)
  
  const addSuccessNotification = useSuccessNotification()
  const addErrorNotification = useErrorNotification()

  const handleMapReady = useCallback(() => {
    setIsLoading(false)
  }, [])

  const loadSensors = useCallback(async () => {
    if (!showSensors) return
    
    try {
      const response = await sensorsApi.getSensors()
      if (response.success && response.data) {
        setSensors(response.data.sensors)
      }
    } catch (error) {
      console.error('Failed to load sensors:', error)
    }
  }, [showSensors])

  useEffect(() => {
    loadSensors()
  }, [loadSensors])

  useEffect(() => {
    if (refreshSensors) {
      loadSensors()
    }
  }, [refreshSensors, loadSensors])

  const handleSensorPlaced = (sensor: Sensor, lat: number, lng: number) => {
    if (onSensorPlaced) {
      onSensorPlaced(sensor, lat, lng)
      addSuccessNotification(
        'Sensor Placed',
        `${sensor.sensorId} positioned successfully`,
        { icon: 'tabler:map-pin-plus', duration: 3000 }
      )
    }
  }


  const handleShapeClick = async (shapeId: number) => {
    if (selectedTool || selectedSensor) {
      console.log('🚫 Shape click blocked - in drawing/placement mode:', { selectedTool, selectedSensor: selectedSensor?.sensorId })
      return
    }
    
    try {
      setLoadingShapeDetails(true)
      console.log('Fetching fresh details for shape:', shapeId)
      
      const response = await shapesApi.getShapeDetails(shapeId)
      if (response.success && response.data) {
        setSelectedShapeData(response.data)
        

        if (refreshSensors) {
          refreshSensors()
        }
        
      } else {
        console.error('Failed to load shape details:', response)
        addErrorNotification(
          'Error Loading Shape',
          'Failed to load detailed pollution analysis for this area'
        )
      }
    } catch (error) {
      console.error('Error loading shape details:', error)
    } finally {
      setLoadingShapeDetails(false)
    }
  }

  if (typeof window === 'undefined') {
    return (
      <div className={`${className} flex items-center justify-center bg-content1`}>
        <div className="text-center">
          <p className="text-foreground/60">Loading map...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`relative ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 bg-content1 flex items-center justify-center z-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-foreground/60">Loading map...</p>
          </div>
        </div>
      )}

      {selectedSensor && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-[1000] bg-warning/90 backdrop-blur-md text-white px-6 py-3 rounded-lg border border-warning-600 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-white animate-pulse"></div>
            <div className="flex items-center gap-2">
              <Icon icon="tabler:map-pin-plus" className="text-lg" />
              <span className="text-sm font-medium">
                Placing Sensor: {selectedSensor.sensorId}
              </span>
            </div>
            <div className="text-xs opacity-75">
              Click anywhere on the map to place
            </div>
          </div>
        </div>
      )}

      {selectedTool && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-[1000] bg-primary/90 backdrop-blur-md text-white px-4 py-2 rounded-lg border border-primary-600 shadow-lg">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-white animate-pulse"></div>
            <span className="text-sm font-medium">
              {selectedTool.charAt(0).toUpperCase() + selectedTool.slice(1)} Drawing Mode Active
            </span>
          </div>
        </div>
      )}

      <MapContainer
        center={[51.505, -0.09]}
        zoom={13}
        style={{ height: "100%", width: "100%" }}
        className="rounded-lg"
        whenReady={handleMapReady}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <DrawingControls 
          selectedTool={selectedTool}
          onShapeCreated={onShapeCreated}
          savedShapes={savedShapes}
          onShapeClick={handleShapeClick}
          selectedSensor={selectedSensor}
          clientZones={clientZones}
          onClientZoneCreated={onClientZoneCreated}
          onClientZoneClick={onClientZoneClick}
        />
        
        {showSensors && (
          <SensorControls 
            sensors={sensors}
          />
        )}
        
        {selectedSensor && (
          <SensorPlacementControls 
            selectedSensor={selectedSensor}
            onSensorPlaced={handleSensorPlaced}
            sensors={sensors}
          />
        )}
      </MapContainer>

      {selectedShapeData && (
        <div className="absolute top-4 right-4 w-96 max-h-[calc(100%-2rem)] overflow-y-auto z-[1000]">
          <ShapeCard 
            shapeData={selectedShapeData}
            onClose={() => setSelectedShapeData(null)}
          />
        </div>
      )}

      {loadingShapeDetails && (
        <div className="absolute top-4 right-4 w-96 z-[1000]">
          <div className="bg-background/95 backdrop-blur-md border border-divider rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mr-3"></div>
              <span className="text-foreground">Loading shape details...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}