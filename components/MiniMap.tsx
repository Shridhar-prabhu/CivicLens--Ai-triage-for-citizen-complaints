"use strict";
"use client";

import React, { useEffect, useRef } from "react";
import L from "leaflet";
import type { Severity } from "@/lib/schema";

interface MiniMapProps {
  lat: number;
  lng: number;
  severity?: Severity;
  address?: string;
}

const SEVERITY_COLORS: Record<Severity, string> = {
  Critical: "#ef4444",
  High: "#f97316",
  Medium: "#f59e0b",
  Low: "#10b981",
};

export default function MiniMap({ lat, lng, severity = "Medium", address }: MiniMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    if (mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [lat, lng],
      zoom: 15,
      zoomControl: false,
      dragging: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    const color = SEVERITY_COLORS[severity] || "#06b6d4";

    const customIcon = L.divIcon({
      className: "custom-mini-pin",
      html: `
        <div style="
          width: 24px; height: 24px;
          background: ${color};
          border: 2px solid #ffffff;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.4);
        "></div>
      `,
      iconSize: [24, 24],
      iconAnchor: [12, 24],
    });

    L.marker([lat, lng], { icon: customIcon }).addTo(map);
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [lat, lng, severity]);

  const mapUrl = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=16/${lat}/${lng}`;

  return (
    <div className="rounded-xl overflow-hidden border border-slate-800 bg-slate-900/60 p-2 space-y-1.5">
      <div className="flex items-center justify-between text-[11px] text-slate-400">
        <span>📍 Pin Location ({lat.toFixed(4)}, {lng.toFixed(4)})</span>
        <a
          href={mapUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-cyan-400 hover:underline text-[10px]"
        >
          Open in OpenStreetMap &rarr;
        </a>
      </div>
      <div ref={containerRef} className="h-32 w-full rounded-lg" />
      {address && <p className="text-[11px] text-slate-400 truncate">Street: {address}</p>}
    </div>
  );
}
