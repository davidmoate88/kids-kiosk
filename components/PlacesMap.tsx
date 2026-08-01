"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Place } from "@/lib/places";

const PIN_ICON = L.divIcon({
  html: '<div style="font-size:30px;line-height:1;filter:drop-shadow(0 2px 2px rgba(0,0,0,.35))">📍</div>',
  className: "",
  iconSize: [30, 30],
  iconAnchor: [15, 30],
});

export default function PlacesMap({
  places,
  onSelect,
}: {
  places: Place[];
  onSelect: (place: Place) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const onSelectRef = useRef(onSelect);

  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current).setView([53.68, -0.67], 5);
    mapRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
      maxZoom: 18,
    }).addTo(map);

    const markers = places.map((place) => {
      const marker = L.marker([place.lat, place.lon], { icon: PIN_ICON }).addTo(map);
      marker.on("click", () => onSelectRef.current(place));
      return marker;
    });

    // Leaflet needs the container's real layout size before it can pick a
    // sensible zoom for fitBounds — both are deferred a tick so they run
    // after the browser has painted the (freshly mounted) container. The
    // timeout is cleared on cleanup so a torn-down map (e.g. Strict Mode's
    // mount→cleanup→mount cycle in dev) never gets operated on after removal.
    const timeoutId = setTimeout(() => {
      map.invalidateSize();
      if (places.length) {
        const bounds = L.latLngBounds(places.map((p) => [p.lat, p.lon] as [number, number]));
        map.fitBounds(bounds.pad(0.15));
      }
    }, 50);

    return () => {
      clearTimeout(timeoutId);
      markers.forEach((m) => m.remove());
      map.remove();
      mapRef.current = null;
    };
  }, [places]);

  return <div ref={containerRef} className="w-full h-full rounded-[2rem] overflow-hidden" />;
}
