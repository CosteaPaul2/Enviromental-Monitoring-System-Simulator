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

    console.log(
      "🎯 Activating sensor placement mode for:",
      selectedSensor.sensorId,
    );

    map.getContainer().style.cursor = "crosshair";

    const onMapClick = (e: L.LeafletMouseEvent) => {
      L.DomEvent.stopPropagation(e);
      console.log("🎯 Sensor placement click detected at:", e.latlng);

      if (selectedSensor) {
        onSensorPlaced(selectedSensor, e.latlng.lat, e.latlng.lng);
      }
    };

    map.on("click", onMapClick);
    map.dragging.disable();
    map.doubleClickZoom.disable();

    return () => {
      console.log("🎯 Deactivating sensor placement mode");
      map.off("click", onMapClick);
      map.getContainer().style.cursor = "";
      map.dragging.enable();
      map.doubleClickZoom.enable();
    };
  }, [map, selectedSensor, onSensorPlaced]);

  return null;
}
