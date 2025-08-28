import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";

import { Sensor, getSensorTypeInfo } from "@/lib/sensorsApi";

interface SensorControlsProps {
  sensors: Sensor[];
}

export default function SensorControls({ sensors }: SensorControlsProps) {
  const map = useMap();
  const sensorLayersRef = useRef<L.LayerGroup>(new L.LayerGroup());

  const createSensorIcon = (sensor: Sensor) => {
    const sensorInfo = getSensorTypeInfo(sensor.type);
    const color = sensorInfo?.color || "#3388ff";

    const iconHtml = `
      <div style="
        width: 46px;
        height: 46px;
        background-color: ${sensor.active ? color : "#9ca3af"};
        border-radius: 50%;
        border: 4px solid white;
        box-shadow: 0 6px 20px rgba(0,0,0,0.3), 0 2px 8px rgba(0,0,0,0.2);
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
        opacity: ${sensor.active ? "1" : "0.75"};
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
          background-color: ${sensor.active ? "#22c55e" : "#ef4444"};
          border: 3px solid white;
          border-radius: 50%;
          box-shadow: 0 2px 8px rgba(0,0,0,0.25);
        "></div>
      </div>
    `;

    return L.divIcon({
      html: iconHtml,
      className: "custom-sensor-icon",
      iconSize: [46, 46],
      iconAnchor: [23, 23],
      popupAnchor: [0, -23],
    });
  };

  const getSensorIconSvg = (type: Sensor["type"]) => {
    switch (type) {
      case "TEMPERATURE":
        return '<path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 13.5a4 4 0 1 0 4 0V5a2 2 0 1 0-4 0v8.5z"/><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 9h4"/>';
      case "HUMIDITY":
        return '<path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 18a4.6 4.4 0 0 1 0 -9a5 4.5 0 0 1 11 2h1a3.5 3.5 0 0 1 0 7h-12"/><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 13v2m0 3v2m4 -5v2m0 3v2"/>';
      case "AIR_QUALITY":
        return '<path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 8h8.5a2.5 2.5 0 1 0 -2.34 -3.24"/><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12h15.5a2.5 2.5 0 1 1 -2.34 3.24"/><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16h5.5a2.5 2.5 0 1 1 -2.34 3.24"/>';
      case "LIGHT":
        return '<path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 12m-4 0a4 4 0 1 0 8 0a4 4 0 1 0 -8 0"/><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12h1m8 -9v1m8 8h1m-9 8v1m-6.4 -15.4l.7 .7m12.1 -.7l-.7 .7m0 11.4l.7 .7m-12.1 -.7l-.7 .7"/>';
      case "NOISE":
        return '<path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 8a5 5 0 0 1 0 8"/><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.7 5a9 9 0 0 1 0 14"/><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 15h-2a1 1 0 0 1 -1 -1v-4a1 1 0 0 1 1 -1h2l3.5 -4.5a.8 .8 0 0 1 1.5 .5v14a.8 .8 0 0 1 -1.5 .5l-3.5 -4.5"/>';
      case "CO2":
        return '<path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M3 21h18"/><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 21v-8h6v8m4 0v-10h6v10"/><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M7 10v-4m10 1v-4"/><circle stroke="currentColor" stroke-width="2" fill="currentColor" cx="7" cy="4" r="1"/><circle stroke="currentColor" stroke-width="2" fill="currentColor" cx="17" cy="5" r="1"/>';
      default:
        return '<circle stroke="currentColor" stroke-width="2" fill="none" cx="12" cy="12" r="4"/>';
    }
  };

  useEffect(() => {
    if (!map) return;

    const sensorLayers = sensorLayersRef.current;

    map.addLayer(sensorLayers);

    return () => {
      if (map.hasLayer(sensorLayers)) {
        map.removeLayer(sensorLayers);
      }
    };
  }, [map]);

  useEffect(() => {
    if (!map) return;

    const sensorLayers = sensorLayersRef.current;

    sensorLayers.clearLayers();

    sensors.forEach((sensor) => {
      if (
        sensor.latitude !== null &&
        sensor.longitude !== null &&
        sensor.latitude !== undefined &&
        sensor.longitude !== undefined
      ) {
        const sensorInfo = getSensorTypeInfo(sensor.type);
        const marker = L.marker([sensor.latitude, sensor.longitude], {
          icon: createSensorIcon(sensor),
        });

        const popupContent = `
          <div style="min-width: 200px;">
            <h3 style="margin: 0 0 8px 0; color: ${sensorInfo?.color || "#333"};">
              ${sensorInfo?.label || sensor.type} Sensor
            </h3>
            <p style="margin: 4px 0;"><strong>ID:</strong> ${sensor.sensorId}</p>
            <p style="margin: 4px 0;"><strong>Status:</strong> 
              <span style="color: ${sensor.active ? "#22c55e" : "#ef4444"};">
                ${sensor.active ? "Active" : "Inactive"}
              </span>
            </p>
            <p style="margin: 4px 0;"><strong>Location:</strong> ${sensor.latitude.toFixed(6)}, ${sensor.longitude.toFixed(6)}</p>
            <p style="margin: 4px 0;"><strong>Created:</strong> ${new Date(sensor.createdAt).toLocaleDateString()}</p>
          </div>
        `;

        marker.bindPopup(popupContent);
        sensorLayers.addLayer(marker);
      }
    });
  }, [map, sensors]);

  return null;
}
