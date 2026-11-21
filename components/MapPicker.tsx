"use strict";
"use client";

import React, { useEffect, useRef } from "react";
import L from "leaflet";
import { BENGALURU_CENTER } from "@/lib/geo";

interface MapPickerProps {
  lat?: number;
  lng?: number;
  onChange: (lat: number, lng: number) => void;
}

export default function MapPicker({ lat, lng, onChange }: MapPickerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  const currentLat = lat ?? BENGALURU_CENTER.lat;
  const currentLng = lng ?? BENGALURU_CENTER.lng;

  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return; // Already initialized

    // Create Leaflet map centered at Bengaluru
    const map = L.map(mapContainerRef.current, {
      center: [currentLat, currentLng],
      zoom: 14,
      scrollWheelZoom: false,
    });

    // OpenStreetMap tile layer with required attribution
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    // Custom draggable SVG pin
    const customIcon = L.divIcon({
      className: "custom-map-pin",
      html: `
        <div style="
          width: 32px;
          height: 32px;
          background: #06b6d4;
          border: 2px solid #ffffff;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          box-shadow: 0 4px 12px rgba(6, 182, 212, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <div style="width: 10px; height: 10px; background: #ffffff; border-radius: 50%;"></div>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 32],
    });

    const marker = L.marker([currentLat, currentLng], {
      draggable: true,
      icon: customIcon,
    }).addTo(map);

    marker.on("dragend", () => {
      const pos = marker.getLatLng();
      onChange(Number(pos.lat.toFixed(6)), Number(pos.lng.toFixed(6)));
    });

    map.on("click", (e: L.LeafletMouseEvent) => {
      marker.setLatLng(e.latlng);
      onChange(Number(e.latlng.lat.toFixed(6)), Number(e.latlng.lng.toFixed(6)));
    });

    mapInstanceRef.current = map;
    markerRef.current = marker;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update marker position if external coordinates change (e.g. from Geolocation button)
  useEffect(() => {
    if (mapInstanceRef.current && markerRef.current && lat && lng) {
      markerRef.current.setLatLng([lat, lng]);
      mapInstanceRef.current.setView([lat, lng], 15);
    }
  }, [lat, lng]);

  return (
    <div className="relative rounded-2xl overflow-hidden border border-slate-700/80 shadow-inner">
      <div ref={mapContainerRef} className="h-52 w-full z-10" />
      <div className="absolute bottom-2 left-2 z-20 rounded-md bg-slate-950/80 px-2 py-0.5 text-[10px] text-slate-300 font-mono border border-slate-800 backdrop-blur-sm pointer-events-none">
        Pin: {currentLat.toFixed(5)}, {currentLng.toFixed(5)} &bull; Drag to adjust
      </div>
    </div>
  );
}
