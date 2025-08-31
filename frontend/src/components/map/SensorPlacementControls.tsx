import { useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";

import { Sensor } from "@/lib/sensorsApi";

interface SensorPlacementControlsProps {
  selectedSensor: Sensor | null;
  onSensorPlaced: (sensor: Sensor, lat: number, lng: number) => void;
  sensors: Sensor[];
}

export default function SensorPlacementControls({
  selectedSensor,
  onSensorPlaced,
}: SensorPlacementControlsProps) {
  const map = useMap();

  useEffect(() => {
    if (!map || !selectedSensor) return;


    map.getContainer().style.cursor = "crosshair";

    const onMapClick = (e: L.LeafletMouseEvent) => {
      L.DomEvent.stopPropagation(e);

      if (selectedSensor) {
        onSensorPlaced(selectedSensor, e.latlng.lat, e.latlng.lng);
      }
    };

    map.on("click", onMapClick);
    map.dragging.disable();
    map.doubleClickZoom.disable();

    return () => {
      map.off("click", onMapClick);
      map.getContainer().style.cursor = "";
      map.dragging.enable();
      map.doubleClickZoom.enable();
    };
  }, [map, selectedSensor, onSensorPlaced]);

  return null;
}
