import { useEffect, useMemo } from "react";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const DEFAULT_CENTER = [43.6532, -79.3832];

const selectedMarker = L.divIcon({
  className: "",
  html: '<div style="width:18px;height:18px;border-radius:9999px;background:#3BAE3D;border:3px solid #ffffff;box-shadow:0 2px 10px rgba(0,0,0,.35);"></div>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

function MapClickHandler({ onSelect }) {
  useMapEvents({
    click(event) {
      onSelect(event.latlng.lat, event.latlng.lng);
    },
  });
  return null;
}

function MapResizer({ position }) {
  const map = useMap();

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      map.invalidateSize();
      if (position) {
        map.setView(position, Math.max(map.getZoom(), 16));
      }
    }, 150);

    return () => window.clearTimeout(timeout);
  }, [map, position]);

  return null;
}

export default function LocationPickerMap({ latitud, longitud, onSelect }) {
  const selectedPosition = useMemo(() => {
    const lat = Number(latitud);
    const lng = Number(longitud);
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      return [lat, lng];
    }
    return null;
  }, [latitud, longitud]);

  const publicLocationIqToken = import.meta.env.VITE_LOCATIONIQ_PUBLIC_TOKEN;
  const tileUrl = publicLocationIqToken
    ? `https://{s}-tiles.locationiq.com/v3/streets/r/{z}/{x}/{y}.png?key=${publicLocationIqToken}`
    : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
  const attribution = publicLocationIqToken
    ? '&copy; <a href="https://locationiq.com/">LocationIQ</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200">
      <MapContainer
        center={selectedPosition || DEFAULT_CENTER}
        zoom={selectedPosition ? 16 : 11}
        scrollWheelZoom
        className="h-[320px] w-full"
      >
        <TileLayer attribution={attribution} url={tileUrl} />
        <MapClickHandler onSelect={onSelect} />
        <MapResizer position={selectedPosition} />
        {selectedPosition && (
          <Marker
            position={selectedPosition}
            icon={selectedMarker}
            draggable
            eventHandlers={{
              dragend(event) {
                const marker = event.target;
                const position = marker.getLatLng();
                onSelect(position.lat, position.lng);
              },
            }}
          />
        )}
      </MapContainer>
    </div>
  );
}
