import React, { useEffect, useState } from "react";
import {
  Facility,
  fetchFacilities,
  calculateDistanceKm,
  getGoogleMapsDirectionsUrl,
} from "../../lib/facilities";
import { supabase } from "../../lib/supabase";
import { MapPin, Navigation, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "../ui/button";

interface NearbyFacilitiesProps {
  campus?: string;
  onlyEmergency?: boolean;
}

export const NearbyFacilities: React.FC<NearbyFacilitiesProps> = ({ campus = "", onlyEmergency = false }) => {
  const [userCoords, setUserCoords] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [locationError, setLocationError] = useState<string | null>(null);

  useEffect(() => {
    // 1. Get GPS coordinates
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

    // 2. Fetch KMHFL dataset from Supabase
    async function loadFacilities() {
      setLoading(true);
      try {
        const mapped = await fetchFacilities(supabase, onlyEmergency);
        setFacilities(mapped.filter((f) => f.latitude !== 0 && f.longitude !== 0));
      } catch {
        setFacilities([]);
      } finally {
        setLoading(false);
      }
    }

    loadFacilities();
  }, [onlyEmergency, campus]);

  // Sort and select the Top 5 Closest Facilities
  const region = campus.trim().toLowerCase();
  const regional = region ? facilities.filter((f) => `${f.campus} ${f.district}`.toLowerCase().includes(region)) : [];
  const regionFacilities = !userCoords && regional.length ? regional : facilities;
  const sortedFacilities = regionFacilities
    .map((fac) => {
      const distance = userCoords
        ? calculateDistanceKm(userCoords.lat, userCoords.lng, fac.latitude, fac.longitude)
        : undefined;
      return { ...fac, distanceKm: distance };
    })
    .sort((a, b) => (a.distanceKm ?? 9999) - (b.distanceKm ?? 9999))
    .slice(0, 5); // TOP 5 CLOSEST

  return (
    <div className="space-y-3 rounded-xl border border-border bg-card p-4 text-card-foreground">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 font-semibold text-base">
          <MapPin className="h-5 w-5 text-primary" />
          {onlyEmergency ? "Top 5 Nearest Emergency Hospitals" : "Top 5 Nearest Health Facilities"}
        </h3>
      </div>

      {locationError && (
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <AlertCircle className="h-3.5 w-3.5 text-warning" />
          {locationError}
        </p>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-6 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin mr-2" />
          Calculating nearest facilities from 4,800+ Kenyan hospital database...
        </div>
      ) : (
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
      )}
    </div>
  );
};
