"use strict";
"use client";

import React, { useEffect, useRef } from "react";
import L from "leaflet";
import type { Ticket, Severity } from "@/lib/schema";
import { BENGALURU_CENTER } from "@/lib/geo";

interface DashboardMapViewProps {
  tickets: Ticket[];
  onSelectTicket: (ticket: Ticket) => void;
}

const SEVERITY_COLORS: Record<Severity, string> = {
  Critical: "#ef4444",
  High: "#f97316",
  Medium: "#f59e0b",
  Low: "#10b981",
};

export default function DashboardMapView({ tickets, onSelectTicket }: DashboardMapViewProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [BENGALURU_CENTER.lat, BENGALURU_CENTER.lng],
      zoom: 12,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    const layerGroup = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;
    markersLayerRef.current = layerGroup;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update map markers whenever tickets list changes
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;

    markersLayerRef.current.clearLayers();

    const bounds: [number, number][] = [];

    tickets.forEach((ticket) => {
      if (typeof ticket.lat !== "number" || typeof ticket.lng !== "number") return;

      bounds.push([ticket.lat, ticket.lng]);
      const color = SEVERITY_COLORS[ticket.severity] || "#06b6d4";
      const isCritical = ticket.severity === "Critical";

      const iconHtml = `
        <div style="position: relative;">
          ${
            isCritical
              ? `<div style="
                  position: absolute;
                  top: -6px; left: -6px;
                  width: 40px; height: 40px;
                  border-radius: 50%;
                  background: rgba(239, 68, 68, 0.4);
                  animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
                "></div>`
              : ""
          }
          <div style="
            width: 28px; height: 28px;
            background: ${color};
            border: 2px solid #ffffff;
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            box-shadow: 0 4px 10px rgba(0, 0, 0, 0.4);
            display: flex; align-items: center; justify-content: center;
          ">
            <div style="width: 8px; height: 8px; background: #ffffff; border-radius: 50%;"></div>
          </div>
          ${
            ticket.duplicate_count > 1
              ? `<span style="
                  position: absolute;
                  top: -8px; right: -8px;
                  background: #f59e0b;
                  color: #000;
                  font-weight: 800;
                  font-size: 10px;
                  padding: 1px 4px;
                  border-radius: 10px;
                  border: 1px solid #ffffff;
                ">${ticket.duplicate_count}</span>`
              : ""
          }
        </div>
      `;

      const customIcon = L.divIcon({
        className: "custom-dashboard-pin",
        html: iconHtml,
        iconSize: [28, 28],
        iconAnchor: [14, 28],
      });

      const marker = L.marker([ticket.lat, ticket.lng], { icon: customIcon });

      const popupHtml = document.createElement("div");
      popupHtml.className = "text-slate-900 p-1 text-xs space-y-1.5";
      popupHtml.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; gap: 8px;">
          <strong style="font-family: monospace;">#${ticket.id}</strong>
          <span style="
            background: ${color}; color: #fff;
            padding: 1px 6px; border-radius: 6px; font-weight: 700; font-size: 10px;
          ">${ticket.severity}</span>
        </div>
        <p style="font-weight: 600; margin: 4px 0;">${ticket.summary}</p>
        <p style="color: #64748b; font-size: 11px;">Dept: ${ticket.department}</p>
        ${ticket.address_text ? `<p style="color: #0284c7; font-size: 10px;">📍 ${ticket.address_text}</p>` : ""}
        ${ticket.duplicate_note ? `<p style="color: #d97706; font-size: 10px;">⚠️ ${ticket.duplicate_note}</p>` : ""}
        <button id="btn-${ticket.id}" style="
          width: 100%; margin-top: 6px;
          background: #0f172a; color: #fff;
          padding: 4px 8px; border-radius: 6px; font-weight: 600; border: none; cursor: pointer;
        ">Inspect in Drawer &rarr;</button>
      `;

      marker.bindPopup(popupHtml);

      marker.on("popupopen", () => {
        const btn = document.getElementById(`btn-${ticket.id}`);
        if (btn) {
          btn.onclick = () => onSelectTicket(ticket);
        }
      });

      markersLayerRef.current?.addLayer(marker);
    });

    if (bounds.length > 0) {
      mapInstanceRef.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
    }
  }, [tickets, onSelectTicket]);

  return (
    <div className="relative rounded-2xl overflow-hidden border border-slate-800 shadow-xl bg-slate-950">
      <div ref={mapContainerRef} className="h-[520px] w-full z-10" />
      <div className="absolute top-3 right-3 z-20 rounded-xl bg-slate-950/90 p-3 border border-slate-800 text-xs space-y-2 backdrop-blur-md">
        <span className="font-semibold text-slate-200 block text-[11px] uppercase tracking-wider">Severity Legend</span>
        <div className="flex items-center gap-2 text-rose-400 font-medium text-[11px]">
          <span className="h-2.5 w-2.5 rounded-full bg-rose-500 animate-ping" />
          <span>Critical Hazard (2h SLA)</span>
        </div>
        <div className="flex items-center gap-2 text-orange-400 font-medium text-[11px]">
          <span className="h-2.5 w-2.5 rounded-full bg-orange-500" />
          <span>High Priority (24h SLA)</span>
        </div>
        <div className="flex items-center gap-2 text-amber-400 font-medium text-[11px]">
          <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
          <span>Medium Priority (72h SLA)</span>
        </div>
        <div className="flex items-center gap-2 text-emerald-400 font-medium text-[11px]">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
          <span>Low Priority (7d SLA)</span>
        </div>
        <div className="pt-1 border-t border-slate-800 text-[10px] text-amber-300 flex items-center gap-1.5">
          <span className="rounded bg-amber-500 text-black px-1 font-bold">2+</span>
          <span>Clustered Duplicate</span>
        </div>
      </div>
    </div>
  );
}
