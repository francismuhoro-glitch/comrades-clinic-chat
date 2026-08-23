import React, { useEffect, useMemo, useState } from "react";
import {
  calculateDistanceKm,
  getGoogleMapsDirectionsUrl,
  getLocalFacilities,
} from "../../lib/facilities";
import { MapPin, Navigation, AlertCircle } from "lucide-react";
import { Button } from "../ui/button";

interface NearbyFacilitiesProps {
  campus?: string;
  onlyEmergency?: boolean;
}

export const NearbyFacilities: React.FC<NearbyFacilitiesProps> = ({
  campus = "",
  onlyEmergency = false,
}) => {
  const [userCoords, setUserCoords] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Full Kenyan facility directory (1,438+ rows) from the static local dataset
  // (src/data/hospitals-data.ts). Synchronous — zero network calls, zero
  // Supabase queries, so proximity ranking works instantly and fully offline.
  const facilities = useMemo(
    () => getLocalFacilities(onlyEmergency).filter((f) => f.latitude !== 0 && f.longitude !== 0),
    [onlyEmergency],
  );

  // 1. Get GPS coordinates for Haversine proximity ranking
  useEffect(() => {
    if (typeof window !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserCoords({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
        },
        () => {
          setLocationError("Enable location to automatically sort the 5 closest hospitals to you.");
        },
        { enableHighAccuracy: true, timeout: 10000 },
      );
    }
  }, []);

  // 2. Rank the local directory: Top 5 nearest by Haversine distance
  const region = campus.trim().toLowerCase();
  const regional = region
    ? facilities.filter((f) => `${f.county} ${f.district}`.toLowerCase().includes(region))
    : [];
  const regionFacilities = !userCoords && regional.length ? regional : facilities;
  const sortedFacilities = regionFacilities
    .map((fac) => {
      const distance = userCoords
        ? calculateDistanceKm(userCoords.lat, userCoords.lng, fac.latitude, fac.longitude)
        : undefined;
      return { ...fac, distanceKm: distance };
    })
    .sort((a, b) => (a.distanceKm ?? 9999) - (b.distanceKm ?? 9999))
    .slice(0, 5); // TOP 5 CLOSEST from the full 1,438+ set

  return (
    <div className="space-y-3 rounded-xl border border-border bg-card p-4 text-card-foreground">
      <div className="flex items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 font-semibold text-base">
          <MapPin className="h-5 w-5 text-primary" />
          {onlyEmergency ? "Top 5 Nearest Emergency Hospitals" : "Top 5 Nearest Health Facilities"}
        </h3>
        <span className="text-[10px] text-muted-foreground shrink-0">
          from {facilities.length.toLocaleString()}+ directory
        </span>
      </div>

      {locationError && (
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <AlertCircle className="h-3.5 w-3.5 text-warning" />
          {locationError}
        </p>
      )}

      <div className="space-y-2">
        {sortedFacilities.map((fac, idx) => {
          const mapsUrl = getGoogleMapsDirectionsUrl(
            fac.latitude,
            fac.longitude,
            userCoords?.lat,
            userCoords?.lng,
          );

          return (
            <div
              key={idx}
              className="flex items-center justify-between p-3 rounded-lg border border-border/60 bg-muted/30 hover:bg-muted/60 transition-colors"
            >
              <div className="space-y-1 pr-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-sm text-foreground">{fac.name}</span>
                  <span className="text-[10px] uppercase font-bold bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                    {fac.facility_type}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>
                    {fac.district} ({fac.agency})
                  </span>
                  {fac.distanceKm !== undefined && (
                    <span className="font-bold text-success">~{fac.distanceKm} km away</span>
                  )}
                </div>
              </div>

              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 text-xs h-8 shrink-0"
                onClick={() => window.open(mapsUrl, "_blank")}
              >
                <Navigation className="h-3.5 w-3.5 text-primary" />
                Directions
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
