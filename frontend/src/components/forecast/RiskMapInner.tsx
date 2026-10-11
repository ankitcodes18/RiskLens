"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapLayersResponse, NormalizedLocation } from "@/types/forecast";

interface RiskMapInnerProps {
  location: NormalizedLocation;
  mapData?: MapLayersResponse;
  activeLayer: "heat" | "flood" | "water";
  onSelectCoordinates: (lat: number, lon: number) => void;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[character];
  });
}

export default function RiskMapInner({
  location,
  mapData,
  activeLayer,
  onSelectCoordinates,
}: RiskMapInnerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);
  const locationName = escapeHtml(location.name);

  useEffect(() => {
    if (!containerRef.current) return;

    if (!mapRef.current) {
      // Fix default Leaflet icon paths
      Reflect.deleteProperty(L.Icon.Default.prototype, "_getIconUrl");
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const map = L.map(containerRef.current, {
        center: [location.lat, location.lon],
        zoom: 10,
        zoomControl: false,
      });

      L.control.zoom({ position: "bottomright" }).addTo(map);

      // Check CARTO API Key from environment (Next.js convention: NEXT_PUBLIC_CARTO_API_KEY, fallback: VITE_CARTO_API_KEY)
      const cartoApiKey =
        process.env.NEXT_PUBLIC_CARTO_API_KEY || process.env.VITE_CARTO_API_KEY;

      let tileUrl: string;
      let attributionStr: string;
      let subdomainsList: string | string[] = "abcd";

      if (cartoApiKey) {
        tileUrl = `https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png?key=${cartoApiKey}`;
        attributionStr =
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';
      } else {
        if (process.env.NODE_ENV === "development") {
          console.warn(
            "CARTO API Key (NEXT_PUBLIC_CARTO_API_KEY) not found. Utilizing standard OpenStreetMap tile provider as fallback."
          );
        }
        tileUrl = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
        attributionStr =
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
        subdomainsList = ["a", "b", "c"];
      }

      L.tileLayer(tileUrl, {
        attribution: attributionStr,
        subdomains: subdomainsList,
        maxZoom: 19,
      }).addTo(map);

      // Map click handler to pick new coordinates
      map.on("click", (e: L.LeafletMouseEvent) => {
        onSelectCoordinates(e.latlng.lat, e.latlng.lng);
      });

      layerGroupRef.current = L.layerGroup().addTo(map);
      mapRef.current = map;
    } else {
      mapRef.current.setView([location.lat, location.lon], 10);
    }
  }, [location.lat, location.lon, onSelectCoordinates]);

  // Update overlay markers & features when layer or location changes
  useEffect(() => {
    if (!mapRef.current || !layerGroupRef.current) return;

    layerGroupRef.current.clearLayers();

    // 1. Primary Selected Location Marker
    const mainIcon = L.divIcon({
      className: "custom-pin-main",
      html: `<div style="background-color: #0F172A; color: white; padding: 4px 8px; border-radius: 6px; border: 2px solid white; font-size: 11px; font-weight: bold; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); display: flex; align-items: center; gap: 4px;">
        <span style="height: 6px; width: 6px; border-radius: 50%; background-color: #0D9488;"></span>
        ${locationName}
      </div>`,
      iconSize: [120, 30],
      iconAnchor: [60, 15],
    });

    L.marker([location.lat, location.lon], { icon: mainIcon })
      .bindPopup(
        `<div style="font-family: sans-serif; padding: 4px;">
          <strong style="color: #0F172A; font-size: 13px;">${locationName}</strong><br/>
          <span style="font-size: 11px; color: #64748B;">Lat: ${location.lat.toFixed(4)}°, Lon: ${location.lon.toFixed(4)}°</span>
        </div>`
      )
      .addTo(layerGroupRef.current);

    // 2. Spatial Grid Risk Overlay Circles (Derived from Open-Meteo telemetry)
    if (mapData && mapData.features) {
      mapData.features.forEach((feat) => {
        let val = feat.heatScore;
        let fillColor = "#EF4444"; // Red for heat
        if (activeLayer === "flood") {
          val = feat.floodScore;
          fillColor = "#2563EB"; // Blue for flood
        } else if (activeLayer === "water") {
          val = feat.waterStressScore;
          fillColor = "#0D9488"; // Teal for water
        }

        const circle = L.circle([feat.lat, feat.lon], {
          color: fillColor,
          fillColor: fillColor,
          fillOpacity: 0.22,
          radius: 3500,
          weight: 1.5,
        });

        circle.bindTooltip(
          `<div style="font-family: sans-serif; font-size: 11px;">
            <strong>${escapeHtml(feat.name)}</strong><br/>
            ${activeLayer.toUpperCase()} Score: <b>${val}/100</b>
          </div>`
        );

        circle.addTo(layerGroupRef.current!);
      });
    }
  }, [location, locationName, mapData, activeLayer]);

  return <div ref={containerRef} className="h-full w-full rounded-b-xl" />;
}
