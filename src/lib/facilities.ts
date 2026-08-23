import { KENYA_HOSPITALS, type HospitalFacility } from "@/data/hospitals-data";

export interface Facility {
  id: string;
  name: string;
  /** Legacy alias — mirrors `county` (kept for backward compatibility). */
  campus?: string;
  district: string;
  county: string;
  facility_type: string;
  latitude: number;
  longitude: number;
  phone?: string;
  is_emergency: boolean;
  agency: string;
  level: string;
  ownership?: string;
  distanceKm?: number;
}

/**
 * Static, in-bundle facility directory — no Supabase, no REST, no network.
 * This is the ONLY data source for facility search and proximity sorting, so
 * the UI gets 0% network latency, 0 permissions errors, and 100% offline
 * availability (and no PGRST205 "table not in schema cache" failures).
 */
function toFacility(h: HospitalFacility): Facility {
  return {
    id: h.id,
    name: h.name,
    campus: h.county,
    district: h.district,
    county: h.county,
    facility_type: h.facility_type,
    latitude: h.latitude,
    longitude: h.longitude,
    is_emergency: h.is_emergency,
    agency: h.agency,
    level: h.level,
  };
}

/**
 * Load the full Kenyan facility directory (1,438+ facilities) synchronously
 * from the static local dataset in `src/data/hospitals-data.ts`.
 *
 * Synchronous on purpose: there is nothing to fetch, so callers get the whole
 * directory instantly and can filter/sort on every keystroke or GPS update.
 *
 * @param onlyEmergency When true, only facilities flagged as emergency are returned.
 */
export function getLocalFacilities(onlyEmergency = false): Facility[] {
  const source = onlyEmergency ? KENYA_HOSPITALS.filter((h) => h.is_emergency) : KENYA_HOSPITALS;
  return source.map(toFacility);
}

/** Major referral hospitals (used as quick-pick options for lab orders). */
export const FALLBACK_FACILITIES: Facility[] = [
  {
    id: "fallback-knh",
    name: "Kenyatta National Hospital (KNH)",
    district: "Nairobi",
    county: "Nairobi",
    facility_type: "National Referral Hospital",
    latitude: -1.3015,
    longitude: 36.8066,
    phone: "+254 20 272 6300",
    is_emergency: true,
    agency: "Ministry of Health",
    level: "Level 6",
    ownership: "public",
  },
  {
    id: "fallback-mtrh",
    name: "Moi Teaching and Referral Hospital (MTRH)",
    district: "Eldoret",
    county: "Uasin Gishu",
    facility_type: "National Referral Hospital",
    latitude: 0.5143,
    longitude: 35.2797,
    phone: "+254 53 203 3471",
    is_emergency: true,
    agency: "Ministry of Health",
    level: "Level 6",
    ownership: "public",
  },
  {
    id: "fallback-cgth",
    name: "Coast General Teaching & Referral Hospital",
    district: "Changamwe",
    county: "Kilifi",
    facility_type: "County Referral Hospital",
    latitude: -3.9886,
    longitude: 39.9406,
    phone: "+254 41 231 4204",
    is_emergency: true,
    agency: "Ministry of Health",
    level: "Level 5",
    ownership: "public",
  },
  {
    id: "fallback-joothr",
    name: "Jaramogi Oginga Odinga Teaching & Referral Hospital",
    district: "Kisumu",
    county: "Kisumu",
    facility_type: "County Referral Hospital",
    latitude: -0.0917,
    longitude: 34.7679,
    phone: "+254 57 202 0801",
    is_emergency: true,
    agency: "Ministry of Health",
    level: "Level 5",
    ownership: "public",
  },
  {
    id: "fallback-nakuru",
    name: "Nakuru Level 5 Teaching & Referral Hospital",
    district: "Nakuru",
    county: "Nakuru",
    facility_type: "County Referral Hospital",
    latitude: -0.2858,
    longitude: 36.0664,
    phone: "+254 51 221 5580",
    is_emergency: true,
    agency: "Ministry of Health",
    level: "Level 5",
    ownership: "public",
  },
];

/**
 * Calculates distance between two coordinates in Kilometers (Haversine formula)
 */
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(1));
}

/**
 * Generates Google Maps Turn-by-Turn Navigation URL
 */
export function getGoogleMapsDirectionsUrl(
  destinationLat: number,
  destinationLng: number,
  userLat?: number,
  userLng?: number,
): string {
  if (userLat && userLng) {
    return `https://www.google.com/maps/dir/?api=1&origin=${userLat},${userLng}&destination=${destinationLat},${destinationLng}&travelmode=walking`;
  }
  return `https://www.google.com/maps/search/?api=1&query=${destinationLat},${destinationLng}`;
}
