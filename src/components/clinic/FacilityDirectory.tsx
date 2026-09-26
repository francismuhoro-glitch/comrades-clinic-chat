import { LoaderCircle, MapPin, Navigation, Phone, Search, Siren } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Facility } from "@/lib/facilities";

type DirectoryStatus = "idle" | "loading" | "ready" | "error";

const RESULT_LIMIT = 25;

/**
 * Lazily loads the bundled Kenya Master Health Facility List snapshot
 * (public/facilities.json, ~4.8k facilities) and filters it client-side.
 *
 * Deliberately NOT loaded during SSR/first paint: the directory is fetched only
 * when the visitor asks for it, so the public /facilities page stays a fast,
 * server-rendered document instead of shipping a 900 KB JSON payload plus the
 * Supabase client to every crawler.
 */
async function loadDirectory(): Promise<Facility[]> {
  const [{ loadFacilitiesFromSupabase }, { supabase }] = await Promise.all([
    import("@/lib/facilities"),
    import("@/lib/supabase"),
  ]);
  return loadFacilitiesFromSupabase(supabase);
}

function directionsUrl(facility: Facility): string {
  return `https://www.google.com/maps/search/?api=1&query=${facility.latitude},${facility.longitude}`;
}

export function FacilityDirectory() {
  const [query, setQuery] = useState("");
  const [emergencyOnly, setEmergencyOnly] = useState(false);
  const [status, setStatus] = useState<DirectoryStatus>("idle");
  const [facilities, setFacilities] = useState<Facility[]>([]);

  const load = async () => {
    if (status === "loading" || status === "ready") return;
    setStatus("loading");
    try {
      const rows = await loadDirectory();
      setFacilities(rows);
      setStatus(rows.length > 0 ? "ready" : "error");
    } catch {
      setStatus("error");
    }
  };

  const matches = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return facilities.filter((facility) => {
      if (emergencyOnly && !facility.is_emergency) return false;
      if (!needle) return true;
      return (
        facility.name.toLowerCase().includes(needle) ||
        (facility.district ?? "").toLowerCase().includes(needle) ||
        facility.facility_type.toLowerCase().includes(needle)
      );
    });
  }, [facilities, query, emergencyOnly]);

  const visible = matches.slice(0, RESULT_LIMIT);

  return (
    <div className="space-y-3">
      <form
        className="flex flex-col gap-2 sm:flex-row"
        onSubmit={(event) => {
          event.preventDefault();
          void load();
        }}
      >
        <div className="flex-1 space-y-1.5">
          <label htmlFor="facility-search" className="text-[11px] font-semibold text-foreground">
            Facility or county
          </label>
          <Input
            id="facility-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="e.g. Kenyatta, Nakuru, Health Centre"
            autoComplete="off"
          />
        </div>
        <div className="flex items-end gap-2">
          <label className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg border bg-card px-3 text-[11px] font-semibold">
            <input
              type="checkbox"
              checked={emergencyOnly}
              onChange={(event) => setEmergencyOnly(event.target.checked)}
              className="size-3.5 accent-primary"
            />
            Emergency-ready only
          </label>
          <Button type="submit" className="h-9 gap-1.5 text-xs font-bold">
            {status === "loading" ? (
              <LoaderCircle className="size-3.5 animate-spin" />
            ) : (
              <Search className="size-3.5" />
            )}
            {status === "ready" ? "Filter" : "Load directory"}
          </Button>
        </div>
      </form>

      {status === "idle" && (
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          The directory is a snapshot of the Kenya Master Health Facility List and is loaded on
          demand to keep this page light — tap{" "}
          <strong className="font-semibold text-foreground">Load directory</strong> to search it on
          your phone.
        </p>
      )}

      {status === "loading" && (
        <p className="text-[11px] text-muted-foreground" aria-live="polite">
          Loading the facility directory…
        </p>
      )}

      {status === "error" && (
        <p className="rounded-xl border border-warning/40 bg-warning/10 p-3 text-[11px] leading-relaxed text-warning-foreground">
          The facility directory could not be loaded right now. The emergency numbers in the red bar
          above always work, and a doctor in the app can send you a referral letter with directions.
        </p>
      )}

      {status === "ready" && (
        <div className="space-y-2">
          <p className="text-[11px] font-semibold text-muted-foreground" aria-live="polite">
            {matches.length === 0
              ? "No facilities matched that search."
              : `Showing ${visible.length} of ${matches.length.toLocaleString()} matching facilities`}
          </p>
          <ul className="space-y-2">
            {visible.map((facility, index) => (
              <li
                key={facility.id ?? `${facility.name}-${index}`}
                className="space-y-1.5 rounded-xl border bg-card p-3 shadow-card"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="flex items-start gap-1.5 text-xs font-bold leading-snug">
                      <MapPin className="mt-0.5 size-3.5 shrink-0 text-primary" />
                      {facility.name}
                    </p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      {facility.facility_type}
                      {facility.district ? ` · ${facility.district}` : ""}
                      {facility.level ? ` · ${facility.level}` : ""}
                    </p>
                  </div>
                  {facility.is_emergency && (
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-bold text-destructive">
                      <Siren className="size-3" />
                      24/7
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-3 text-[11px] font-semibold">
                  <a
                    href={directionsUrl(facility)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-primary hover:underline"
                  >
                    <Navigation className="size-3" />
                    Directions
                  </a>
                  {facility.phone && (
                    <a
                      href={`tel:${facility.phone.replace(/\s/g, "")}`}
                      className="inline-flex items-center gap-1 text-primary hover:underline"
                    >
                      <Phone className="size-3" />
                      {facility.phone}
                    </a>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
