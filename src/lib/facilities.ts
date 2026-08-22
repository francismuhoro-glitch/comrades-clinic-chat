export interface Facility {
  id?: string | undefined;
  name: string;
  campus?: string | undefined;
  district?: string | undefined;
  facility_type: string;
  latitude: number;
  longitude: number;
  phone?: string | undefined;
  is_emergency: boolean;
  agency?: string | undefined;
  level?: string | undefined;
  ownership?: string | undefined;
  distanceKm?: number | undefined;
}

export interface RawKMHFLFacility {
  id?: string;
  "Facility Name"?: string;
  name?: string;
  "Facility Type"?: string;
  facility_type?: string;
  District?: string;
  Province?: string;
  LOCATION?: string;
  campus?: string;
  Latitude?: number;
  latitude?: number;
  Longitude?: number;
  longitude?: number;
  Agency?: string;
  is_emergency?: boolean;
  level?: string;
  ownership?: string;
}

/** Normalize the different column names used by the facility uploads. */
export function normalizeFacility(row: RawKMHFLFacility): Facility {
  const value = (keys: string[]) => keys.map((key) => (row as Record<string, unknown>)[key]).find((v) => v !== null && v !== undefined && v !== "");
  return {
    id: String(value(["id"]) || ""),
    name: String(value(["Facility Name", "facility_name", "name"]) || "Medical Facility"),
    campus: String(value(["campus", "Campus", "county", "County"]) || ""),
    district: String(value(["District", "district", "LOCATION", "location", "County", "county", "Province"]) || "Kenya"),
    facility_type: String(value(["Facility Type", "facility_type", "type"]) || "Hospital"),
    latitude: Number(value(["Latitude", "latitude", "lat"]) || 0),
    longitude: Number(value(["Longitude", "longitude", "lng", "lon"]) || 0),
    phone: String(value(["Phone", "phone", "telephone"]) || ""),
    agency: String(value(["Agency", "agency", "owner", "ownership"]) || "Health Provider"),
    level: String(value(["Level", "level", "facility_level"]) || ""),
    ownership: String(value(["Ownership", "ownership"]) || ""),
    is_emergency: Boolean(value(["is_emergency", "emergency"]) || false),
  };
}

/** Read whichever facility table is installed in this Supabase project. */
export async function fetchFacilities(supabaseClient: { from: (table: string) => any }, onlyEmergency = false): Promise<Facility[]> {
  for (const table of ["hospitals", "facilities", "campus_facilities"]) {
    let query = supabaseClient.from(table).select("*").limit(10000);
    if (onlyEmergency) query = query.eq("is_emergency", true);
    const { data, error } = await query;
    if (!error && data?.length) return (data as RawKMHFLFacility[]).map(normalizeFacility);
  }
  return [];
}

export const FALLBACK_FACILITIES: Facility[] = [
  {
    name: "Kenyatta National Hospital (KNH)",
    district: "Nairobi",
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
    name: "Moi Teaching and Referral Hospital (MTRH)",
    district: "Uasin Gishu",
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
    name: "Coast General Teaching & Referral Hospital",
    district: "Mombasa",
    facility_type: "County Referral Hospital",
    latitude: -4.0478,
    longitude: 39.6802,
    phone: "+254 41 231 4204",
    is_emergency: true,
    agency: "Ministry of Health",
    level: "Level 5",
    ownership: "public",
  },
  {
    name: "Jaramogi Oginga Odinga Teaching & Referral Hospital",
    district: "Kisumu",
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
    name: "Nakuru Level 5 Teaching & Referral Hospital",
    district: "Nakuru",
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
