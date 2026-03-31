"use client";
import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix Leaflet default icon in Next.js
const icon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

interface Props {
  perdidas: any[];
}

export default function MapComponent({ perdidas }: Props) {
  return (
    <MapContainer
      center={[-34.6037, -58.3816]}
      zoom={12}
      style={{ height: "220px", width: "100%", borderRadius: 16 }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {perdidas.filter(p => p.lat && p.lng).map((p: any, i: number) => (
        <Marker key={i} position={[p.lat, p.lng]} icon={icon}>
          <Popup>
            <strong>{p.pet_name}</strong><br />
            {p.breed} · {p.color}<br />
            📍 {p.zone}<br />
            {p.phone && <a href={`https://wa.me/${p.phone.replace(/\D/g, "")}`}>Contactar</a>}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
