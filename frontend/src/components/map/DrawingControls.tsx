import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";

import { ClientZone } from "@/types/geometry";
import { getPollutionColor } from "@/lib/sensorsApi";

interface DrawingControlsProps {
  selectedTool: string | null;
  onShapeCreated: (shape: any) => void;
  savedShapes: any[];
  onShapeClick?: (shapeId: number) => void;
  selectedSensor?: any | null;
  clientZones?: ClientZone[];
  onClientZoneCreated?: (zone: ClientZone) => void;
  onClientZoneClick?: (zoneId: string) => void;
}

export default function DrawingControls({
  selectedTool,
  onShapeCreated,
  savedShapes,
  onShapeClick,
  selectedSensor,
  clientZones,
  onClientZoneCreated,
  onClientZoneClick,
}: DrawingControlsProps) {
  const map = useMap();
  const drawnItemsRef = useRef<L.FeatureGroup>(new L.FeatureGroup());
  const isDrawingRef = useRef(false);

  useEffect(() => {
    if (!map) return;

    const drawnItems = drawnItemsRef.current;

    map.addLayer(drawnItems);

    return () => {
      if (map.hasLayer(drawnItems)) {
        map.removeLayer(drawnItems);
      }
    };
  }, [map]);

  useEffect(() => {
    if (!map) return;

    map.off("mousedown");
    map.off("mousemove");
    map.off("mouseup");
    map.off("click");

    if (selectedTool) {

      map.getContainer().style.cursor = "crosshair";
      map.dragging.disable();
      map.doubleClickZoom.disable();

      if (selectedTool === "rectangle") {
        setupRectangleDrawing();
      } else if (selectedTool === "polygon") {
        setupPolygonDrawing();
      } else if (selectedTool === "circle") {
        setupCircleDrawing();
      } else if (selectedTool === "geo-rectangle") {
        setupClientRectangleDrawing();
      } else if (selectedTool === "geo-polygon") {
        setupClientPolygonDrawing();
      } else if (selectedTool === "geo-circle") {
        setupClientCircleDrawing();
      }
    } else {
      map.getContainer().style.cursor = "";
      map.dragging.enable();
      map.doubleClickZoom.enable();
      isDrawingRef.current = false;
    }

    return () => {
      map.off("mousedown");
      map.off("mousemove");
      map.off("mouseup");
      map.off("click");
      map.getContainer().style.cursor = "";
      map.dragging.enable();
      map.doubleClickZoom.enable();
    };

    function setupRectangleDrawing() {
      let startLatLng: L.LatLng | null = null;
      let rectangle: L.Rectangle | null = null;

      const onMouseDown = (e: L.LeafletMouseEvent) => {
        startLatLng = e.latlng;
        isDrawingRef.current = true;
      };

      const onMouseMove = (e: L.LeafletMouseEvent) => {
        if (!isDrawingRef.current || !startLatLng) return;

        if (rectangle) {
          drawnItemsRef.current.removeLayer(rectangle);
        }

        const bounds = L.latLngBounds(startLatLng, e.latlng);

        rectangle = L.rectangle(bounds, {
          color: "#3388ff",
          fillColor: "#3388ff",
          fillOpacity: 0.2,
          weight: 2,
        });
        drawnItemsRef.current.addLayer(rectangle);
      };

      const onMouseUp = () => {
        if (!isDrawingRef.current || !startLatLng || !rectangle) return;

        isDrawingRef.current = false;
        const bounds = rectangle.getBounds();

        const shapeData = {
          type: "Feature",
          geometry: {
            type: "Polygon",
            coordinates: [
              [
                [bounds.getSouthWest().lng, bounds.getSouthWest().lat],
                [bounds.getSouthEast().lng, bounds.getSouthEast().lat],
                [bounds.getNorthEast().lng, bounds.getNorthEast().lat],
                [bounds.getNorthWest().lng, bounds.getNorthWest().lat],
                [bounds.getSouthWest().lng, bounds.getSouthWest().lat],
              ],
            ],
          },
          properties: {
            type: "rectangle",
            createdAt: new Date().toISOString(),
            id: `shape_${Date.now()}`,
            color: "#3388ff",
            fillColor: "#3388ff",
            fillOpacity: 0.2,
          },
        };

        onShapeCreated(shapeData);
        startLatLng = null;
        rectangle = null;
      };

      map.on("mousedown", onMouseDown);
      map.on("mousemove", onMouseMove);
      map.on("mouseup", onMouseUp);
    }

    function setupPolygonDrawing() {
      let points: L.LatLng[] = [];
      let tempLine: L.Polyline | null = null;
      let polygon: L.Polygon | null = null;
      let markers: L.CircleMarker[] = [];

      const onMapClick = (e: L.LeafletMouseEvent) => {
        L.DomEvent.stopPropagation(e.originalEvent);
        points.push(e.latlng);

        if (tempLine) {
          drawnItemsRef.current.removeLayer(tempLine);
        }

        if (points.length > 1) {
          tempLine = L.polyline(points, {
            color: "#3388ff",
            weight: 2,
            dashArray: "5, 5",
          });
          drawnItemsRef.current.addLayer(tempLine);
        }

        const marker = L.circleMarker(e.latlng, {
          radius: 4,
          color: "#3388ff",
          fillColor: "#3388ff",
          fillOpacity: 1,
        });

        markers.push(marker);
        drawnItemsRef.current.addLayer(marker);
      };

      const onMapDoubleClick = (e: L.LeafletMouseEvent) => {
        L.DomEvent.stopPropagation(e.originalEvent);

        if (points.length < 3) return;

        if (tempLine) drawnItemsRef.current.removeLayer(tempLine);
        markers.forEach((marker) => drawnItemsRef.current.removeLayer(marker));

        polygon = L.polygon(points, {
          color: "#3388ff",
          fillColor: "#3388ff",
          fillOpacity: 0.2,
          weight: 2,
        });
        drawnItemsRef.current.addLayer(polygon);

        const coordinates = [points.map((p) => [p.lng, p.lat])];

        coordinates[0].push(coordinates[0][0]);

        const shapeData = {
          type: "Feature",
          geometry: {
            type: "Polygon",
            coordinates: coordinates,
          },
          properties: {
            type: "polygon",
            createdAt: new Date().toISOString(),
            id: `shape_${Date.now()}`,
            color: "#3388ff",
            fillColor: "#3388ff",
            fillOpacity: 0.2,
          },
        };

        onShapeCreated(shapeData);
        points = [];
        tempLine = null;
        polygon = null;
        markers = [];
      };

      map.on("click", onMapClick);
      map.on("dblclick", onMapDoubleClick);
    }

    function setupCircleDrawing() {
      let centerLatLng: L.LatLng | null = null;
      let circle: L.Circle | null = null;

      const onMouseDown = (e: L.LeafletMouseEvent) => {
        centerLatLng = e.latlng;
        isDrawingRef.current = true;
      };

      const onMouseMove = (e: L.LeafletMouseEvent) => {
        if (!isDrawingRef.current || !centerLatLng) return;

        if (circle) {
          drawnItemsRef.current.removeLayer(circle);
        }

        const radius = centerLatLng.distanceTo(e.latlng);

        circle = L.circle(centerLatLng, {
          radius: radius,
          color: "#3388ff",
          fillColor: "#3388ff",
          fillOpacity: 0.2,
          weight: 2,
        });
        drawnItemsRef.current.addLayer(circle);
      };

      const onMouseUp = () => {
        if (!isDrawingRef.current || !centerLatLng || !circle) return;

        isDrawingRef.current = false;
        const radius = circle.getRadius();

        const shapeData = {
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: [centerLatLng.lng, centerLatLng.lat],
          },
          properties: {
            type: "circle",
            radius: radius,
            createdAt: new Date().toISOString(),
            id: `shape_${Date.now()}`,
            color: "#3388ff",
            fillColor: "#3388ff",
            fillOpacity: 0.2,
          },
        };

        onShapeCreated(shapeData);
        centerLatLng = null;
        circle = null;
      };

      map.on("mousedown", onMouseDown);
      map.on("mousemove", onMouseMove);
      map.on("mouseup", onMouseUp);
    }

    function setupClientRectangleDrawing() {
      let startPoint: L.LatLng | null = null;
      let rectangle: L.Rectangle | null = null;

      const onMouseDown = (e: L.LeafletMouseEvent) => {
        startPoint = e.latlng;
        isDrawingRef.current = true;
      };

      const onMouseMove = (e: L.LeafletMouseEvent) => {
        if (!isDrawingRef.current || !startPoint) return;

        if (rectangle) {
          drawnItemsRef.current.removeLayer(rectangle);
        }

        const bounds = L.latLngBounds(startPoint, e.latlng);

        rectangle = L.rectangle(bounds, { color: "#3b82f6", fillOpacity: 0.2 });
        drawnItemsRef.current.addLayer(rectangle);
      };

      const onMouseUp = () => {
        if (!isDrawingRef.current || !startPoint) return;

        isDrawingRef.current = false;

        if (rectangle && onClientZoneCreated) {
          const bounds = rectangle.getBounds();
          const clientZone: ClientZone = {
            id: `client-zone-${Date.now()}`,
            name: `Rectangle ${new Date().toLocaleTimeString()}`,
            type: "rectangle",
            geometry: {
              type: "Polygon",
              coordinates: [
                [
                  [bounds.getWest(), bounds.getSouth()],
                  [bounds.getEast(), bounds.getSouth()],
                  [bounds.getEast(), bounds.getNorth()],
                  [bounds.getWest(), bounds.getNorth()],
                  [bounds.getWest(), bounds.getSouth()],
                ],
              ],
            },
            selected: false,
            color: "#3b82f6",
            created: new Date(),
          };

          onClientZoneCreated(clientZone);
        }

        startPoint = null;
        rectangle = null;
      };

      map.on("mousedown", onMouseDown);
      map.on("mousemove", onMouseMove);
      map.on("mouseup", onMouseUp);
    }

    function setupClientPolygonDrawing() {
      const points: L.LatLng[] = [];
      const markers: L.Marker[] = [];
      let polygon: L.Polygon | null = null;

      const onMapClick = (e: L.LeafletMouseEvent) => {
        points.push(e.latlng);

        const marker = L.marker(e.latlng, {
          icon: L.divIcon({
            className: "client-zone-point",
            html: '<div style="width:8px;height:8px;background:#3b82f6;border-radius:50%;"></div>',
          }),
        });

        markers.push(marker);
        drawnItemsRef.current.addLayer(marker);

        if (points.length >= 2) {
          if (polygon) {
            drawnItemsRef.current.removeLayer(polygon);
          }
          polygon = L.polygon([...points], {
            color: "#3b82f6",
            fillOpacity: 0.2,
          });
          drawnItemsRef.current.addLayer(polygon);
        }
      };

      const onMapDoubleClick = () => {
        if (points.length >= 3 && onClientZoneCreated) {
          const coordinates = points.map((p) => [p.lng, p.lat]);

          coordinates.push(coordinates[0]);

          const clientZone: ClientZone = {
            id: `client-zone-${Date.now()}`,
            name: `Polygon ${new Date().toLocaleTimeString()}`,
            type: "polygon",
            geometry: {
              type: "Polygon",
              coordinates: [coordinates],
            },
            selected: false,
            color: "#3b82f6",
            created: new Date(),
          };

          onClientZoneCreated(clientZone);
        }

        markers.forEach((m) => drawnItemsRef.current.removeLayer(m));
        if (polygon) drawnItemsRef.current.removeLayer(polygon);
        points.length = 0;
        markers.length = 0;
        polygon = null;
      };

      map.on("click", onMapClick);
      map.on("dblclick", onMapDoubleClick);
    }

    function setupClientCircleDrawing() {
      let center: L.LatLng | null = null;
      let circle: L.Circle | null = null;

      const onMouseDown = (e: L.LeafletMouseEvent) => {
        center = e.latlng;
        isDrawingRef.current = true;
      };

      const onMouseMove = (e: L.LeafletMouseEvent) => {
        if (!isDrawingRef.current || !center) return;

        if (circle) {
          drawnItemsRef.current.removeLayer(circle);
        }

        const radius = center.distanceTo(e.latlng);

        circle = L.circle(center, {
          radius,
          color: "#3b82f6",
          fillOpacity: 0.2,
        });
        drawnItemsRef.current.addLayer(circle);
      };

      const onMouseUp = (e: L.LeafletMouseEvent) => {
        if (!isDrawingRef.current || !center) return;

        isDrawingRef.current = false;

        if (circle && onClientZoneCreated) {
          const radius = center.distanceTo(e.latlng);
          const clientZone: ClientZone = {
            id: `client-zone-${Date.now()}`,
            name: `Circle ${new Date().toLocaleTimeString()}`,
            type: "circle",
            geometry: {
              type: "Point",
              coordinates: [center.lng, center.lat],
            },
            selected: false,
            color: "#3b82f6",
            created: new Date(),
            radius: radius,
          };

          onClientZoneCreated(clientZone);
        }

        center = null;
        circle = null;
      };

      map.on("mousedown", onMouseDown);
      map.on("mousemove", onMouseMove);
      map.on("mouseup", onMouseUp);
    }
  }, [map, selectedTool, onShapeCreated]);

  useEffect(() => {
    if (!map) return;

    const drawnItems = drawnItemsRef.current;

    drawnItems.clearLayers();

    if (!savedShapes.length) return;

    savedShapes.forEach((shape) => {
      try {
        let geoJsonShape;
        let geometry;

        if (typeof shape.geometry === "string") {
          try {
            geometry = JSON.parse(shape.geometry);
          } catch (error) {
            return;
          }
        } else {
          geometry = shape.geometry;
        }

        if (!geometry || !geometry.type || !geometry.coordinates) {
          return;
        }

        if (shape.type === "Feature") {
          geoJsonShape = shape;
        } else {
          geoJsonShape = {
            type: "Feature",
            geometry: geometry,
            properties: {
              id: shape.id,
              name: shape.name,
              type: shape.type,
              color: "#3388ff",
              fillColor: "#3388ff",
              fillOpacity: 0.2,
              ...shape.properties,
            },
          };
        }

        let layer;
        const isCircle =
          shape.type === "CIRCLE" || geoJsonShape.properties?.type === "CIRCLE";

        const pollutionColor = shape.pollutionLevel
          ? getPollutionColor(shape.pollutionLevel)
          : "#3388ff";
        const isHighAlert =
          shape.alertLevel === "high" || shape.alertLevel === "critical";

        if (isCircle) {
          if (geometry.type === "Point") {
            const [lng, lat] = geometry.coordinates;
            const radius =
              shape.radius || geoJsonShape.properties?.radius || 100;

            layer = L.circle([lat, lng], {
              radius: radius,
              color: pollutionColor,
              fillColor: pollutionColor,
              fillOpacity: isHighAlert ? 0.3 : 0.2,
              weight: isHighAlert ? 3 : 2,
              dashArray: shape.alertLevel === "critical" ? "10, 5" : undefined,
            });
          }
        } else {
          layer = L.geoJSON(geoJsonShape, {
            style: {
              color: pollutionColor,
              fillColor: pollutionColor,
              fillOpacity: isHighAlert ? 0.3 : 0.2,
              weight: isHighAlert ? 3 : 2,
              dashArray: shape.alertLevel === "critical" ? "10, 5" : undefined,
            },
          });
        }

        if (layer) {
          const addClickHandler = (leafletLayer: any) => {
            if (
              leafletLayer &&
              typeof leafletLayer.on === "function" &&
              onShapeClick
            ) {
              leafletLayer.on("click", (e: L.LeafletMouseEvent) => {
                L.DomEvent.stopPropagation(e);
                if (selectedSensor) return;
                onShapeClick(shape.id || geoJsonShape.properties?.id);
              });
            }
          };

          if ("eachLayer" in layer && typeof layer.eachLayer === "function") {
            layer.eachLayer((l: any) => {
              addClickHandler(l);
              drawnItems.addLayer(l);
            });
          } else {
            addClickHandler(layer);
            drawnItems.addLayer(layer);
          }
        }
      } catch (error) {
      }
    });
  }, [map, savedShapes]);

  useEffect(() => {
    if (!map || !clientZones) return;

    const clientZoneLayer = new L.FeatureGroup();

    map.addLayer(clientZoneLayer);

    clientZones.forEach((zone) => {
      try {
        let layer: L.Layer | null = null;

        if (zone.type === "rectangle") {
          const coords = zone.geometry.coordinates[0];
          const bounds = L.latLngBounds([
            [coords[0][1], coords[0][0]],
            [coords[2][1], coords[2][0]],
          ]);

          layer = L.rectangle(bounds, {
            color: zone.color,
            fillOpacity: zone.selected ? 0.4 : 0.2,
            weight: zone.selected ? 3 : 2,
          });
        } else if (zone.type === "polygon") {
          const isOperationResult = !!zone.environmentalAnalysis;

          if (zone.geometry.type === "Polygon") {
            const coords = zone.geometry.coordinates[0].map(
              ([lng, lat]: [number, number]) => [lat, lng],
            );

            layer = L.polygon(coords, {
              color: zone.color,
              fillOpacity: isOperationResult ? 0.6 : zone.selected ? 0.4 : 0.2,
              weight: isOperationResult ? 5 : zone.selected ? 3 : 2,
            });
          } else if (zone.geometry.type === "MultiPolygon") {
            const multiCoords = zone.geometry.coordinates.map((polygon: any) =>
              polygon[0].map(([lng, lat]: [number, number]) => [lat, lng]),
            );

            layer = L.polygon(multiCoords, {
              color: zone.color,
              fillOpacity: isOperationResult ? 0.6 : zone.selected ? 0.4 : 0.2,
              weight: isOperationResult ? 5 : zone.selected ? 3 : 2,
            });
          }
        } else if (zone.type === "circle") {
          const [lng, lat] = zone.geometry.coordinates;
          const radius = zone.radius || 100;

          layer = L.circle([lat, lng], {
            radius,
            color: zone.color,
            fillOpacity: zone.selected ? 0.4 : 0.2,
            weight: zone.selected ? 3 : 2,
          });
        }

        if (layer && onClientZoneClick) {
          layer.on("click", () => onClientZoneClick(zone.id));
          clientZoneLayer.addLayer(layer);
        }
      } catch (error) {
      }
    });

    return () => {
      map.removeLayer(clientZoneLayer);
    };
  }, [map, clientZones, onClientZoneClick]);

  return null;
}
