import React, { useEffect, useState } from "react";
import {
  Facility,
  FALLBACK_FACILITIES,
  calculateDistanceKm,
  getGoogleMapsDirectionsUrl,
} from "../../lib/facilities";
import { supabase } from "../../lib/supabase";
import { MapPin, Navigation, Phone, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "../ui/button";

interface NearbyFacilitiesProps {
  campus?: string;
  onlyEmergency?: boolean;
}

export const NearbyFacilities: React.FC<NearbyFacilitiesProps> = ({
  campus,
  onlyEmergency = false,
}) => {
  const [userCoords, setUserCoords] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [locationError, setLocationError] = useState<string | null>(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserCoords({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
        },
        () => {
          setLocationError("Enable location for exact distance and walking directions.");
        },
        { enableHighAccuracy: true, timeout: 8000 },
      );
    }

    async function loadFacilities() {
      setLoading(true);
      try {
        let query = supabase.from("campus_facilities").select("*");
        if (onlyEmergency) {
          query = query.eq("is_emergency", true);
        }
        const { data, error } = await query;
        if (error || !data || data.length === 0) {
          setFacilities(
            onlyEmergency ? FALLBACK_FACILITIES.filter((f) => f.is_emergency) : FALLBACK_FACILITIES,
          );
        } else {
          setFacilities(data as Facility[]);
        }
      } catch {
        setFacilities(FALLBACK_FACILITIES);
      } finally {
        setLoading(false);
      }
    }

    loadFacilities();
  }, [campus, onlyEmergency]);

  const sortedFacilities = facilities
    .map((fac) => {
      const distance = userCoords
        ? calculateDistanceKm(userCoords.lat, userCoords.lng, fac.latitude, fac.longitude)
        : undefined;
      return { ...fac, distanceKm: distance };
    })
    .sort((a, b) => (a.distanceKm ?? 999) - (b.distanceKm ?? 999));

  return (
    <div className="space-y-3 rounded-xl border border-border bg-card p-4 text-card-foreground">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 font-semibold text-base">
          <MapPin className="h-5 w-5 text-primary" />
          {onlyEmergency ? "Nearest Emergency Facilities" : "Nearby Student Health Facilities"}
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
          Finding closest medical centers...
        </div>
      ) : (
        <div className="space-y-2">
          {sortedFacilities.slice(0, 3).map((fac, idx) => {
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
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm text-foreground">{fac.name}</span>
                    {fac.is_emergency && (
                      <span className="text-[10px] uppercase font-bold bg-destructive/15 text-destructive px-1.5 py-0.5 rounded">
                        24/7 ER
                      </span>
                    )}
                    {fac.level && (
                      <span className="text-[10px] font-semibold bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                        {fac.level}
                      </span>
                    )}
                    {fac.ownership && (
                      <span className="text-[10px] text-muted-foreground capitalize">
                        ({fac.ownership})
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{fac.campus}</span>
                    {fac.distanceKm !== undefined && (
                      <span className="font-semibold text-primary">~{fac.distanceKm} km away</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {fac.phone && (
                    <a
                      href={`tel:${fac.phone}`}
                      className="p-2 rounded-md hover:bg-primary/10 text-primary transition-colors"
                      title={`Call ${fac.name}`}
                    >
                      <Phone className="h-4 w-4" />
                    </a>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5 text-xs h-8"
                    onClick={() => window.open(mapsUrl, "_blank")}
                  >
                    <Navigation className="h-3.5 w-3.5 text-primary" />
                    Directions
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
