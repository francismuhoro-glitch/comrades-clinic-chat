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
  facility_name?: string;
  "Facility Type"?: string;
  facility_type?: string;
  type?: string;
  District?: string;
  district?: string;
  Province?: string;
  LOCATION?: string;
  location?: string;
  campus?: string;
  Campus?: string;
  County?: string;
  county?: string;
  Latitude?: number | string;
  latitude?: number | string;
  lat?: number | string;
  Longitude?: number | string;
  longitude?: number | string;
  lng?: number | string;
  lon?: number | string;
  Agency?: string;
  agency?: string;
  Phone?: string;
  phone?: string;
  telephone?: string;
  is_emergency?: boolean;
  emergency?: boolean;
  Level?: string;
  level?: string;
  facility_level?: string;
  Ownership?: string;
  ownership?: string;
  owner?: string;
}

type SupabaseLike = {
  from: (table: string) => {
    select: (columns: string) => {
      eq: (column: string, value: unknown) => any;
      range: (from: number, to: number) => Promise<{ data: unknown[] | null; error: { message?: string } | null }>;
      limit?: (count: number) => Promise<{ data: unknown[] | null; error: { message?: string } | null }>;
    };
  };
};

const PAGE_SIZE = 1000;
const FACILITY_TABLES = ["campus_facilities", "hospitals", "facilities"] as const;

/** Normalize the different column names used by the facility uploads. */
export function normalizeFacility(row: RawKMHFLFacility): Facility {
  const record = row as Record<string, unknown>;
  const value = (keys: string[]) =>
    keys
      .map((key) => record[key])
      .find((v) => v !== null && v !== undefined && v !== "");

  const toNumber = (raw: unknown): number => {
    if (typeof raw === "number" && Number.isFinite(raw)) return raw;
    if (typeof raw === "string" && raw.trim() !== "") {
      const n = Number(raw);
      return Number.isFinite(n) ? n : 0;
    }
    return 0;
  };

  return {
    id: String(value(["id"]) || ""),
    name: String(
      value(["Facility Name", "facility_name", "name", "Name"]) || "Medical Facility",
    ),
    campus: String(value(["campus", "Campus", "county", "County"]) || ""),
    district: String(
      value([
        "District",
        "district",
        "LOCATION",
        "location",
        "County",
        "county",
        "Province",
      ]) || "Kenya",
    ),
    facility_type: String(
      value(["Facility Type", "facility_type", "type", "Type"]) || "Hospital",
    ),
    latitude: toNumber(value(["Latitude", "latitude", "lat", "LATITUDE"])),
    longitude: toNumber(value(["Longitude", "longitude", "lng", "lon", "LONGITUDE"])),
    phone: String(value(["Phone", "phone", "telephone"]) || ""),
    agency: String(value(["Agency", "agency", "owner", "ownership", "Ownership"]) || "Health Provider"),
    level: String(value(["Level", "level", "facility_level"]) || ""),
    ownership: String(value(["Ownership", "ownership"]) || ""),
    is_emergency: Boolean(value(["is_emergency", "emergency"]) || false),
  };
}

/**
 * Page through a single Supabase table until all rows are loaded.
 * Supabase defaults to a max of ~1000 rows per request; campus_facilities has 1,438+.
 */
async function fetchAllRows(
  supabaseClient: SupabaseLike,
  table: string,
  onlyEmergency = false,
): Promise<RawKMHFLFacility[] | null> {
  const all: RawKMHFLFacility[] = [];
  let from = 0;

  for (;;) {
    let query: any = supabaseClient.from(table).select("*");
    if (onlyEmergency) {
      query = query.eq("is_emergency", true);
    }
    const { data, error } = await query.range(from, from + PAGE_SIZE - 1);

    if (error) {
      // Table missing / column missing / RLS — try next table name.
      return null;
    }
    if (!data?.length) {
      break;
    }

    all.push(...(data as RawKMHFLFacility[]));
    if (data.length < PAGE_SIZE) {
      break;
    }
    from += PAGE_SIZE;
  }

  return all;
}

/**
 * Load the full Kenyan facility directory from Supabase `campus_facilities`
 * (falling back to legacy table names). Normalizes capitalized KMHFL columns:
 * "Facility Name", "Facility Type", "District", "LOCATION", "Latitude", "Longitude".
 */
export async function loadFacilitiesFromSupabase(
  supabaseClient: SupabaseLike,
  onlyEmergency = false,
): Promise<Facility[]> {
  for (const table of FACILITY_TABLES) {
    const rows = await fetchAllRows(supabaseClient, table, onlyEmergency);
    if (rows && rows.length > 0) {
      return rows.map(normalizeFacility);
    }
  }
  return [];
}

/** @deprecated Prefer loadFacilitiesFromSupabase — kept as a thin alias. */
export async function fetchFacilities(
  supabaseClient: SupabaseLike,
  onlyEmergency = false,
): Promise<Facility[]> {
  return loadFacilitiesFromSupabase(supabaseClient, onlyEmergency);
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
